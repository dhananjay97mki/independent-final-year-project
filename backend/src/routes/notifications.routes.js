const express = require('express');
const notificationsController = require('../controllers/notifications.controller');
const auth = require('../middleware/auth.middleware');
const router = express.Router();

// GET /api/notifications
router.get('/', auth, notificationsController.getNotifications);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', auth, notificationsController.markAsRead);

// PATCH /api/notifications/read-all
router.patch('/read-all', auth, notificationsController.markAllAsRead);

// DELETE /api/notifications/:id
router.delete('/:id', auth, notificationsController.deleteNotification);

// GET /api/notifications/unread-count
router.get('/unread-count', auth, notificationsController.getUnreadCount);

module.exports = router;
