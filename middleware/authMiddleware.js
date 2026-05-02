const jwt = require('jsonwebtoken');

// 🚨 FIX: Import User and Admin from their separate files
const User = require('../models/User'); 
const Admin = require('../models/Admin'); 

exports.isAuthenticatedUser = async (req, res, next) => {
  // Safely grab the token from the header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  // Prevent stringified "null" from passing the check
  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({ message: "Login first" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Look in the Admin collection first
    let foundUser = await Admin.findById(decoded.id);
    
    // If not found in Admin, look in the User collection
    if (!foundUser) {
      foundUser = await User.findById(decoded.id);
    }
    
    if (!foundUser) {
      return res.status(404).json({ message: "User not found in registry" });
    }

    req.user = foundUser;
    next();
  } catch (error) {
    console.error("JWT Verify Error:", error.message);
    res.status(401).json({ message: "Session expired or invalid token" });
  }
};

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied for role: ${req.user.role}` });
    }
    next();
  };
};