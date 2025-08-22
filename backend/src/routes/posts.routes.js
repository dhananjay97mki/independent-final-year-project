const express = require('express');
const postsController = require('../controllers/posts.controller');
const auth = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const router = express.Router();

// GET /api/posts
router.get('/', auth, postsController.getPosts);

// POST /api/posts
router.post('/', auth, upload.array('attachments', 5), postsController.createPost);

// GET /api/posts/:id
router.get('/:id', auth, postsController.getPostById);

// PATCH /api/posts/:id
router.patch('/:id', auth, postsController.updatePost);

// DELETE /api/posts/:id
router.delete('/:id', auth, postsController.deletePost);

// POST /api/posts/:id/like
router.post('/:id/like', auth, postsController.likePost);

// DELETE /api/posts/:id/like
router.delete('/:id/like', auth, postsController.unlikePost);

// POST /api/posts/:id/comment
router.post('/:id/comment', auth, postsController.addComment);

// GET /api/posts/:id/comments
router.get('/:id/comments', auth, postsController.getComments);

module.exports = router;
