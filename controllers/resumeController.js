const { GoogleGenAI } = require("@google/genai");
const pdfParse = require("pdf-parse");
const Resume = require("../models/Resume");

exports.analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No resume uploaded" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Server configuration error: API Key missing" });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.trim();

    if (!resumeText) {
      return res.status(400).json({ error: "Could not extract text from PDF. Ensure it's not an image." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
You are an expert ATS (Applicant Tracking System) and HR professional. 
Analyze the following resume based on Enhancv's methodology.
Return ONLY a valid JSON object.

{
  "atsScore": number,
  "parseRate": "string",
  "summary": "string",
  "skillsMatched": ["array"],
  "missingKeywords": ["array"],
  "strengths": ["array"],
  "weaknesses": ["array"],
  "suggestions": ["array"],
  "interviewQuestions": ["array of exactly 5 strings"],
  "atsFactors": [
    { "name": "Keyword match (job description)", "score": number },
    { "name": "Relevant skills", "score": number },
    { "name": "Clean ATS-friendly format", "score": number },
    { "name": "Strong projects/experience", "score": number },
    { "name": "Measurable achievements", "score": number },
    { "name": "No spelling/grammar errors", "score": number },
    { "name": "Proper sections (Skills, Experience, Education)", "score": number }
  ]
}

Resume Content:
${resumeText.substring(0, 3000)}
`;

    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const aiResponse = result.text;

    try {
      const start = aiResponse.indexOf("{");
      const end = aiResponse.lastIndexOf("}") + 1;
      const jsonContent = aiResponse.substring(start, end);
      const parsedData = JSON.parse(jsonContent);

      if (req.user) {
        const newResume = new Resume({
          userId: req.user._id,
          fileName: req.file.originalname || "Uploaded Resume",
          fileSize: req.file.size || 0,
          fileData: req.file.buffer,
          contentType: req.file.mimetype,
          atsScore: parsedData.atsScore || 0,
          skillsMatched: parsedData.skillsMatched || [],
          missingKeywords: parsedData.missingKeywords || [],
          atsFactors: parsedData.atsFactors || [],
          strengths: parsedData.strengths || [],
          weaknesses: parsedData.weaknesses || [],
          suggestions: parsedData.suggestions || [],
          interviewQuestions: parsedData.interviewQuestions || []
        });
        await newResume.save();
      }

      res.json(parsedData);
    } catch (parseErr) {
      console.error("JSON Parse Error:", aiResponse);
      res.status(500).json({ error: "AI response was not in valid JSON format" });
    }

  } catch (error) {
    console.error("Controller Error:", error);

    if (error.message?.includes("429")) {
      return res.status(429).json({ error: "AI Rate limit reached. Try again in 30 seconds." });
    }

    res.status(500).json({ error: "Internal Server Error during analysis", details: error.message });
  }
};

exports.downloadResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume || !resume.fileData) {
      return res.status(404).json({ error: "Resume file not found" });
    }
    
    // Set headers to trigger file download
    res.set('Content-Type', resume.contentType || 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="${resume.fileName}"`);
    res.send(resume.fileData);
  } catch (err) {
    console.error("Download Error:", err);
    res.status(500).json({ error: "Failed to download resume" });
  }
};