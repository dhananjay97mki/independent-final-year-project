const express = require('express');
const authController = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../utils/validators/auth.validators');
const router = express.Router();

// POST /api/auth/register
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', authController.resetPassword);

// GET /api/auth/verify-token
router.get('/verify-token', authController.verifyToken);

module.exports = router;
