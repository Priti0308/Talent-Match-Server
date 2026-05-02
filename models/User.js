// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   contact: { type: String, required: true },
//   college: { type: String, required: true },
//   course: {
//     type: String,
//     required: function () { return this.role === 'user'; }
//   },
//   password: { type: String, required: true },
//   role: {
//     type: String,
//     enum: ['user', 'admin', 'superadmin'],
//     default: 'user'
//   },
//   isApproved: {
//     type: Boolean,
//     default: function () { return this.role === 'user'; }
//   }
// }, { timestamps: true });

// // Password Hashing Middleware
// userSchema.pre('save', async function () {
//   // 1. If password isn't modified, move to the next middleware
//   if (!this.isModified('password')) {
//     return;
//   }

//   // 2. Generate salt and hash the password
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });
// userSchema.methods.comparePassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// // --- PHYSICAL SEPARATION ---
// // This creates a 'users' collection for students
// const User = mongoose.model('User', userSchema, 'users');

// // This creates an 'admins' collection for teachers and superadmins
// const Admin = mongoose.model('Admin', userSchema, 'admins');

// module.exports = { User, Admin };


const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contact: { type: String, required: true },
  college: { type: String, required: true },
  course: { type: String, required: true }, // Always required for students
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  avatar: { type: String, default: '' },
  
  // 🔗 LINK TO TEACHER: This connects the student to their specific Admin
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin', 
    default: null 
  }
}, { timestamps: true });

// Password Hashing Middleware
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return ;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export only the User model
module.exports = mongoose.model('User', userSchema);