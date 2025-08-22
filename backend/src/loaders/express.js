const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('../utils/response');
const { generalLimit, rateLimitInfo } = require('../middleware/rateLimit.middleware');

module.exports = function configureExpress() {
  const app = express();

  // Trust proxy (for rate limiting and real IP detection)
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        fontSrc: ["'self'", "fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "*.tile.openstreetmap.org", "*.basemaps.cartocdn.com"],
        connectSrc: ["'self'", "ws:", "wss:"],
        scriptSrc: ["'self'"]
      }
    }
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL 
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Request compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // HTTP request logging
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Rate limiting
  app.use(generalLimit);
  app.use(rateLimitInfo);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // API version info
  app.get('/api', (req, res) => {
    res.json({
      message: 'Alumina API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        companies: '/api/companies',
        cities: '/api/cities',
        posts: '/api/posts',
        chat: '/api/chat',
        map: '/api/map',
        notifications: '/api/notifications'
      }
    });
  });

  // Handle 404 for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      timestamp: new Date().toISOString()
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};
