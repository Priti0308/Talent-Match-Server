const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeResume, downloadResume } = require('../controllers/resumeController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');
const Resume = require('../models/Resume');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } 
});

router.get('/history', isAuthenticatedUser, async (req, res) => {
  try {
    const history = await Resume.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch history" });
  }
});

router.post('/analyze', isAuthenticatedUser, upload.single('resume'), analyzeResume);
router.get('/download/:id', downloadResume);

// ALIAS ENDPOINTS requested for Resume Builder (maps to builderController)
const builderController = require('../controllers/builderController');
router.post('/create', isAuthenticatedUser, builderController.saveBuiltResume);
router.post('/ai-suggest', isAuthenticatedUser, builderController.suggestAIContent);
router.put('/update/:id', isAuthenticatedUser, builderController.updateResume);
router.delete('/:id', isAuthenticatedUser, builderController.deleteResume);
// The user requested GET /:userId to get all resumes for a user, our getAllResumes filters by req.user.id implicitly 
router.get('/:userId', isAuthenticatedUser, builderController.getAllResumes);

module.exports = router;