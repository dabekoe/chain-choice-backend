const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');
const Blockchain = require('../blockchain/blockchain');

// 🧱 Initialize Blockchain
const voteChain = new Blockchain();

/**
 * ✅ CAST A VOTE
 * POST /api/votes
 */
router.post('/', verifyToken, async (req, res) => {
  const { candidateId, electionType } = req.body;

  if (!candidateId || !electionType) {
    return res.status(400).json({ message: 'Candidate ID and election type are required.' });
  }

  try {
    const voterId = req.user.voterId;
    if (!voterId) {
      return res.status(403).json({ message: 'Unauthorized voter.' });
    }

    // 🔍 Find candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found.' });
    }

    if (candidate.type !== electionType) {
      return res.status(400).json({ message: 'Candidate type mismatch.' });
    }

    // 🛑 Prevent double voting
    let existingVote = null;
    if (electionType === 'presidential') {
      existingVote = await Vote.findOne({ voterId, electionType: 'presidential' });
      if (existingVote) {
        return res.status(403).json({ message: 'You have already voted in the presidential election.' });
      }
    } else if (electionType === 'parliamentary') {
      if (!candidate.constituency) {
        return res.status(400).json({ message: 'Parliamentary candidate must have a constituency.' });
      }
      // Prevent voting in more than one constituency (only one parliamentary vote allowed)
      existingVote = await Vote.findOne({
        voterId,
        electionType: 'parliamentary',
      });
      if (existingVote) {
        return res.status(403).json({ message: 'You have already voted in a parliamentary election.' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid election type.' });
    }

    // 🗳️ Create and save the vote
    const newVote = new Vote({
      voterId,
      candidate: candidate._id,
      electionType,
      ...(electionType === 'parliamentary' ? { constituency: candidate.constituency } : {})
    });

    await newVote.save();

    // 🔗 Add to blockchain
    const voteData = {
      voterId,
      candidateId,
      electionType,
      voteId: newVote._id.toString()
    };

    await voteChain.addBlock(voteData);

    res.status(201).json({
      message: '✅ Vote cast successfully.',
      vote: newVote,
      blockchainHash: voteChain.getLatestBlock().hash
    });

  } catch (err) {
    console.error('❌ Error casting vote:', err);
    res.status(500).json({
      message: 'Server error while casting vote.',
      error: err.message
    });
  }
});

/**
 * ✅ LIST ALL VOTES
 */
router.get('/', async (req, res) => {
  try {
    const votes = await Vote.find()
      .populate('candidate', 'name party type constituency image');
    res.status(200).json({ votes });
  } catch (err) {
    console.error('❌ Error fetching votes:', err);
    res.status(500).json({ message: 'Error fetching votes.' });
  }
});

/**
 * ✅ VIEW RESULTS
 */
router.get('/results', async (req, res) => {
  try {
    const results = await Vote.aggregate([
      { $group: { _id: '$candidate', voteCount: { $sum: 1 } } },
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
          candidateId: '$candidate._id',
          name: '$candidate.name',
          party: '$candidate.party',
          type: '$candidate.type',
          constituency: '$candidate.constituency',
          voteCount: 1
        }
      }
    ]);

    res.status(200).json({ results });
  } catch (err) {
    console.error('❌ Error fetching results:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * ✅ LIST AVAILABLE ELECTIONS
 */
router.get('/elections', verifyToken, async (req, res) => {
  try {
    const candidates = await Candidate.find();

    const elections = [];

    const hasPresidential = candidates.some(c => c.type === 'presidential');
    if (hasPresidential) {
      elections.push({ type: 'presidential' });
    }

    const parliamentary = candidates.filter(c => c.type === 'parliamentary');
    const constituencies = [...new Set(parliamentary.map(c => c.constituency))];

    for (const consti of constituencies) {
      elections.push({ type: 'parliamentary', constituency: consti });
    }

    res.status(200).json({ elections });
  } catch (err) {
    console.error('❌ Error fetching elections:', err);
    res.status(500).json({ message: 'Failed to fetch elections' });
  }
});

/**
 * ✅ GET BLOCKCHAIN
 */
router.get('/blockchain', (req, res) => {
  res.status(200).json({ chain: voteChain.chain });
});

/**
 * ✅ VALIDATE BLOCKCHAIN
 */
router.get('/blockchain/validate', (req, res) => {
  const isValid = voteChain.isValidChain();
  res.status(200).json({ valid: isValid });
});
module.exports = router;