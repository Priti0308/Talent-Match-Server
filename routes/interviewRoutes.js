const express = require("express");
const multer = require("multer");
const {
  startInterview,
  analyzeRound,
  finalizeInterview,
  getHistory
} = require("../controllers/interviewController");
const { isAuthenticatedUser } = require("../middleware/authMiddleware");

const router = express.Router();

// Multer config
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

/**
 * 🚀 UPDATED ROUTES (MATCH FRONTEND)
 */

// ✅ 1. Start Interview
// frontend: /api/interview/startInterview
router.post("/startInterview", isAuthenticatedUser, upload.single("resume"), startInterview);

// ✅ 2. Analyze Round
// frontend: /api/interview/analyzeRound
router.post("/analyzeRound", isAuthenticatedUser, analyzeRound);

// ✅ 3. Final Result
// frontend: /api/interview/finalizeInterview
router.post("/finalizeInterview", isAuthenticatedUser, finalizeInterview);

// ✅ 4. Get History
// frontend: /api/interview/history
router.get("/history", isAuthenticatedUser, getHistory);

// 🧑‍💻 4. CODE EXECUTION - NEW LOCAL COMPILER
// router.post('/execute',executeCode);

module.exports = router;
