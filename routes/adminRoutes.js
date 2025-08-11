const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  loginAdmin,
  createAdmin,
  getAllAdmins,
  getVotes,
  getResults,
  getBlockchain,
  changeAdminPassword // <-- Import the change password controller
} = require('../controllers/adminController');

const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

// 🧑‍💻 Admin Login
router.post('/login', loginAdmin);

// 🆕 Create Admin (Only Superadmin can create)
router.post(
  '/',
  verifyToken,
  checkRole(['superadmin']),
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  createAdmin
);

// 📋 ✅ Get All Admins (Superadmin only)
router.get(
  '/',
  verifyToken,
  checkRole(['superadmin']),
  getAllAdmins
);

// 📋 Get All Votes (Admin + Superadmin)
router.get('/votes', verifyToken, checkRole(['admin', 'superadmin']), getVotes);

// 📊 View Aggregated Vote Results (Admin + Superadmin)
router.get('/results', verifyToken, checkRole(['admin', 'superadmin']), getResults);

// 🧱 View Blockchain Ledger (Superadmin only)
router.get('/blockchain', verifyToken, checkRole(['superadmin']), getBlockchain);

// 🔑 Change Admin Password (Superadmin only)
router.post(
  '/change-password',
  verifyToken,
  checkRole(['superadmin']),
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('oldPassword').isLength({ min: 6 }).withMessage('Old password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  changeAdminPassword
);
module.exports = router;