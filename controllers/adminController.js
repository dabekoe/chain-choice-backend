const Admin = require('../models/Admin');
const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');
const Block = require('../models/Block');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// 🔐 Admin Login
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { adminId: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({ token, admin });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 👑 Create Admin (Superadmin Only)
exports.createAdmin = async (req, res) => {
  const { email, password } = req.body;
  const role = 'admin'; // Default to regular admin

  try {
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Admin already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ email, password: hashedPassword, role });

    await admin.save();
    res.status(201).json({ message: 'Admin created successfully', admin });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 📋 Get All Admins (for frontend dashboard)
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({}, '-password'); // Don't send password
    res.status(200).json(admins);
  } catch (err) {
    console.error('Error fetching admins:', err);
    res.status(500).json({ message: 'Error retrieving admins' });
  }
};

// 🔑 Change Admin Password (Superadmin Only)
exports.changeAdminPassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Old password is incorrect' });

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 📥 Get All Votes
exports.getVotes = async (req, res) => {
  try {
    const votes = await Vote.find().populate('candidateId', 'name party type');
    res.status(200).json({ votes });
  } catch (err) {
    console.error('Fetch votes error:', err);
    res.status(500).json({ message: 'Error fetching votes' });
  }
};

// 📊 Get Aggregated Vote Results
exports.getResults = async (req, res) => {
  try {
    const results = await Vote.aggregate([
      { $group: { _id: '$candidateId', voteCount: { $sum: 1 } } },
      {
        $lookup: {
          from: 'candidates',
          localField: '_id',
          foreignField: '_id',
          as: 'candidate'
        }
      },
      { $unwind: '$candidate' },
      {
        $project: {
          _id: 0,
          candidateId: '$_id',
          name: '$candidate.name',
          party: '$candidate.party',
          type: '$candidate.type',
          voteCount: 1
        }
      }
    ]);

    res.status(200).json({ results });
  } catch (err) {
    console.error('Error fetching results:', err);
    res.status(500).json({ message: 'Error retrieving results' });
  }
};

// 🧱 Get Blockchain Ledger
exports.getBlockchain = async (req, res) => {
  try {
    const blocks = await Block.find().sort({ index: 1 });
    res.status(200).json({ chain: blocks });
  } catch (err) {
    console.error('Blockchain error:', err);
    res.status(500).json({ message: 'Error fetching blockchain' });
  }
};