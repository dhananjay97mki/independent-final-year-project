const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { sendResponse, sendError } = require('../utils/response');

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      members: req.user.id
    })
    .populate('members', 'name avatar')
    .populate('city', 'name')
    .populate('company', 'name slug logo')
    .sort({ updatedAt: -1 });
    
    sendResponse(res, conversations);
  } catch (error) {
    next(error);
  }
};

exports.createConversation = async (req, res, next) => {
  try {
    const { type, members, city, company } = req.body;
    
    let conversation;
    
    if (type === 'dm') {
      // Check if DM conversation already exists
      conversation = await Conversation.findOne({
        type: 'dm',
        members: { $all: [req.user.id, ...members] }
      });
      
      if (conversation) {
        return sendResponse(res, conversation);
      }
      
      conversation = new Conversation({
        type,
        members: [req.user.id, ...members]
      });
    } else {
      conversation = new Conversation({
        type,
        members: [req.user.id],
        city,
        company
      });
    }
    
    await conversation.save();
    await conversation.populate('members', 'name avatar');
    await conversation.populate('city', 'name');
    await conversation.populate('company', 'name slug logo');
    
    sendResponse(res, conversation, 201);
  } catch (error) {
    next(error);
  }
};

exports.getConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('members', 'name avatar')
      .populate('city', 'name')
      .populate('company', 'name slug logo');
    
    if (!conversation || !conversation.members.some(member => member._id.toString() === req.user.id)) {
      return sendError(res, 'Conversation not found', 404);
    }
    
    sendResponse(res, conversation);
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Verify user is member of conversation
    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.members.includes(req.user.id)) {
      return sendError(res, 'Unauthorized', 403);
    }
    
    const messages = await Message.find({ conversation: id })
      .populate('sender', 'name avatar')
      .sort({ sentAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Message.countDocuments({ conversation: id });
    
    sendResponse(res, { messages: messages.reverse(), total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const attachment = req.file ? req.file.path : null;
    
    // Verify user is member of conversation
    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.members.includes(req.user.id)) {
      return sendError(res, 'Unauthorized', 403);
    }
    
    const message = new Message({
      conversation: id,
      sender: req.user.id,
      text,
      attachment
    });
    
    await message.save();
    await message.populate('sender', 'name avatar');
    
    // Update conversation timestamp
    conversation.updatedAt = new Date();
    await conversation.save();
    
    sendResponse(res, message, 201);
  } catch (error) {
    next(error);
  }
};

exports.markMessageRead = async (req, res, next) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user.id }
    });
    
    sendResponse(res, { message: 'Message marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.getCityRoom = async (req, res, next) => {
  try {
    const { cityId } = req.params;
    
    let conversation = await Conversation.findOne({
      type: 'city',
      city: cityId
    }).populate('city', 'name');
    
    if (!conversation) {
      conversation = new Conversation({
        type: 'city',
        city: cityId,
        members: []
      });
      await conversation.save();
      await conversation.populate('city', 'name');
    }
    
    sendResponse(res, conversation);
  } catch (error) {
    next(error);
  }
};

exports.getCompanyRoom = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    
    let conversation = await Conversation.findOne({
      type: 'company',
      company: companyId
    }).populate('company', 'name slug logo');
    
    if (!conversation) {
      conversation = new Conversation({
        type: 'company',
        company: companyId,
        members: []
      });
      await conversation.save();
      await conversation.populate('company', 'name slug logo');
    }
    
    sendResponse(res, conversation);
  } catch (error) {
    next(error);
  }
};
