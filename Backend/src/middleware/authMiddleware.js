const jwt = require('jsonwebtoken');

module.exports = function validateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    console.log(`Authenticated user: ${req.user.id} with role: ${req.user.role}`);
    next();
  } catch (err) {
    return res.status(401).json({ message: err.message || 'Invalid or expired token' });
  }
};