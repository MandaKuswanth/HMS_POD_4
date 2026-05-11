const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
//console.log("HEADER:", req.headers.authorization);
//console.log("TOKEN:", token);
//console.log("SECRET:", process.env.JWT_SECRET);

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log(req.user);
    next();
    console.log("SECRET:", process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};