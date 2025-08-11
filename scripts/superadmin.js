// scripts/superadmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Admin schema
const adminSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: String,
  role: {
    type: String,
    enum: ['admin', 'superadmin'],
    default: 'admin'
  }
});

const Admin = mongoose.model('Admin', adminSchema);

// Connect to DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ghana-voting')
  .then(async () => {
    console.log('🟢 Connected to MongoDB');

    const exists = await Admin.findOne({ role: 'superadmin' });
    if (exists) {
      console.log('❌ Super Admin already exists.');
      return mongoose.disconnect();
    }

    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    const superAdmin = new Admin({
      id: 'admin001',
      name: 'Super Admin',
      email: 'superadmin@gmail.com',
      password: hashedPassword,
      role: 'superadmin'
    });

    await superAdmin.save();
    console.log('✅ Super Admin created successfully.');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });
