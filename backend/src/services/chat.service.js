const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

class ChatService {
  async createConversation(userId, conversationData) {
    const { type, members, city, company } = conversationData;
    
    let conversation;
    
    if (type === 'dm') {
      // Check if DM conversation already exists
      const existingConversation = await Conversation.findOne({
        type: 'dm',
        members: { $all: [userId, ...members], $size: members.length + 1 }
      });
      
      if (existingConversation) {
        return existingConversation;
      }
      
      conversation = new Conversation({
        type,
        members: [userId, ...members]
      });
    } else if (type === 'city') {
      // Check if city room already exists
      conversation = await Conversation.findOne({ type: 'city', city });
      
      if (!conversation) {
        conversation = new Conversation({
          type,
          city,
          members: []
        });
      }
      
      // Add user to city room if not already a member
      if (!conversation.members.includes(userId)) {
        conversation.members.push(userId);
      }
    } else if (type === 'company') {
      // Check if company room already exists
      conversation = await Conversation.findOne({ type: 'company', company });
      
      if (!conversation) {
        conversation = new Conversation({
          type,
          company,
          members: []
        });
      }
      
      // Add user to company room if not already a member
      if (!conversation.members.includes(userId)) {
        conversation.members.push(userId);
      }
    }
    
    await conversation.save();
    return conversation;
  }

  async getUserConversations(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    
    const conversations = await Conversation.find({
      members: userId
    })
    .populate('members', 'name avatar')
    .populate('city', 'name')
    .populate('company', 'name slug logo')
    .sort({ updatedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    // Get last message for each conversation
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conversation) => {
        const lastMessage = await Message.findOne({ conversation: conversation._id })
          .sort({ sentAt: -1 })
          .populate('sender', 'name');
        
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          readBy: { $ne: userId }
        });
        
        return {
          ...conversation.toObject(),
          lastMessage,
          unreadCount
        };
      })
    );
    
    const total = await Conversation.countDocuments({ members: userId });
    
    return {
      conversations: conversationsWithLastMessage,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getConversationMessages(conversationId, userId, options = {}) {
    const { page = 1, limit = 50 } = options;
    
    // Verify user is member of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.members.includes(userId)) {
      throw new Error('Unauthorized access to conversation');
    }
    
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name avatar')
      .sort({ sentAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Message.countDocuments({ conversation: conversationId });
    
    return {
      messages: messages.reverse(), // Reverse to show oldest first
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async sendMessage(conversationId, senderId, messageData) {
    const { text, attachment } = messageData;
    
    // Verify user is member of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.members.includes(senderId)) {
      throw new Error('Unauthorized access to conversation');
    }
    
    const message = new Message({
      conversation: conversationId,
      sender: senderId,
      text,
      attachment
    });
    
    await message.save();
    await message.populate('sender', 'name avatar');
    
    // Update conversation timestamp
    conversation.updatedAt = new Date();
    await conversation.save();
    
    return message;
  }

  async markMessageAsRead(messageId, userId) {
    const message = await Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { readBy: userId } },
      { new: true }
    );
    
    return message;
  }

  async markConversationAsRead(conversationId, userId) {
    const messages = await Message.find({
      conversation: conversationId,
      readBy: { $ne: userId }
    });
    
    await Message.updateMany(
      { conversation: conversationId },
      { $addToSet: { readBy: userId } }
    );
    
    return { messagesMarked: messages.length };
  }

  async getCityRoom(cityId, userId) {
    let conversation = await Conversation.findOne({
      type: 'city',
      city: cityId
    }).populate('city', 'name');
    
    if (!conversation) {
      conversation = new Conversation({
        type: 'city',
        city: cityId,
        members: [userId]
      });
      await conversation.save();
      await conversation.populate('city', 'name');
    } else if (!conversation.members.includes(userId)) {
      conversation.members.push(userId);
      await conversation.save();
    }
    
    return conversation;
  }

  async getCompanyRoom(companyId, userId) {
    let conversation = await Conversation.findOne({
      type: 'company',
      company: companyId
    }).populate('company', 'name slug logo');
    
    if (!conversation) {
      conversation = new Conversation({
        type: 'company',
        company: companyId,
        members: [userId]
      });
      await conversation.save();
      await conversation.populate('company', 'name slug logo');
    } else if (!conversation.members.includes(userId)) {
      conversation.members.push(userId);
      await conversation.save();
    }
    
    return conversation;
  }

  async getUnreadMessageCount(userId) {
    const conversations = await Conversation.find({ members: userId });
    const conversationIds = conversations.map(conv => conv._id);
    
    const unreadCount = await Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: userId },
      readBy: { $ne: userId }
    });
    
    return { unreadCount };
  }

  async searchMessages(userId, query, options = {}) {
    const { page = 1, limit = 20 } = options;
    
    const userConversations = await Conversation.find({ members: userId });
    const conversationIds = userConversations.map(conv => conv._id);
    
    const messages = await Message.find({
      conversation: { $in: conversationIds },
      text: { $regex: query, $options: 'i' }
    })
    .populate('sender', 'name avatar')
    .populate('conversation', 'type')
    .sort({ sentAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    const total = await Message.countDocuments({
      conversation: { $in: conversationIds },
      text: { $regex: query, $options: 'i' }
    });
    
    return {
      messages,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}

module.exports = new ChatService();
