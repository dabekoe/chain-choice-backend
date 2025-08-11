const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // 'Bearer token'

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Allow admin or superadmin for admin actions
    if (decoded.role === 'admin' || decoded.role === 'superadmin') {
      req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
      return next();
    }

    // Allow voter for voter actions
    if (decoded.voterId) {
      req.user = { voterId: decoded.voterId };
      return next();
    }

    return res.status(403).json({ message: 'Invalid token payload. No valid role or voterId.' });
  } catch (err) {
    console.error('❌ Invalid token:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};