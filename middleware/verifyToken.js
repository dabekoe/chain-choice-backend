const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded payload to request object
    req.user = decoded;

    /**
     * Examples:
     * - Admin token will have: { adminId: '...', role: 'admin' }
     * - Voter token will have: { voterId: '...' }
     */

    if (!req.user.voterId && !req.user.adminId) {
      return res.status(401).json({ message: 'Invalid token payload.' });
    }

    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};
