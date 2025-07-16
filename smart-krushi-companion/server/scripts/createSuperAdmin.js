const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('Superadmin already exists:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Create superadmin user
    const superAdminData = {
      name: 'Super Admin',
      email: 'superadmin@smartkrishi.com',
      password: 'SuperAdmin123!',
      phoneNumber: '+91-9999999999',
      role: 'superadmin',
      preferredLanguage: 'english',
      isActive: true,
      isVerified: true
    };

    const superAdmin = new User(superAdminData);
    await superAdmin.save();

    console.log('Superadmin created successfully:');
    console.log('Email:', superAdminData.email);
    console.log('Password:', superAdminData.password);
    console.log('Role:', superAdminData.role);

    process.exit(0);
  } catch (error) {
    console.error('Error creating superadmin:', error);
    process.exit(1);
  }
};

createSuperAdmin(); 