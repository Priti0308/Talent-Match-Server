const express = require('express');
const router = express.Router();
const { 
  handleApproval, 
  getPendingApprovals,
  updateUser,
  deleteUser,
  getApprovedAdmins,
  getAllStudents, // Integrated for Student Database view
  getAllAdmins,   // Integrated for Admin Database view
  getAllStudentResumes,
  getAllStudentInterviews,
  getAllAnalyzedResumes
} = require('../controllers/adminController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/authMiddleware');

// --- GLOBAL PROTECTION ---
// All routes below require a verified session
router.use(isAuthenticatedUser);

// --- 1. SEPARATE DATABASE VIEWS ---

// Route to fetch ONLY Students (role: 'user')
// Access: SuperAdmin sees all students; Admin sees students from their college
router.route('/students').get(authorizeRoles('admin', 'superadmin'), getAllStudents);

// Route to fetch ONLY Approved Admins/Teachers (role: 'admin')
// Access: Restricted to SuperAdmin for higher-level faculty oversight
router.route('/admins').get(authorizeRoles('superadmin'), getAllAdmins);

// Route to fetch all built resumes
router.route('/resumes/all').get(authorizeRoles('admin', 'superadmin'), getAllStudentResumes);

// Route to fetch all ATS analyzed resumes
router.route('/analyzed-resumes/all').get(authorizeRoles('admin', 'superadmin'), getAllAnalyzedResumes);

// Route to fetch all interviews
router.route('/interviews/all').get(authorizeRoles('admin', 'superadmin'), getAllStudentInterviews);


// --- 2. APPROVAL SYSTEM ---

// View accounts waiting for approval
router.route('/pending').get(authorizeRoles('admin', 'superadmin'), getPendingApprovals);

// Action: Approve or Reject a user via ID and Status
router.route('/approve').post(authorizeRoles('admin', 'superadmin'), handleApproval);


// --- 3. REGISTRY MANAGEMENT ---

// Modify user details (Identity Matrix)
router.route('/user/update').put(authorizeRoles('superadmin', 'admin'), updateUser);

// Permanent removal of a user or admin node
router.route('/user/delete/:id').delete(authorizeRoles('superadmin', 'admin'), deleteUser);

module.exports = router;