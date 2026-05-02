const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  requestResetLink, 
  resetPasswordController,
  googleAuth,
  getProfile,
  updateProfile
} = require('../controllers/authController'); 
const { isAuthenticatedUser } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/request-reset', requestResetLink);
router.post('/reset-password/:token', resetPasswordController);
router.post('/google-auth', googleAuth); // This is likely line 19

router.get('/profile', isAuthenticatedUser, getProfile);
router.put('/profile', isAuthenticatedUser, updateProfile);

module.exports = router;