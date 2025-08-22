const Notification = require('../models/Notification');
const { sendResponse, sendError } = require('../utils/response');

exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notification.countDocuments({ recipient: req.user.id });
    
    sendResponse(res, { notifications, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { seen: true },
      { new: true }
    );
    
    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }
    
    sendResponse(res, notification);
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, seen: false },
      { seen: true }
    );
    
    sendResponse(res, { message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });
    
    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }
    
    sendResponse(res, { message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      seen: false
    });
    
    sendResponse(res, { unreadCount: count });
  } catch (error) {
    next(error);
  }
};
