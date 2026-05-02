const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  // Link to a user if you have authentication
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Set to true if login is required
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  fileData: {
    type: Buffer
  },
  contentType: {
    type: String
  },
  // Data from Gemini
  atsScore: {
    type: Number,
    required: true
  },
  skillsMatched: [{
    type: String
  }],
  missingKeywords: [{
    type: String
  }],
  atsFactors: [{
    name: String,
    score: Number
  }],
  strengths: [{
    type: String
  }],
  weaknesses: [{
    type: String
  }],
  suggestions: [{
    type: String
  }],
  interviewQuestions: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resume', ResumeSchema);