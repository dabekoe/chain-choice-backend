const express = require('express');
const router = express.Router();
const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');

// GET /api/results
router.get('/', async (req, res) => {
  try {
    const votes = await Vote.find();

    const tally = {};

    for (const vote of votes) {
      const candidateId = vote.candidate.toString();
      tally[candidateId] = (tally[candidateId] || 0) + 1;
    }

    const results = [];

    for (const [candidateId, voteCount] of Object.entries(tally)) {
      const candidate = await Candidate.findById(candidateId).lean();
      if (candidate) {
        results.push({
          candidateId,
          name: candidate.name,
          party: candidate.party,
          type: candidate.type,
          constituency: candidate.constituency,
          image: candidate.image,
          votes: voteCount
        });
      }
    }

    res.status(200).json({ results });
  } catch (err) {
    console.error('❌ Error in /api/results:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
