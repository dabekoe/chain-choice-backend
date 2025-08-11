const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const blockchain = require('../blockchain/blockchain');
const verifyToken = require('../middleware/auth');

// AES 256 Encryption Config
const AES_SECRET = crypto.randomBytes(32); // Use a fixed key in production
const IV = crypto.randomBytes(16);         // Initialization vector

function encryptVote(voteData) {
  const cipher = crypto.createCipheriv('aes-256-cbc', AES_SECRET, IV);
  let encrypted = cipher.update(JSON.stringify(voteData), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptVote(encryptedData) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', AES_SECRET, IV);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

// Protected route for submitting votes (voter-only)
router.post('/vote', verifyToken, (req, res) => {
  if (req.user.role !== 'voter') {
    return res.status(403).json({ message: 'Only voters can submit votes' });
  }

  const { candidate } = req.body;
  if (!candidate) {
    return res.status(400).json({ message: 'Candidate is required' });
  }

  const encryptedVote = encryptVote({ candidate });
  const blockData = {
    voterId: req.user.id, // Visible to admin
    encryptedVote: encryptedVote
  };

  blockchain.addBlock(blockData);
  res.status(200).json({ message: 'Vote submitted and encrypted successfully' });
});

// Admin-only route to view the blockchain (no decryption of votes)
router.get('/admin/chain', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can access the blockchain' });
  }

  // Strip encryptedVote to preserve anonymity, only show voterId & timestamp
  const simplifiedChain = blockchain.chain.map(block => ({
    index: block.index,
    timestamp: block.timestamp,
    voterId: block.data.voterId,   // Admin sees who voted
    encryptedVote: 'Hidden',       // Admin cannot see vote content
    previousHash: block.previousHash,
    hash: block.hash
  }));

  res.json(simplifiedChain);
});

module.exports = router;
