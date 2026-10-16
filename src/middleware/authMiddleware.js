const jwt = require('jsonwebtoken');
const config = require('../config/env');
const UserModel = require('../models/userModel');

/**
 * Validates Bearer JWT Token
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token is missing or invalid'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User belonging to this token no longer exists'
      });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token has expired or is invalid'
    });
  }
}

/**
 * Role-Based Access Control (RBAC) Guard
 * @param  {...string} roles Allowed roles ('admin', 'analyst', 'user')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Requires one of the following roles: [${roles.join(', ')}]`
      });
    }
    next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
