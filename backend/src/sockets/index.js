const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const chatSocket = require('./chat.socket');
const presenceSocket = require('./presence.socket');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

module.exports = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection event
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.userId})`);
    
    // Join user to their personal room for direct messaging
    socket.join(`user:${socket.userId}`);
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.user.name} (${socket.userId}) - Reason: ${reason}`);
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  });

  // Initialize chat functionality
  chatSocket(io);
  
  // Initialize presence tracking
  presenceSocket(io);

  // Global error handler
  io.engine.on('connection_error', (err) => {
    console.error('Socket.IO connection error:', err.req);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    console.error('Error context:', err.context);
  });

  return io;
};
