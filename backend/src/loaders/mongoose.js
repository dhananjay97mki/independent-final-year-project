const mongoose = require('mongoose');

module.exports = async function configureMongoose(uri) {
  try {
    // Set mongoose options
    mongoose.set('strictQuery', true);
    
    // Connect to MongoDB
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Create indexes for better performance
    await createIndexes();

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

// Create database indexes for better query performance
async function createIndexes() {
  try {
    const User = require('../models/User');
    const Post = require('../models/Post');
    const Message = require('../models/Message');
    const Conversation = require('../models/Conversation');
    const Company = require('../models/Company');
    const City = require('../models/City');

    // User indexes
    await User.createIndexes([
      { email: 1 },
      { 'currentCity.name': 1 },
      { 'currentCity.loc': '2dsphere' },
      { 'placement.company': 1 },
      { role: 1 },
      { batch: 1 },
      { department: 1 },
      { createdAt: -1 }
    ]);

    // Post indexes
    await Post.createIndexes([
      { author: 1 },
      { company: 1 },
      { city: 1 },
      { createdAt: -1 },
      { likes: 1 }
    ]);

    // Message indexes
    await Message.createIndexes([
      { conversation: 1, sentAt: -1 },
      { sender: 1 },
      { sentAt: -1 }
    ]);

    // Conversation indexes
    await Conversation.createIndexes([
      { members: 1 },
      { type: 1 },
      { city: 1 },
      { company: 1 },
      { updatedAt: -1 }
    ]);

    // Company indexes
    await Company.createIndexes([
      { slug: 1 },
      { name: 1 }
    ]);

    // City indexes
    await City.createIndexes([
      { name: 1 },
      { 'centroid': '2dsphere' },
      { 'stats.alumCount': -1 }
    ]);

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}
