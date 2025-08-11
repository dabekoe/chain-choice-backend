const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Voter = require('../models/voter');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail'); // <-- Add this line
const router = express.Router();

// ✅ Register new voter with email verification token
router.post('/register', async (req, res) => {
  const { name, phone, voterId, email, password } = req.body;

  console.log('📥 Register Request:', { name, phone, voterId, email });

  if (!name || !phone || !voterId || !email || !password) {
    console.warn('⚠️ Missing fields in registration');
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existing = await Voter.findOne({ $or: [{ voterId }, { email }] });
    if (existing) {
      console.warn('⚠️ Voter already exists:', existing);
      return res.status(409).json({ message: 'Voter already exists' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newVoter = new Voter({
      name,
      phone,
      voterId,
      email,
      password: hashedPassword,
      verificationToken,
      verified: false
    });
    await newVoter.save();

    // Send verification email
    try {
      await sendEmail(
        email,
        'Your Verification Code',
        `Your verification code is: ${verificationToken}`
      );
    } catch (mailErr) {
      console.error('❌ Email send error:', mailErr);
      return res.status(500).json({ message: 'Failed to send verification email.' });
    }

    console.log('✅ New voter registered:', newVoter);

    res.status(201).json({ message: 'Voter registered successfully. Please check your email for the verification code.' });
  } catch (err) {
    console.error('❌ Register Error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ✅ Email/Token Verification
router.post('/verify', async (req, res) => {
  const { email, token } = req.body;

  try {
    const voter = await Voter.findOne({ email, verificationToken: token });
    if (!voter) {
      return res.status(400).json({ message: 'Invalid verification token.' });
    }

    voter.verified = true;
    voter.verificationToken = undefined;
    await voter.save();

    res.status(200).json({ message: 'Account verified successfully.' });
  } catch (err) {
    console.error('❌ Verification Error:', err);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// ✅ Voter login (only if verified)
router.post('/login', async (req, res) => {
  const { voterId, password } = req.body;
  console.log('🔐 Login attempt:', { voterId });

  if (!voterId || !password) {
    console.warn('⚠️ Missing login fields');
    return res.status(400).json({ message: 'Voter ID and password required' });
  }

  try {
    const voter = await Voter.findOne({ voterId });
    if (!voter) {
      console.warn('❌ Voter not found:', voterId);
      return res.status(404).json({ message: 'Voter not found' });
    }

    if (!voter.verified) {
      return res.status(403).json({ message: 'Please verify your account before logging in.' });
    }

    const isMatch = await bcrypt.compare(password, voter.password);
    if (!isMatch) {
      console.warn('❌ Invalid credentials for:', voterId);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { voterId: voter._id }, // MongoDB ObjectId
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1h' }
    );

    console.log('✅ Voter authenticated:', voterId);
    console.log('🔑 Token payload:', { voterId: voter._id });

    res.status(200).json({
      message: 'Login successful',
      token,
      voter: {
        id: voter._id,
        voterId: voter.voterId,
        email: voter.email
      }
    });
  } catch (err) {
    console.error('❌ Login Error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;