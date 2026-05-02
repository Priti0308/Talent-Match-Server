const ContactMessage = require('../models/ContactMessage');

exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, Email, and Message are all required fields.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format.'
      });
    }

    // Save to Database
    const newContact = await ContactMessage.create({
      name,
      email,
      message
    });

    res.status(201).json({
      success: true,
      message: 'Message delivered successfully! We will get back to you soon.',
      data: newContact
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error processing contact message.'
    });
  }
};
