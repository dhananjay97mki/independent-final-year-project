const express = require('express');
const cityIntelController = require('../controllers/cityIntel.controller');
const auth = require('../middleware/auth.middleware');
const router = express.Router();

// GET /api/city-intel/:cityId
router.get('/:cityId', auth, cityIntelController.getCityIntel);

// PATCH /api/city-intel/:cityId
router.patch('/:cityId', auth, cityIntelController.updateCityIntel);

// POST /api/city-intel/:cityId/tips
router.post('/:cityId/tips', auth, cityIntelController.addCityTip);

// GET /api/city-intel/:cityId/tips
router.get('/:cityId/tips', auth, cityIntelController.getCityTips);

// PATCH /api/city-intel/tips/:tipId
router.patch('/tips/:tipId', auth, cityIntelController.updateCityTip);

// DELETE /api/city-intel/tips/:tipId
router.delete('/tips/:tipId', auth, cityIntelController.deleteCityTip);

module.exports = router;
