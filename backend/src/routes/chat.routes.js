const express = require('express');
const chatController = require('../controllers/chat.controller');
const auth = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const router = express.Router();

// GET /api/chat/conversations
router.get('/conversations', auth, chatController.getConversations);

// POST /api/chat/conversations
router.post('/conversations', auth, chatController.createConversation);

// GET /api/chat/conversations/:id
router.get('/conversations/:id', auth, chatController.getConversation);

// GET /api/chat/conversations/:id/messages
router.get('/conversations/:id/messages', auth, chatController.getMessages);

// POST /api/chat/conversations/:id/messages
router.post('/conversations/:id/messages', auth, upload.single('attachment'), chatController.sendMessage);

// PATCH /api/chat/messages/:id/read
router.patch('/messages/:id/read', auth, chatController.markMessageRead);

// GET /api/chat/rooms/city/:cityId
router.get('/rooms/city/:cityId', auth, chatController.getCityRoom);

// GET /api/chat/rooms/company/:companyId
router.get('/rooms/company/:companyId', auth, chatController.getCompanyRoom);

module.exports = router;
