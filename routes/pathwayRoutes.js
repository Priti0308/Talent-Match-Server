const express = require('express');
const router = express.Router();
const { savePathwayResult, getMyPathwayResult, getAllPathwayStats } = require('../controllers/pathwayController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');

router.post('/save', isAuthenticatedUser, savePathwayResult);
router.get('/my-result', isAuthenticatedUser, getMyPathwayResult);
router.get('/stats', isAuthenticatedUser, getAllPathwayStats);

module.exports = router;
