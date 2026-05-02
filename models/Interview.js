const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Array of objects capturing the full conversation
    transcript: [
      {
        question: { type: String, required: true },
        answer: { type: String, default: "" },
      },
    ],
    // Detailed time tracking
    timeStats: {
      totalDurationSeconds: { type: Number, required: true },
      questionWise: [
        {
          question: String,
          secondsTaken: Number,
        },
      ],
    },
    // AI Analysis results from Gemini
    analysis: {
      finalScore: { type: Number, default: 0 },
      isShortlisted: { type: Boolean, default: false },
      communicationLevel: { type: String, default: "Average" },
      confidenceLevel: { type: String, default: "Medium" },
      correctnessScore: { type: Number, default: 0 },
      hiringDossier: [String],
      suggestedRoles: [String],
      skillsToImprove: [String],
      // Legacy or internal tracking
      communicationScore: { type: Number, default: 0 },
      confidenceScore: { type: Number, default: 0 },
      technicalAccuracy: { type: Number, default: 0 },
      fillerWordCount: { type: Number, default: 0 },
      detectedFillerWords: [String],
      suggestions: [String],
      roundBreakdowns: { type: mongoose.Schema.Types.Mixed }, 
    },
    status: {
      type: String,
      enum: ["Completed", "Terminated", "Pending"],
      default: "Completed",
    },
  },
  { timestamps: true }
);

const Interview = mongoose.model("Interview", interviewSchema);
module.exports = Interview;