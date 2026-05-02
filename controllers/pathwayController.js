const PathwayResult = require('../models/PathwayResult');

// @desc    Save the result of the Pathfinder Brainstorming Game
// @route   POST /api/pathway/save
// @access  Private
const savePathwayResult = async (req, res) => {
  try {
    const { recommendedPathway, quizAnswers } = req.body;

    if (!recommendedPathway || !quizAnswers) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const result = new PathwayResult({
      userId: req.user._id,
      recommendedPathway,
      quizAnswers
    });

    await result.save();

    res.status(201).json({
      success: true,
      message: 'Pathway result saved successfully',
      result
    });
  } catch (error) {
    console.error('Save Pathway Result Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get the latest pathway result for the logged in user
// @route   GET /api/pathway/my-result
// @access  Private
const getMyPathwayResult = async (req, res) => {
  try {
    const results = await PathwayResult.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get Pathway Result Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get aggregated pathway stats across all users
// @route   GET /api/pathway/stats
// @access  Private
const getAllPathwayStats = async (req, res) => {
  try {
    const stats = await PathwayResult.aggregate([
      {
        $group: {
          _id: "$recommendedPathway",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: "$_id",
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get Pathway Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  savePathwayResult,
  getMyPathwayResult,
  getAllPathwayStats
};
