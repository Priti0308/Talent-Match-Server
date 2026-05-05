const BuiltResume = require('../models/BuiltResume');
const { GoogleGenAI } = require("@google/genai");


// CREATE: Save new resume
exports.saveBuiltResume = async (req, res) => {
  try {
    const { templateType, themeColor, personal, summary, experience, projects, education, skills, certifications, achievements } = req.body;

    if (!personal || !personal.name || !personal.title || !personal.email) {
      return res.status(400).json({ success: false, message: 'Name, Role Title, and Email are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personal.email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const resumeData = { templateType, themeColor, personal, summary, experience, projects, education, skills, certifications, achievements };

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required to save.' });
    }
    resumeData.userId = req.user.id;

    const savedResume = await BuiltResume.create(resumeData);

    res.status(201).json({ success: true, data: savedResume, message: 'Resume saved successfully!' });
  } catch (error) {
    console.error('Error saving built resume:', error);
    res.status(500).json({ success: false, message: 'Server error while saving resume.' });
  }
};

// READ: Get all resumes
exports.getAllResumes = async (req, res) => {
  try {
    let filter = { userId: req.user.id };
    
    if (req.user.role === 'admin') filter = {};
    else if (req.user.role === 'superadmin') filter = { _id: null }; // Superadmins don't see resumes
    
    const resumes = await BuiltResume.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: resumes });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch resumes.' });
  }
};

// READ: Get Single Resume
exports.getResumeById = async (req, res) => {
  try {
    const resume = await BuiltResume.findById(req.params.id);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    res.status(200).json({ success: true, data: resume });
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch resume.' });
  }
};

// UPDATE: Update existing resume
exports.updateResume = async (req, res) => {
  try {
    const { templateType, themeColor, personal, summary, experience, projects, education, skills, certifications, achievements } = req.body;
    
    const resumeData = { templateType, themeColor, personal, summary, experience, projects, education, skills, certifications, achievements };

    const updatedResume = await BuiltResume.findByIdAndUpdate(req.params.id, resumeData, {
      returnDocument: 'after',
      runValidators: true
    });

    if (!updatedResume) return res.status(404).json({ success: false, message: 'Resume not found to update.' });

    res.status(200).json({ success: true, data: updatedResume, message: 'Resume updated successfully!' });
  } catch (error) {
    console.error('Error updating resume:', error);
    res.status(500).json({ success: false, message: 'Failed to update resume.' });
  }
};

// DELETE: Delete existing resume
exports.deleteResume = async (req, res) => {
  try {
    const deletedResume = await BuiltResume.findByIdAndDelete(req.params.id);
    if (!deletedResume) return res.status(404).json({ success: false, message: 'Resume not found.' });

    res.status(200).json({ success: true, message: 'Resume deleted forever.' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ success: false, message: 'Failed to delete resume.' });
  }
};

// AI: Suggest better content
exports.suggestAIContent = async (req, res) => {
  try {
    const { section, currentText, role, skills } = req.body;
    let prompt = '';

    if (section === 'summary') {
      prompt = `You are an expert Resume Writer focusing on ATS optimization.
Write a powerful 3-4 sentence professional summary.
Candidate Role: ${role || 'Professional'}
Key Skills: ${skills ? skills.join(', ') : 'modern tools'}
Current draft (if any): ${currentText || ''}
Return ONLY the newly polished text without any quotes or explanations.`;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid section' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt
    });
    
    let suggestion = result.text.trim();
    suggestion = suggestion.replace(/^"+|"+$/g, '').replace(/(\*\*|__)/g, '');

    res.status(200).json({ success: true, text: suggestion });
  } catch (error) {
    console.error('Error generating AI suggestion:', error);
    res.status(500).json({ success: false, message: 'AI generation failed.' });
  }
};
