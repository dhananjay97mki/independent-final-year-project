const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const { sendError } = require('../utils/response');

// Redis client for rate limiting (optional)
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis rate limit error:', err);
  });
}

// Custom rate limit message
const rateLimitMessage = (req, res) => {
  return sendError(res, 'Too many requests. Please try again later.', 429, {
    retryAfter: Math.round(req.rateLimit.resetTime / 1000) || 60
  });
};

// General API rate limit
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:general:'
  }) : undefined
});

// Auth rate limit (stricter for login/register)
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:auth:'
  }) : undefined,
  skipSuccessfulRequests: true // Don't count successful requests
});

// Search rate limit
const searchLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 searches per minute
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:search:'
  }) : undefined
});

// Message sending rate limit
const messageLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 messages per minute
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:message:'
  }) : undefined,
  keyGenerator: (req) => {
    // Use user ID instead of IP for authenticated requests
    return req.user?.id || req.ip;
  }
});

// Post creation rate limit
const postLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each user to 5 posts per minute
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:post:'
  }) : undefined,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Map API rate limit (higher for map interactions)
const mapLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // limit each IP to 120 map requests per minute
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:map:'
  }) : undefined
});

// File upload rate limit
const uploadLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each user to 10 uploads per 5 minutes
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:upload:'
  }) : undefined,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Password reset rate limit (very strict)
const passwordResetLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset attempts per hour
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:password-reset:'
  }) : undefined
});

// Connection request rate limit
const connectionLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each user to 10 connection requests per minute
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:connection:'
  }) : undefined,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Admin operations rate limit
const adminLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit admin operations
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:admin:'
  }) : undefined,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Notification rate limit
const notificationLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit notification requests
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:notification:'
  }) : undefined,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Custom rate limiter creator
const createCustomLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = rateLimitMessage,
    prefix = 'rl:custom:',
    useUserId = false
  } = options;

  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    store: redisClient ? new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix
    }) : undefined,
    keyGenerator: useUserId ? (req) => {
      return req.user?.id || req.ip;
    } : undefined
  });
};

// Bypass rate limit for certain conditions
const skipRateLimit = (req) => {
  // Skip rate limiting for certain IPs (like health checks)
  const skipIPs = (process.env.RATE_LIMIT_SKIP_IPS || '').split(',');
  if (skipIPs.includes(req.ip)) return true;
  
  // Skip for admin users (if implemented)
  if (req.user && req.user.isAdmin) return true;
  
  return false;
};

// Apply skip logic to all rate limiters
const rateLimiters = [
  generalLimit,
  authLimit,
  searchLimit,
  messageLimit,
  postLimit,
  mapLimit,
  uploadLimit,
  passwordResetLimit,
  connectionLimit,
  adminLimit,
  notificationLimit
];

rateLimiters.forEach(limiter => {
  limiter.skip = skipRateLimit;
});

// Rate limit info middleware
const rateLimitInfo = (req, res, next) => {
  res.setHeader('X-RateLimit-Policy', 'General API rate limiting is active');
  next();
};

// Clean up function
const cleanup = async () => {
  if (redisClient) {
    await redisClient.quit();
  }
};

// Graceful shutdown
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

module.exports = {
  generalLimit,
  authLimit,
  searchLimit,
  messageLimit,
  postLimit,
  mapLimit,
  uploadLimit,
  passwordResetLimit,
  connectionLimit,
  adminLimit,
  notificationLimit,
  createCustomLimit,
  rateLimitInfo,
  cleanup
};
