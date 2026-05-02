// const User = require('../models/User');
// const Admin = require('../models/Admin'); // Ensure Admin is imported correctly based on your separation
// const BuiltResume = require('../models/BuiltResume');
// const Interview = require('../models/Interview');
// const Resume = require('../models/Resume');

// // --- 1. GET ALL STUDENTS ---
// exports.getAllStudents = async (req, res) => {
//   try {
//     // Superadmin sees all users. Admin sees ONLY users linked to their specific _id.
//     const query = req.user.role === 'superadmin' 
//       ? { role: 'user' } 
//       : { role: 'user', adminId: req.user._id }; 

//     const students = await User.find(query).select('-password');
//     res.status(200).json({ success: true, count: students.length, data: students });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // --- 2. GET ALL ADMINS (FACULTY) ---
// // (Superadmin only function)
// exports.getAllAdmins = async (req, res) => {
//   try {
//     const admins = await Admin.find({ role: 'admin', isApproved: true }).select('-password');
//     res.status(200).json({ success: true, count: admins.length, data: admins });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // --- 3. HANDLE APPROVAL ---
// exports.handleApproval = async (req, res) => {
//   try {
//     const { userId, status } = req.body;
//     if (!userId) return res.status(400).json({ message: "User ID is required" });

//     if (status === true) {
//       let updatedUser = await Admin.findByIdAndUpdate(userId, { isApproved: true }, { returnDocument: 'after' });

//       if (!updatedUser) {
//         updatedUser = await User.findByIdAndUpdate(userId, { isApproved: true }, { returnDocument: 'after' });
//       }

//       if (!updatedUser) return res.status(404).json({ message: "User not found" });

//       return res.status(200).json({ success: true, message: "Approved successfully" });
//     } else {
//       const deleted = await Admin.findByIdAndDelete(userId) || await User.findByIdAndDelete(userId);
//       if (!deleted) return res.status(404).json({ message: "User not found" });
//       return res.status(200).json({ success: true, message: "Rejected and deleted" });
//     }
//   } catch (error) {
//     console.error("Approval Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // --- 4. GET PENDING APPROVALS ---
// exports.getPendingApprovals = async (req, res) => {
//   try {
//     let pending;
//     if (req.user.role === 'superadmin') {
//       // SuperAdmin views unapproved Faculty from 'admins' collection
//       pending = await Admin.find({ role: 'admin', isApproved: false }).select('-password');
//     } else {
//       // College Admin views unapproved Students tied to their specific adminId
//       pending = await User.find({ 
//         role: 'user', 
//         isApproved: false, 
//         adminId: req.user._id // Multi-tenant strict filtering
//       }).select('-password');
//     }
//     res.status(200).json({ success: true, data: pending });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // --- 5. UPDATE USER ---
// exports.updateUser = async (req, res) => {
//   try {
//     const { userId, name, email, contact, college, course, password, avatar } = req.body;

//     const updateData = {};
//     if (name) updateData.name = name;
//     if (email) updateData.email = email;
//     if (contact) updateData.contact = contact;
//     if (college) updateData.college = college;
//     if (course) updateData.course = course;
//     if (avatar) updateData.avatar = avatar;
//     if (password) updateData.password = password; 

//     let user = await Admin.findByIdAndUpdate(userId, updateData, { returnDocument: 'after' });

//     if (!user) {
//       user = await User.findByIdAndUpdate(userId, updateData, { returnDocument: 'after' });
//     }

//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     res.status(200).json({ 
//       success: true, 
//       message: "User Updated Successfully", 
//       data: user 
//     });
//   } catch (error) {
//     console.error("Update Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // --- 6. DELETE USER ---
// exports.deleteUser = async (req, res) => {
//   try {
//     const deletedUser = await User.findByIdAndDelete(req.params.id) || 
//                         await Admin.findByIdAndDelete(req.params.id);

//     if (!deletedUser) return res.status(404).json({ message: "User not found" });
//     res.status(200).json({ success: true, message: "User Deleted" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // --- 7. GET ALL RESUMES ---
// exports.getAllStudentResumes = async (req, res) => {
//   try {
//     let matchQuery = {};
//     if (req.user.role === 'admin') {
//       // Find students belonging to this specific admin, then get their built resumes
//       const students = await User.find({ adminId: req.user._id }).select('_id');
//       matchQuery = { userId: { $in: students.map(s => s._id) } };
//     }
//     const resumes = await BuiltResume.find(matchQuery)
//       .populate('userId', 'name email college course role')
//       .sort({ createdAt: -1 });
//     res.status(200).json({ success: true, count: resumes.length, data: resumes });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // --- 8. GET ALL INTERVIEWS ---
// exports.getAllStudentInterviews = async (req, res) => {
//   try {
//     let matchQuery = {};
//     if (req.user.role === 'admin') {
//       // Find students belonging to this specific admin, then get their interviews
//       const students = await User.find({ adminId: req.user._id }).select('_id');
//       matchQuery = { user: { $in: students.map(s => s._id) } };
//     }
//     const interviews = await Interview.find(matchQuery)
//       .populate('user', 'name email college course role')
//       .sort({ createdAt: -1 });
//     res.status(200).json({ success: true, count: interviews.length, data: interviews });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // --- 9. GET ALL ANALYZED RESUMES (ATS REPORTS) ---
// exports.getAllAnalyzedResumes = async (req, res) => {
//   try {
//     let matchQuery = {};
//     if (req.user.role === 'admin') {
//       // Find students belonging to this specific admin, then get their analyzed resumes
//       const students = await User.find({ adminId: req.user._id }).select('_id');
//       matchQuery = { userId: { $in: students.map(s => s._id) } };
//     }
//     const analyzed = await Resume.find(matchQuery)
//       .populate('userId', 'name email college course role')
//       .sort({ createdAt: -1 });
//     res.status(200).json({ success: true, count: analyzed.length, data: analyzed });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }

// };

const User = require('../models/User');
const Admin = require('../models/Admin');
const BuiltResume = require('../models/BuiltResume');
const Interview = require('../models/Interview');
const Resume = require('../models/Resume');

// --- 1. GET ALL STUDENTS ---
exports.getAllStudents = async (req, res) => {
  try {
    const query = req.user.role === 'superadmin'
      ? { role: 'user' }
      : { role: 'user', adminId: req.user._id };

    const students = await User.find(query).select('-password');
    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 2. GET ALL ADMINS (FACULTY) ---
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({ role: 'admin', isApproved: true }).select('-password');
    res.status(200).json({ success: true, count: admins.length, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 3. HANDLE APPROVAL ---
exports.handleApproval = async (req, res) => {
  try {
    const { userId, status } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    if (status === true) {
      let updatedUser = await Admin.findByIdAndUpdate(userId, { isApproved: true }, { returnDocument: 'after' });

      if (!updatedUser) {
        updatedUser = await User.findByIdAndUpdate(userId, { isApproved: true }, { returnDocument: 'after' });
      }

      if (!updatedUser) return res.status(404).json({ message: "User not found" });

      return res.status(200).json({ success: true, message: "Approved successfully" });
    } else {
      const deleted = await Admin.findByIdAndDelete(userId) || await User.findByIdAndDelete(userId);
      if (!deleted) return res.status(404).json({ message: "User not found" });
      return res.status(200).json({ success: true, message: "Rejected and deleted" });
    }
  } catch (error) {
    console.error("Approval Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 4. GET PENDING APPROVALS ---
exports.getPendingApprovals = async (req, res) => {
  try {
    let pending;
    if (req.user.role === 'superadmin') {
      pending = await Admin.find({ role: 'admin', isApproved: false }).select('-password');
    } else {
      pending = await User.find({
        role: 'user',
        isApproved: false,
        adminId: req.user._id
      }).select('-password');
    }
    res.status(200).json({ success: true, data: pending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 5. UPDATE USER ---
exports.updateUser = async (req, res) => {
  try {
    const { userId, name, email, contact, college, course, password, avatar } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (contact) updateData.contact = contact;
    if (college) updateData.college = college;
    if (course) updateData.course = course;
    if (avatar) updateData.avatar = avatar;
    if (password) updateData.password = password;

    let user = await Admin.findByIdAndUpdate(userId, updateData, { new: true });

    if (!user) {
      user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User Updated Successfully",
      data: user
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ success: false, message: "Profile update failed. Make sure server limit for body is high enough for Base64 avatars." });
  }
};

// --- 6. DELETE USER ---
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id) ||
      await Admin.findByIdAndDelete(req.params.id);

    if (!deletedUser) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ success: true, message: "User Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 7. GET ALL RESUMES ---
exports.getAllStudentResumes = async (req, res) => {
  try {
    let matchQuery = {};
    if (req.user.role === 'admin') {
      const students = await User.find({ adminId: req.user._id }).select('_id');
      matchQuery = { userId: { $in: students.map(s => s._id) } };
    }
    const resumes = await BuiltResume.find(matchQuery)
      .populate('userId', 'name email college course role')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: resumes.length, data: resumes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 8. GET ALL INTERVIEWS ---
exports.getAllStudentInterviews = async (req, res) => {
  try {
    let matchQuery = {};
    if (req.user.role === 'admin') {
      const students = await User.find({ adminId: req.user._id }).select('_id');
      matchQuery = { user: { $in: students.map(s => s._id) } };
    }
    const interviews = await Interview.find(matchQuery)
      .populate('user', 'name email college course role')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: interviews.length, data: interviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 9. GET ALL ANALYZED RESUMES (ATS REPORTS) ---
exports.getAllAnalyzedResumes = async (req, res) => {
  try {
    let matchQuery = {};
    if (req.user.role === 'admin') {
      const students = await User.find({ adminId: req.user._id }).select('_id');
      matchQuery = { userId: { $in: students.map(s => s._id) } };
    }
    const analyzed = await Resume.find(matchQuery)
      .populate('userId', 'name email college course role')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: analyzed.length, data: analyzed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};