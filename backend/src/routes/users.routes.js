const express = require('express');
const usersController = require('../controllers/users.controller');
const auth = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const router = express.Router();

// GET /api/users/me
router.get('/me', auth, usersController.getMe);

// PATCH /api/users/me
router.patch('/me', auth, usersController.updateMe);

// PATCH /api/users/me/avatar
router.patch('/me/avatar', auth, upload.single('avatar'), usersController.updateAvatar);

// GET /api/users/search
router.get('/search', auth, usersController.searchUsers);

// GET /api/users/nearby
router.get('/nearby', auth, usersController.getNearbyUsers);

// GET /api/users/city/:cityId
router.get('/city/:cityId', auth, usersController.getUsersByCity);

// GET /api/users/:id
router.get('/:id', auth, usersController.getUserById);

// POST /api/users/:id/follow-company
router.post('/:id/follow-company', auth, usersController.followCompany);

// DELETE /api/users/:id/unfollow-company/:companyId
router.delete('/:id/unfollow-company/:companyId', auth, usersController.unfollowCompany);

module.exports = router;
