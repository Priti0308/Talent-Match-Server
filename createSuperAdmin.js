import mongoose from 'mongoose';
import User from './models/User.js'; // Ensure extension for ESM
import dotenv from 'dotenv';

dotenv.config();

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Primary check using the specific contact number provided
    const adminExists = await User.findOne({ contact: '8459894232' });
    if (adminExists) {
      console.log("⚠️ SuperAdmin with this contact already exists!");
      process.exit();
    }

    const superAdmin = new User({
      name: "Main Organizer",
      email: "master@talentmatch.com",
      contact: "8459894232",
      college: "CIMDR", // Targeting your specified college
      course: "MCA",
      password: "Master@123", // Will be hashed by your User model hooks
      role: "superadmin",
      isApproved: true // REQUIRED to allow the SuperAdmin to log in immediately
    });

    await superAdmin.save();
    console.log("✅ SuperAdmin Created Successfully!");
    console.log("📧 Login Email: master@talentmatch.com");
    console.log("📱 Login Contact: 8459894232");
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

createSuperAdmin();