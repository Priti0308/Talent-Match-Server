const mongoose = require('mongoose');

const BuiltResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous users to build for now
  },
  templateType: {
    type: String,
    default: 'modern'
  },
  themeColor: { type: String, default: '#6366f1' },
  personal: {
    photo: { type: String },
    name: { type: String, required: true },
    title: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    location: { type: String },
    github: { type: String },
    linkedin: { type: String }
  },
  summary: {
    type: String
  },
  experience: [{
    role: String,
    company: String,
    date: String,
    desc: String
  }],
  projects: [{
    name: String,
    year: String,
    desc: String
  }],
  education: [{
    degree: String,
    school: String,
    year: String,
    score: String
  }],
  skills: [{
    type: String
  }],
  certifications: [{
    name: String,
    issuer: String,
    year: String
  }],
  achievements: [{
    title: String,
    desc: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BuiltResume', BuiltResumeSchema);
