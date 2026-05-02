const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contact: { type: String, required: true },
  college: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'superadmin'],
    default: 'admin'
  },
  avatar: { type: String, default: "" },
  isApproved: { 
    type: Boolean, 
    default: false // Superadmins usually have to manually approve new Admin accounts
  },
  
  // 🎟️ INVITE CODE: Automatically generates something like "PROF-A1B2C3"
  teacherCode: {
    type: String,
    unique: true,
    default: () => 'PROF-' + Math.random().toString(36).substr(2, 6).toUpperCase()
  }
}, { timestamps: true });

// Password Hashing Middleware
adminSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return ;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

});

adminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export only the Admin model
module.exports = mongoose.model('Admin', adminSchema);