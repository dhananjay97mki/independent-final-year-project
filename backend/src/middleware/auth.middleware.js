const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Main authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return sendError(res, 'Access denied. No token provided.', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return sendError(res, 'Invalid token. User not found.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token.', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired.', 401);
    }
    sendError(res, 'Token verification failed.', 401);
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Access denied. Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Access denied. Insufficient permissions.', 403);
    }

    next();
  };
};

// Check if user is alumni
const requireAlumni = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Access denied. Authentication required.', 401);
  }

  if (req.user.role !== 'alumni') {
    return sendError(res, 'Access denied. Alumni access required.', 403);
  }

  next();
};

// Check if user is student
const requireStudent = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Access denied. Authentication required.', 401);
  }

  if (req.user.role !== 'student') {
    return sendError(res, 'Access denied. Student access required.', 403);
  }

  next();
};

// Check if user owns the resource (for user-specific operations)
const requireOwnership = (resourceField = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Access denied. Authentication required.', 401);
    }

    const resourceUserId = req.params[resourceField] || req.body.userId;
    
    if (req.user._id.toString() !== resourceUserId) {
      return sendError(res, 'Access denied. You can only access your own resources.', 403);
    }

    next();
  };
};

// Admin only access
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Access denied. Authentication required.', 401);
  }

  // Check if user has admin privileges (you might store this in user model)
  if (!req.user.isAdmin) {
    return sendError(res, 'Access denied. Admin privileges required.', 403);
  }

  next();
};

// Check if user can access map features
const requireMapAccess = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Access denied. Authentication required.', 401);
  }

  if (!req.user.preferences?.allowMap) {
    return sendError(res, 'Map access not enabled. Please enable map sharing in your preferences.', 403);
  }

  next();
};

// Check if user can send messages
const requireMessagingAccess = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Access denied. Authentication required.', 401);
  }

  if (!req.user.preferences?.allowDM) {
    return sendError(res, 'Messaging not enabled. Please enable messaging in your preferences.', 403);
  }

  next();
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Verify token without middleware context
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded.exp < Date.now() / 1000;
  } catch (error) {
    return true;
  }
};

// Refresh token middleware
const refreshToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return sendError(res, 'No token provided for refresh.', 401);
    }

    // Check if token is close to expiration (within 1 day)
    const decoded = jwt.decode(token);
    const timeUntilExpiry = decoded.exp - (Date.now() / 1000);
    
    if (timeUntilExpiry < 86400) { // Less than 24 hours
      const user = await User.findById(decoded.id);
      if (user) {
        const newToken = generateToken(user._id);
        res.header('X-New-Token', newToken);
      }
    }
    
    next();
  } catch (error) {
    next(); // Continue without refresh if there's an error
  }
};

module.exports = {
  auth,
  optionalAuth,
  authorize,
  requireAlumni,
  requireStudent,
  requireOwnership,
  requireAdmin,
  requireMapAccess,
  requireMessagingAccess,
  generateToken,
  verifyToken,
  isTokenExpired,
  refreshToken
};
