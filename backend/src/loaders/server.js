const http = require('http');

module.exports = function createServer(app, socketHandler = null) {
  // Create HTTP server
  const server = http.createServer(app);

  // Initialize Socket.IO if handler provided
  let io = null;
  if (socketHandler && typeof socketHandler === 'function') {
    io = socketHandler(server);
    console.log('Socket.IO initialized');
  }

  // Server event handlers
  server.on('error', (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const port = server.address()?.port || 'unknown';
    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

    // Handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        console.error('Server error:', error);
        throw error;
    }
  });

  server.on('listening', () => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    console.log(`Server listening on ${bind}`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`API available at: http://localhost:${addr.port}/api`);
      console.log(`Health check: http://localhost:${addr.port}/health`);
    }
  });

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    
    server.close(async (err) => {
      if (err) {
        console.error('Error during server close:', err);
        process.exit(1);
      }
      
      console.log('HTTP server closed');
      
      // Close Socket.IO connections
      if (io) {
        io.close(() => {
          console.log('Socket.IO connections closed');
        });
      }
      
      // Close database connections
      try {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
      } catch (error) {
        console.error('Error closing MongoDB:', error);
      }
      
      // Close Redis connection if exists
      try {
        const { getClient } = require('../config/redis');
        const redisClient = getClient();
        if (redisClient && redisClient.isOpen) {
          await redisClient.quit();
          console.log('Redis connection closed');
        }
      } catch (error) {
        console.error('Error closing Redis:', error);
      }
      
      console.log('Graceful shutdown completed');
      process.exit(0);
    });
    
    // Force close after timeout
    setTimeout(() => {
      console.error('Forceful shutdown after timeout');
      process.exit(1);
    }, 10000); // 10 seconds timeout
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });

  return { server, io };
};
