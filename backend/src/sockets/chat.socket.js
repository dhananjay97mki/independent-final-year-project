const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

module.exports = (io) => {
  io.on('connection', (socket) => {
    
    // Join a conversation room
    socket.on('join_conversation', async (conversationId) => {
      try {
        // Verify user is member of conversation
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation || !conversation.members.includes(socket.userId)) {
          socket.emit('error', { message: 'Unauthorized access to conversation' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        console.log(`User ${socket.user.name} joined conversation: ${conversationId}`);
        
        // Notify other members that user joined
        socket.to(`conversation:${conversationId}`).emit('user_joined_conversation', {
          userId: socket.userId,
          userName: socket.user.name,
          conversationId
        });
        
        // Mark user as active in this conversation
        socket.activeConversation = conversationId;
        
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Leave a conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      
      // Notify other members that user left
      socket.to(`conversation:${conversationId}`).emit('user_left_conversation', {
        userId: socket.userId,
        userName: socket.user.name,
        conversationId
      });
      
      if (socket.activeConversation === conversationId) {
        socket.activeConversation = null;
      }
      
      console.log(`User ${socket.user.name} left conversation: ${conversationId}`);
    });

    // Send a message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, text, attachment } = data;
        
        // Verify user is member of conversation
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation || !conversation.members.includes(socket.userId)) {
          socket.emit('error', { message: 'Unauthorized access to conversation' });
          return;
        }

        // Create message
        const message = new Message({
          conversation: conversationId,
          sender: socket.userId,
          text,
          attachment,
          sentAt: new Date()
        });

        await message.save();
        await message.populate('sender', 'name avatar');

        // Update conversation timestamp
        conversation.updatedAt = new Date();
        await conversation.save();

        // Broadcast message to all conversation members
        io.to(`conversation:${conversationId}`).emit('new_message', {
          message: message.toObject(),
          conversationId
        });

        // Send push notifications to offline users
        const offlineMembers = conversation.members.filter(memberId => 
          memberId.toString() !== socket.userId && 
          !io.sockets.adapter.rooms.get(`user:${memberId}`)
        );

        // Create notifications for offline users
        const notifications = offlineMembers.map(memberId => ({
          recipient: memberId,
          type: 'message',
          payload: {
            conversationId,
            senderId: socket.userId,
            senderName: socket.user.name,
            messageText: text?.substring(0, 100) || 'Sent an attachment',
            conversationType: conversation.type
          }
        }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }

        console.log(`Message sent by ${socket.user.name} in conversation: ${conversationId}`);
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing_start', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.user.name,
        conversationId
      });
    });

    socket.on('typing_stop', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        userName: socket.user.name,
        conversationId
      });
    });

    // Mark messages as read
    socket.on('mark_messages_read', async (data) => {
      try {
        const { conversationId, messageIds } = data;
        
        // Verify user is member of conversation
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation || !conversation.members.includes(socket.userId)) {
          socket.emit('error', { message: 'Unauthorized access to conversation' });
          return;
        }

        // Mark messages as read
        await Message.updateMany(
          { 
            _id: { $in: messageIds },
            conversation: conversationId 
          },
          { $addToSet: { readBy: socket.userId } }
        );

        // Notify other conversation members about read status
        socket.to(`conversation:${conversationId}`).emit('messages_read', {
          userId: socket.userId,
          messageIds,
          conversationId
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    // Join city room
    socket.on('join_city_room', async (cityId) => {
      try {
        // Verify user can access city room
        if (!socket.user.currentCity || socket.user.currentCity.name !== cityId) {
          // Allow if user has permission or is alumni
          if (socket.user.role !== 'alumni') {
            socket.emit('error', { message: 'Access denied to city room' });
            return;
          }
        }

        socket.join(`city:${cityId}`);
        
        // Notify others in city room
        socket.to(`city:${cityId}`).emit('user_joined_city', {
          userId: socket.userId,
          userName: socket.user.name,
          userRole: socket.user.role,
          cityId
        });

        console.log(`User ${socket.user.name} joined city room: ${cityId}`);
        
      } catch (error) {
        console.error('Error joining city room:', error);
        socket.emit('error', { message: 'Failed to join city room' });
      }
    });

    // Join company room
    socket.on('join_company_room', async (companyId) => {
      try {
        // Verify user can access company room
        const userCompanyId = socket.user.placement?.company?.toString();
        const isFollowing = socket.user.companiesFollowed?.includes(companyId);
        
        if (userCompanyId !== companyId && !isFollowing) {
          socket.emit('error', { message: 'Access denied to company room' });
          return;
        }

        socket.join(`company:${companyId}`);
        
        // Notify others in company room
        socket.to(`company:${companyId}`).emit('user_joined_company', {
          userId: socket.userId,
          userName: socket.user.name,
          userRole: socket.user.role,
          companyId
        });

        console.log(`User ${socket.user.name} joined company room: ${companyId}`);
        
      } catch (error) {
        console.error('Error joining company room:', error);
        socket.emit('error', { message: 'Failed to join company room' });
      }
    });

    // Send message to city room
    socket.on('send_city_message', async (data) => {
      try {
        const { cityId, text } = data;
        
        // Create and broadcast message
        const messageData = {
          id: Date.now(), // Temporary ID for real-time display
          sender: {
            _id: socket.userId,
            name: socket.user.name,
            avatar: socket.user.avatar,
            role: socket.user.role
          },
          text,
          sentAt: new Date(),
          type: 'city'
        };

        // Broadcast to city room
        io.to(`city:${cityId}`).emit('new_city_message', {
          message: messageData,
          cityId
        });

        console.log(`City message sent by ${socket.user.name} in city: ${cityId}`);
        
      } catch (error) {
        console.error('Error sending city message:', error);
        socket.emit('error', { message: 'Failed to send city message' });
      }
    });

    // Send message to company room
    socket.on('send_company_message', async (data) => {
      try {
        const { companyId, text } = data;
        
        // Create and broadcast message
        const messageData = {
          id: Date.now(), // Temporary ID for real-time display
          sender: {
            _id: socket.userId,
            name: socket.user.name,
            avatar: socket.user.avatar,
            role: socket.user.role
          },
          text,
          sentAt: new Date(),
          type: 'company'
        };

        // Broadcast to company room
        io.to(`company:${companyId}`).emit('new_company_message', {
          message: messageData,
          companyId
        });

        console.log(`Company message sent by ${socket.user.name} in company: ${companyId}`);
        
      } catch (error) {
        console.error('Error sending company message:', error);
        socket.emit('error', { message: 'Failed to send company message' });
      }
    });

    // Handle disconnection cleanup
    socket.on('disconnect', () => {
      // Clear typing indicators
      if (socket.activeConversation) {
        socket.to(`conversation:${socket.activeConversation}`).emit('user_stopped_typing', {
          userId: socket.userId,
          userName: socket.user.name,
          conversationId: socket.activeConversation
        });
      }
    });
  });
};
