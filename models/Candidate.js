const mongoose = require('mongoose');
const constituencies = require('../utils/constituencies');
const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  party: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String, // "presidential" or "parliamentary"
    required: true,
    enum: ['presidential', 'parliamentary']
  },
  constituency: {
    type: String,
    trim: true,
    required: function () {
      return this.type === 'parliamentary';
    },
    default: null
  },
  image: {
    type: String, // Path or URL to uploaded image
    default: null
  }
}, {
  timestamps: true
});

// ✅ Prevent OverwriteModelError in dev/hot reloads
module.exports = mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);
