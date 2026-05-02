const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require("pdf-parse");
const Interview = require("../models/Interview"); // Ensure this path is correct for your project

// --- HELPER FUNCTION: Clean and Parse JSON ---
const parseJSON = (text) => {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
};

// --- HELPER FUNCTION: AI Generation with Retry Logic ---
// This handles 503 High Demand errors gracefully without crashing the app
const generateWithRetry = async (model, prompt, retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      if (error.status === 503 && i < retries - 1) {
        console.warn(`[AI Traffic Spike] Retrying in ${delay / 1000}s... (Attempt ${i + 1} of ${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff (2s, 4s, 8s)
      } else {
        throw error; // Throw if it's not a 503 or if out of retries
      }
    }
  }
};

// 1. START INTERVIEW
exports.startInterview = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No resume file uploaded. Please upload a PDF." });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.trim().substring(0, 5000);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro", // Fast & stable for large JSON generation
      generationConfig: { responseMimeType: "application/json", candidateCount: 1 }
    });

    const prompt = `
      You are an expert AI Recruitment Officer. Analyze this resume and generate a complete interview dataset.
      
      TASK:
      1. Field Identification: Decide if the candidate is "MCA" (Technical) or "MBA" (Management).
      2. Aptitude (45 Qs): Generate 15 Numerical, 15 Verbal, and 15 Reasoning MCQs.
      3. Tech MCQ (MCA ONLY - 20 Qs): Auto-detect languages/frameworks from resume (Java, Python, SQL, React, etc.)
         and generate 20 MCQs testing technical knowledge in those specific areas. If the candidate is "MBA", return an empty array [] for tech_mcq.
      4. Interview Rounds:
         - 20 Resume-based technical questions about their own projects, education, and experience.
         - 20 HR/Behavioral situational questions.

      STRICT JSON OUTPUT FORMAT:
      {
        "field": "MCA" | "MBA",
        "detectedLanguages": "Java, Python, SQL" (MCA only - comma separated),
        "aptitude": [
          { "id": 1, "section": "Numerical", "question": "...", "options": ["A","B","C","D"], "correct": "A" }
        ],
        "tech_mcq": [
          {
            "id": 1,
            "language": "Python",
            "difficulty": "Medium",
            "question": "...",
            "code": null,
            "options": ["A","B","C","D"],
            "correct": "B"
          }
        ],
        "technical_questions": ["Q1 about your project...", "Q2 about your education...", ...],
        "hr_questions": ["Tell me about yourself...", "Describe a challenge...", ...]
      }

      RESUME CONTENT:
      ${resumeText}
    `;

    // Use our retry helper
    const result = await generateWithRetry(model, prompt);
    const responseData = parseJSON(result.response.text());
    res.status(200).json(responseData);

  } catch (error) {
    console.error("Start Interview Error:", error);
    res.status(500).json({ error: "Internal Server Error: Failed to generate interview profile." });
  }
};

// 2. ANALYZE ROUND
exports.analyzeRound = async (req, res) => {
  try {
    const { roundName, questions, answers, field } = req.body;
    if (!roundName || !questions || !answers) {
      return res.status(400).json({ error: "Missing required data for analysis." });
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro", // Fast for quick grading
      generationConfig: { responseMimeType: "application/json" }
    });
    
    const prompt = `
      Analyze the ${roundName} performance for an ${field} student.
      Questions: ${JSON.stringify(questions)}
      User Answers: ${JSON.stringify(answers)}
      Evaluate based on accuracy (for MCQs) and depth/logic/confidence (for Technical/HR).
      Return ONLY this JSON:
      { "score": number(0-100), "status": "Qualified"|"Not Qualified", "feedback": ["point1","point2"], "summary": "Short paragraph" }
    `;
    
    const result = await generateWithRetry(model, prompt);
    res.status(200).json(parseJSON(result.response.text()));
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze the interview round." });
  }
};

// 3. FINALIZE INTERVIEW
exports.finalizeInterview = async (req, res) => {
  try {
    const { allRoundResults, field } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro", // Pro model for deep reasoning and detailed hiring dossiers
      generationConfig: { responseMimeType: "application/json" }
    });
    
    const prompt = `
      Provide a final recruitment decision for this ${field} candidate.
      Previous Round Stats: ${JSON.stringify(allRoundResults)}
      Return ONLY JSON:
      {
        "finalScore": number,
        "isShortlisted": boolean,
        "suggestedRoles": ["Role A","Role B","Role C"],
        "hiringDossier": "A detailed executive summary for the hiring manager.",
        "skillsToImprove": ["Skill 1","Skill 2"]
      }
    `;
    
    const result = await generateWithRetry(model, prompt);
    const parsedData = parseJSON(result.response.text());

    if (req.user) {
      const hrScore = allRoundResults.hr?.score || 0;
      const techScore = allRoundResults.techMCQ?.score || allRoundResults.resume?.score || 0;
      const newInterview = new Interview({
        user: req.user._id,
        transcript: [], 
        timeStats: { totalDurationSeconds: 1800, questionWise: [] },
        analysis: {
          communicationScore: hrScore,
          confidenceScore: hrScore,
          technicalAccuracy: techScore,
          fillerWordCount: 0,
          detectedFillerWords: [],
          suggestions: parsedData.skillsToImprove || [],
        },
        status: "Completed",
      });
      await newInterview.save();
    }

    res.status(200).json(parsedData);
  } catch (error) {
    console.error("Finalize Error:", error);
    res.status(500).json({ error: "Final report generation failed." });
  }
};