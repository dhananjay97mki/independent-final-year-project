require('dotenv').config();
const configureExpress = require('./src/loaders/express');
const connectDB = require('./src/config/db');
const mountRoutes = require('./src/loaders/routes');
const createServer = require('./src/loaders/server');
const socketHandler = require('./src/sockets');

(async () => {
  try {
    // Connect to MongoDB
    await connectDB(process.env.MONGODB_URI);
    
    // Configure Express app
    const app = configureExpress();
    
    // Mount API routes
    mountRoutes(app);
    
    // Create server with Socket.IO
    const { server, io } = createServer(app, socketHandler);
    
    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO server running`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();
