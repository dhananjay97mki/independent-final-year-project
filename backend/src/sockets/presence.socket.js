const User = require('../models/User');

// In-memory store for user presence (in production, use Redis)
const onlineUsers = new Map();
const userLocations = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    
    // User comes online
    socket.on('user_online', async () => {
      try {
        // Mark user as online
        onlineUsers.set(socket.userId, {
          socketId: socket.id,
          userId: socket.userId,
          name: socket.user.name,
          avatar: socket.user.avatar,
          role: socket.user.role,
          lastSeen: new Date(),
          status: 'online'
        });

        // Update user's last seen in database
        await User.findByIdAndUpdate(socket.userId, {
          lastSeen: new Date(),
          isOnline: true
        });

        // Broadcast to relevant rooms that user is online
        socket.broadcast.emit('user_status_changed', {
          userId: socket.userId,
          status: 'online',
          lastSeen: new Date()
        });

        // If user has location sharing enabled, broadcast location
        if (socket.user.preferences?.allowMap && socket.user.currentCity?.loc) {
          const locationData = {
            userId: socket.userId,
            name: socket.user.name,
            avatar: socket.user.avatar,
            role: socket.user.role,
            location: socket.user.currentCity.loc,
            cityName: socket.user.currentCity.name,
            company: socket.user.placement?.company
          };

          userLocations.set(socket.userId, locationData);
          
          // Broadcast location update
          socket.broadcast.emit('user_location_updated', locationData);
        }

        console.log(`User ${socket.user.name} is now online`);
        
      } catch (error) {
        console.error('Error setting user online:', error);
      }
    });

    // User goes offline or disconnects
    const handleUserOffline = async () => {
      try {
        if (onlineUsers.has(socket.userId)) {
          onlineUsers.delete(socket.userId);
          userLocations.delete(socket.userId);

          // Update user's status in database
          await User.findByIdAndUpdate(socket.userId, {
            lastSeen: new Date(),
            isOnline: false
          });

          // Broadcast to relevant rooms that user is offline
          socket.broadcast.emit('user_status_changed', {
            userId: socket.userId,
            status: 'offline',
            lastSeen: new Date()
          });

          console.log(`User ${socket.user.name} is now offline`);
        }
      } catch (error) {
        console.error('Error setting user offline:', error);
      }
    };

    socket.on('user_offline', handleUserOffline);
    socket.on('disconnect', handleUserOffline);

    // Update user's location in real-time
    socket.on('update_location', async (locationData) => {
      try {
        const { lng, lat, cityName, country } = locationData;

        // Verify user has map permissions
        if (!socket.user.preferences?.allowMap) {
          socket.emit('error', { message: 'Location sharing not enabled' });
          return;
        }

        // Update user's location in database
        await User.findByIdAndUpdate(socket.userId, {
          currentCity: {
            name: cityName,
            country,
            loc: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            }
          }
        });

        // Update in-memory location store
        const updatedLocationData = {
          userId: socket.userId,
          name: socket.user.name,
          avatar: socket.user.avatar,
          role: socket.user.role,
          location: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          cityName,
          country,
          company: socket.user.placement?.company,
          updatedAt: new Date()
        };

        userLocations.set(socket.userId, updatedLocationData);

        // Broadcast location update to other users
        socket.broadcast.emit('user_location_updated', updatedLocationData);

        // Notify users in the same city
        if (cityName) {
          socket.to(`city:${cityName}`).emit('new_user_in_city', {
            userId: socket.userId,
            userName: socket.user.name,
            userRole: socket.user.role
          });
        }

        console.log(`Location updated for user ${socket.user.name}: ${cityName}`);
        
      } catch (error) {
        console.error('Error updating user location:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Get online users
    socket.on('get_online_users', (callback) => {
      try {
        const onlineUsersList = Array.from(onlineUsers.values()).map(user => ({
          userId: user.userId,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          status: user.status,
          lastSeen: user.lastSeen
        }));

        if (callback && typeof callback === 'function') {
          callback(onlineUsersList);
        } else {
          socket.emit('online_users_list', onlineUsersList);
        }
      } catch (error) {
        console.error('Error getting online users:', error);
        socket.emit('error', { message: 'Failed to get online users' });
      }
    });

    // Get users in specific location
    socket.on('get_users_in_location', (data, callback) => {
      try {
        const { bounds, cityName, companyId } = data;
        
        let filteredUsers = Array.from(userLocations.values());

        // Filter by city name
        if (cityName) {
          filteredUsers = filteredUsers.filter(user => 
            user.cityName?.toLowerCase().includes(cityName.toLowerCase())
          );
        }

        // Filter by company
        if (companyId) {
          filteredUsers = filteredUsers.filter(user => 
            user.company?.toString() === companyId
          );
        }

        // Filter by geographic bounds if provided
        if (bounds) {
          const [south, west, north, east] = bounds.split(',').map(Number);
          filteredUsers = filteredUsers.filter(user => {
            if (!user.location?.coordinates) return false;
            const [lng, lat] = user.location.coordinates;
            return lng >= west && lng <= east && lat >= south && lat <= north;
          });
        }

        const result = filteredUsers.map(user => ({
          userId: user.userId,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          location: user.location,
          cityName: user.cityName,
          updatedAt: user.updatedAt
        }));

        if (callback && typeof callback === 'function') {
          callback(result);
        } else {
          socket.emit('users_in_location', result);
        }
      } catch (error) {
        console.error('Error getting users in location:', error);
        socket.emit('error', { message: 'Failed to get users in location' });
      }
    });

    // Handle user activity (typing, viewing, etc.)
    socket.on('user_activity', (data) => {
      try {
        const { type, conversationId, timestamp } = data;
        
        // Update last activity
        if (onlineUsers.has(socket.userId)) {
          const userData = onlineUsers.get(socket.userId);
          userData.lastActivity = new Date(timestamp);
          userData.activityType = type;
          onlineUsers.set(socket.userId, userData);
        }

        // Broadcast activity if relevant
        if (conversationId && type === 'viewing_conversation') {
          socket.to(`conversation:${conversationId}`).emit('user_activity', {
            userId: socket.userId,
            type,
            conversationId,
            timestamp
          });
        }
      } catch (error) {
        console.error('Error handling user activity:', error);
      }
    });

    // Send current online status when user connects
    socket.emit('presence_connected', {
      onlineCount: onlineUsers.size,
      locationsCount: userLocations.size
    });
  });

  // Periodic cleanup of stale connections
  setInterval(() => {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [userId, userData] of onlineUsers.entries()) {
      if (now - userData.lastSeen > staleThreshold) {
        onlineUsers.delete(userId);
        userLocations.delete(userId);
        
        // Broadcast that user went offline
        io.emit('user_status_changed', {
          userId,
          status: 'offline',
          lastSeen: userData.lastSeen
        });
      }
    }
  }, 60000); // Check every minute
};
