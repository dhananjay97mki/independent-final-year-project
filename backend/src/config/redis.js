const redis = require('redis');

let client = null;

const connectRedis = async () => {
  try {
    if (!process.env.REDIS_URL) {
      console.log('Redis URL not provided, skipping Redis connection');
      return null;
    }

    client = redis.createClient({
      url: process.env.REDIS_URL,
      retry_unfulfilled_commands: true,
      retry_strategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    client.on('ready', () => {
      console.log('Redis Client Ready');
    });

    client.on('end', () => {
      console.log('Redis Client Disconnected');
    });

    await client.connect();
    
    // Test the connection
    await client.ping();
    console.log('Redis connection successful');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      if (client && client.isOpen) {
        await client.quit();
        console.log('Redis connection closed');
      }
    });

    return client;
  } catch (error) {
    console.error('Redis connection failed:', error.message);
    return null;
  }
};

// Redis utility functions
const redisUtils = {
  // Set with expiration
  setEx: async (key, seconds, value) => {
    if (!client) return false;
    try {
      await client.setEx(key, seconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis setEx error:', error);
      return false;
    }
  },

  // Get value
  get: async (key) => {
    if (!client) return null;
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  },

  // Delete key
  del: async (key) => {
    if (!client) return false;
    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  },

  // Check if key exists
  exists: async (key) => {
    if (!client) return false;
    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  },

  // Increment counter
  incr: async (key) => {
    if (!client) return 0;
    try {
      return await client.incr(key);
    } catch (error) {
      console.error('Redis incr error:', error);
      return 0;
    }
  },

  // Set hash field
  hSet: async (key, field, value) => {
    if (!client) return false;
    try {
      await client.hSet(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis hSet error:', error);
      return false;
    }
  },

  // Get hash field
  hGet: async (key, field) => {
    if (!client) return null;
    try {
      const value = await client.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis hGet error:', error);
      return null;
    }
  }
};

module.exports = {
  connectRedis,
  redisUtils,
  getClient: () => client
};
