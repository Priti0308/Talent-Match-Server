const mongoose = require('mongoose');

const pathwayResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recommendedPathway: {
    type: String,
    required: true
  },
  quizAnswers: [
    {
      questionId: { type: String, required: true },
      questionText: { type: String, required: true },
      answerSelected: { type: String, required: true }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('PathwayResult', pathwayResultSchema);
