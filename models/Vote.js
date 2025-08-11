const mongoose = require('mongoose');
const voteSchema = new mongoose.Schema({
  voterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voter',
    required: true
    // ❌ Remove 'unique'
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  electionType: {
    type: String,
    enum: ['presidential', 'parliamentary'],
    required: true
  },
  constituency: {
    type: String,
    required: function () {
      return this.electionType === 'parliamentary';
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Vote || mongoose.model('Vote', voteSchema);
