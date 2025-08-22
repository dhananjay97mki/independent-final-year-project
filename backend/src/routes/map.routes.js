const express = require('express');
const mapController = require('../controllers/map.controller');
const auth = require('../middleware/auth.middleware');
const router = express.Router();

// GET /api/map/cluster
router.get('/cluster', auth, mapController.getClusters);

// GET /api/map/heat
router.get('/heat', auth, mapController.getHeat);

// GET /api/map/density-heatmap
router.get('/density-heatmap', auth, mapController.getDensityHeatmap);

// POST /api/map/share-location
router.post('/share-location', auth, mapController.shareLocation);

// DELETE /api/map/share-location
router.delete('/share-location', auth, mapController.stopSharingLocation);

// GET /api/map/user-locations
router.get('/user-locations', auth, mapController.getUserLocations);

module.exports = router;
