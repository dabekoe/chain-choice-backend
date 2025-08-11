const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const Candidate = require('../models/Candidate');
const verifyToken = require('../middleware/auth');

// Setup multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Import constituencies array
const ghanaConstituencies = require('../utils/constituencies');

// POST /api/candidates — Add candidate
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  const { name, party, type, constituency } = req.body;

  // Validate constituency if parliamentary
  if (type === 'parliamentary' && !ghanaConstituencies.includes(constituency)) {
    return res.status(400).json({ message: 'Invalid constituency selected.' });
  }

  try {
    const candidate = new Candidate({
      name,
      party,
      type,
      constituency: type === 'parliamentary' ? constituency : '',
      image: req.file ? `/uploads/${req.file.filename}` : null,
    });

    await candidate.save();
    res.status(201).json({ message: 'Candidate added successfully.', candidate });
  } catch (err) {
    console.error('❌ Error adding candidate:', err);
    res.status(500).json({ message: 'Server error while saving candidate.' });
  }
});

// GET /api/candidates — Fetch with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, constituency, party } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (constituency) filter.constituency = constituency;
    if (party) filter.party = party;

    const total = await Candidate.countDocuments(filter);
    const candidates = await Candidate.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ name: 1 });

    res.status(200).json({
      candidates,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('❌ Error fetching candidates:', err);
    res.status(500).json({ message: 'Error fetching candidates.' });
  }
});

// ========================
// PUT /api/candidates/:id — Edit a candidate
// ========================
router.put('/:id', verifyToken, upload.single('image'), async (req, res) => {
  const { name, party, type, constituency } = req.body;

  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found.' });
    }

    // Delete old image if new one is uploaded
    if (req.file && candidate.image) {
      const oldPath = path.join(__dirname, '../', candidate.image);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    candidate.name = name || candidate.name;
    candidate.party = party || candidate.party;
    candidate.type = type || candidate.type;
    candidate.constituency =
      type === 'parliamentary' ? constituency : '';
    if (req.file) {
      candidate.image = `/uploads/${req.file.filename}`;
    }

    await candidate.save();
    res.status(200).json({ message: 'Candidate updated.', candidate });
  } catch (err) {
    console.error('❌ Error updating candidate:', err);
    res.status(500).json({ message: 'Error updating candidate.' });
  }
});

// ========================
// DELETE /api/candidates/:id — Delete candidate
// ========================
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found.' });
    }

    // Delete image from uploads folder
    if (candidate.image) {
      const imagePath = path.join(__dirname, '../', candidate.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await candidate.deleteOne();
    res.status(200).json({ message: 'Candidate deleted.' });
  } catch (err) {
    console.error('❌ Error deleting candidate:', err);
      res.status(500).json({ message: 'Error deleting candidate.' });
    }
  });
  
  module.exports = router;