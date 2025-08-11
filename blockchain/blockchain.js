const crypto = require('crypto');
const mongoose = require('mongoose');
const { encryptVote, decryptVote } = require('../utils/encryption'); // Adjust path if needed

// MongoDB schema for a block (stores encrypted vote)
const blockSchema = new mongoose.Schema({
  index: Number,
  timestamp: Date,
  data: {
    iv: String,
    data: String
  },
  previousHash: String,
  hash: String
});

const BlockModel = require('../models/Block');

class Blockchain {
  constructor() {
    this.chain = [];
    this.initialized = false;
  }

  // Load blockchain from DB or create genesis
  async init() {
    if (this.initialized) return;

    const existing = await BlockModel.find().sort({ index: 1 }).lean();

    if (existing.length > 0) {
      this.chain = existing;
    } else {
      const genesisData = encryptVote({ system: 'Genesis Block' });
      const genesisBlock = this.createBlock(0, Date.now(), genesisData, '0');
      await this.saveBlock(genesisBlock);
      this.chain.push(genesisBlock);
    }

    this.initialized = true;
  }

  // Create hash for block
  hashBlock(index, timestamp, data, previousHash) {
    const blockString = index + timestamp + JSON.stringify(data) + previousHash;
    return crypto.createHash('sha256').update(blockString).digest('hex');
  }

  // Create a block (after encrypting vote)
  createBlock(index, timestamp, data, previousHash) {
    const hash = this.hashBlock(index, timestamp, data, previousHash);
    return { index, timestamp, data, previousHash, hash };
  }

  // Add a new block (vote)
  async addBlock(voteData) {
    await this.init();

    const encrypted = encryptVote(voteData);

    const lastBlock = this.chain[this.chain.length - 1];
    const index = lastBlock.index + 1;
    const timestamp = Date.now();
    const previousHash = lastBlock.hash;

    const newBlock = this.createBlock(index, timestamp, encrypted, previousHash);
    await this.saveBlock(newBlock);
    this.chain.push(newBlock);

    return newBlock;
  }

  // Save to MongoDB
  async saveBlock(block) {
    const doc = new BlockModel(block);
    await doc.save();
  }

  // Get latest block
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // Check blockchain integrity
  isValidChain() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      const recalculatedHash = this.hashBlock(
        current.index,
        current.timestamp,
        current.data,
        current.previousHash
      );

      if (current.hash !== recalculatedHash) return false;
      if (current.previousHash !== previous.hash) return false;
    }
    return true;
  }

  // Optional: Decrypted blockchain view
  getDecryptedChain() {
    return this.chain.map(block => ({
      index: block.index,
      timestamp: block.timestamp,
      data: decryptVote(block.data),
      previousHash: block.previousHash,
      hash: block.hash
    }));
  }
}

module.exports = Blockchain;