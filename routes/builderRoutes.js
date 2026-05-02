const express = require('express');
const router = express.Router();
const { saveBuiltResume, getAllResumes, getResumeById, updateResume, deleteResume } = require('../controllers/builderController');

const { isAuthenticatedUser } = require('../middleware/authMiddleware');

// Secured routes
router.get('/', isAuthenticatedUser, getAllResumes);
router.post('/save', isAuthenticatedUser, saveBuiltResume);
router.get('/:id', isAuthenticatedUser, getResumeById);
router.put('/:id', isAuthenticatedUser, updateResume);
router.delete('/:id', isAuthenticatedUser, deleteResume);

module.exports = router;
