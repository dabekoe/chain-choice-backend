const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  index: Number,
  timestamp: Date,
  data: mongoose.Schema.Types.Mixed,
  previousHash: String,
  hash: String
});

// ✅ Prevent OverwriteModelError
const Block = mongoose.models.Block || mongoose.model('Block', blockSchema);

module.exports = Block;
