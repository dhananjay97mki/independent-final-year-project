const express = require('express');
const citiesController = require('../controllers/cities.controller');
const auth = require('../middleware/auth.middleware');
const router = express.Router();

// GET /api/cities
router.get('/', citiesController.getCities);

// GET /api/cities/:id
router.get('/:id', citiesController.getCityById);

// GET /api/cities/near
router.get('/near', citiesController.getNearCities);

// GET /api/cities/:id/members
router.get('/:id/members', auth, citiesController.getCityMembers);

// POST /api/cities (admin only)
router.post('/', auth, citiesController.createCity);

// PATCH /api/cities/:id (admin only)
router.patch('/:id', auth, citiesController.updateCity);

// DELETE /api/cities/:id (admin only)
router.delete('/:id', auth, citiesController.deleteCity);

module.exports = router;
