const User = require('../models/User');     // Updated import for separated User schema
const Admin = require('../models/Admin');   // Updated import for separated Admin schema
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Helper to send token
const sendToken = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { 
    expiresIn: '7d' 
  });
  res.status(statusCode).json({ success: true, token, user });
};

// --- REGISTER ---
exports.registerUser = async (req, res) => {
  try {
    // 🚨 ADDED teacherCode to the destructured body
    const { name, email, contact, college, course, password, role, teacherCode } = req.body;

    if (role === 'user') {
      // 🎓 STUDENT REGISTRATION LOGIC
      let assignedAdminId = null;

      // Check if they provided an invite link code
      if (teacherCode) {
        const admin = await Admin.findOne({ teacherCode: teacherCode });
        if (admin) {
          assignedAdminId = admin._id; // Link the student to this teacher
        } else {
          return res.status(400).json({ success: false, message: "Invalid Teacher Code provided." });
        }
      }

      // Create the Student
      const user = await User.create({
        name, 
        email, 
        contact, 
        college, 
        course, 
        password, 
        role,
        adminId: assignedAdminId // 🚨 Saves the connection to the database
      });

      return res.status(201).json({ success: true, message: "Registration successful." });

    } else {
      // 👨‍🏫 ADMIN / SUPERADMIN REGISTRATION LOGIC
      const admin = await Admin.create({
        name, 
        email, 
        contact, 
        college, 
        password, // Notice: 'course' is removed because Admins don't need it
        role, 
        isApproved: false // Admins need manual approval by default
      });

      return res.status(201).json({ success: true, message: "Registration successful. Awaiting approval." });
    }

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Email is already registered. Please login or use a different email." });
    }
    res.status(400).json({ success: false, message: error.message || "Registration failed due to invalid data." });
  }
};

// --- LOGIN ---
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    let person = await User.findOne({ email }).select('+password') || 
                 await Admin.findOne({ email }).select('+password');

    if (!person || !(await person.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (person.role === 'admin' && !person.isApproved) {
      return res.status(403).json({ message: "Account pending approval." });
    }

    sendToken(person, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- WHATSAPP RESET ---
exports.requestResetLink = async (req, res) => {
  try {
    const { contact } = req.body;
    let user = await User.findOne({ contact }) || await Admin.findOne({ contact });
    if (!user) return res.status(404).json({ message: "Contact not registered" });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    res.status(200).json({ success: true, resetUrl: `http://localhost:5173/reset-password/${resetToken}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- RESET PASSWORD ---
exports.resetPasswordController = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    let user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpire: { $gt: Date.now() } }) ||
               await Admin.findOne({ resetPasswordToken: hashedToken, resetPasswordExpire: { $gt: Date.now() } });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.password = req.body.newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password updated!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- GOOGLE AUTH ---
exports.googleAuth = async (req, res) => {
  try {
    // 🚨 ADDED teacherCode just in case your frontend passes it during Google Sign-In
    const { name, email, teacherCode } = req.body;
    let user = await User.findOne({ email }) || await Admin.findOne({ email });

    if (!user) {
      let assignedAdminId = null;

      if (teacherCode) {
        const admin = await Admin.findOne({ teacherCode: teacherCode });
        if (admin) assignedAdminId = admin._id;
      }

      user = await User.create({ 
        name, 
        email, 
        contact: "Google", 
        college: "N/A", 
        course: "N/A", // Added because User schema requires it
        password: Math.random().toString(), 
        role: "user",
        adminId: assignedAdminId // Links Google users to teachers too!
      });
    }
    sendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- GET PROFILE ---
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password') || 
                 await Admin.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- UPDATE PROFILE ---
exports.updateProfile = async (req, res) => {
  try {
    const { name, contact, college, course, avatar } = req.body;
    let user = await User.findById(req.user.id);
    
    if (user) {
      user.name = name || user.name;
      user.contact = contact || user.contact;
      user.college = college || user.college;
      user.course = course || user.course;
      if (avatar !== undefined) user.avatar = avatar;
      await user.save();
      return res.status(200).json({ success: true, user });
    }

    let admin = await Admin.findById(req.user.id);
    if (admin) {
      admin.name = name || admin.name;
      admin.contact = contact || admin.contact;
      admin.college = college || admin.college;
      if (avatar !== undefined) admin.avatar = avatar;
      await admin.save();
      return res.status(200).json({ success: true, user: admin });
    }

    res.status(404).json({ success: false, message: "User not found" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};