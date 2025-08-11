const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  voterId: {
    type: String,
    required: [true, 'Voter ID is required'],
    unique: true,
    match: [/^\d{10}$/, 'Voter ID must be exactly 10 digits']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  hasVoted: {
    type: Boolean,
    default: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Voter || mongoose.model('Voter', voterSchema);