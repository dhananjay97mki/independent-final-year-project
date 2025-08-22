const User = require('../models/User');
const { toMongoBounds, calculateDistance, createHeatmapGrid } = require('../utils/geo');

class MapService {
  async getHeatmapData(options = {}) {
    const { bounds, companyId, cityId } = options;
    
    const query = {
      'preferences.allowMap': true,
      'currentCity.loc': { $exists: true }
    };
    
    if (bounds) {
      query['currentCity.loc'] = {
        $geoWithin: { $box: toMongoBounds(bounds) }
      };
    }
    
    if (companyId) {
      query['placement.company'] = companyId;
    }
    
    if (cityId) {
      query['currentCity._id'] = cityId;
    }
    
    const users = await User.find(query)
      .select('currentCity.loc')
      .lean();
    
    const heatPoints = users.map(user => ({
      lng: user.currentCity.loc.coordinates[0],
      lat: user.currentCity.loc.coordinates[1],   // ✅ fixed
      intensity: 1
    }));
    
    return heatPoints;
  }

  async getClusteredData(options = {}) {
    const { bounds, zoom = 5, companyId, cityId } = options;
    
    const query = {
      'preferences.allowMap': true,
      'currentCity.loc': { $exists: true }
    };
    
    if (bounds) {
      query['currentCity.loc'] = {
        $geoWithin: { $box: toMongoBounds(bounds) }
      };
    }
    
    if (companyId) {
      query['placement.company'] = companyId;
    }
    
    if (cityId) {
      query['currentCity._id'] = cityId;
    }
    
    const users = await User.find(query)
      .select('currentCity.loc name avatar role placement.company')
      .populate('placement.company', 'name logo')
      .lean();
    
    // Create clusters based on zoom level and proximity
    const clusters = this.createClusters(users, parseInt(zoom));
    
    return clusters;
  }

  createClusters(users, zoom) {
    const clusters = [];
    const processed = new Set();
    const clusterRadius = this.getClusterRadius(zoom);
    
    users.forEach((user, index) => {
      if (processed.has(index)) return;
      
      const cluster = {
        id: `cluster-${index}`,
        lng: user.currentCity.loc.coordinates[0],
        lat: user.currentCity.loc.coordinates[1],   // ✅ fixed
        count: 1,
        users: [user]
      };
      
      // Find nearby users to cluster
      users.forEach((otherUser, otherIndex) => {
        if (index !== otherIndex && !processed.has(otherIndex)) {
          const distance = calculateDistance(
            user.currentCity.loc.coordinates,
            otherUser.currentCity.loc.coordinates
          );
          
          if (distance <= clusterRadius) {
            cluster.users.push(otherUser);
            cluster.count++;
            processed.add(otherIndex);
          }
        }
      });
      
      processed.add(index);
      clusters.push(cluster);
    });
    
    return clusters;
  }

  getClusterRadius(zoom) {
    // Return radius in meters based on zoom level
    const baseRadius = 50000; // 50km at zoom 1
    return baseRadius / Math.pow(2, zoom - 1);
  }

  async getDensityHeatmap(options = {}) {
    const { bounds, gridSize = 0.1 } = options; // gridSize in degrees
    
    const query = {
      'preferences.allowMap': true,
      'currentCity.loc': { $exists: true }
    };
    
    if (bounds) {
      query['currentCity.loc'] = {
        $geoWithin: { $box: toMongoBounds(bounds) }
      };
    }
    
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: {
            lng: { 
              $multiply: [
                { $floor: { 
                  $divide: [
                    { $arrayElemAt: ['$currentCity.loc.coordinates', 0] },
                    gridSize
                  ]
                }},
                gridSize
              ]
            },
            lat: {
              $multiply: [
                { $floor: {
                  $divide: [
                    { $arrayElemAt: ['$currentCity.loc.coordinates', 1] },
                    gridSize
                  ]
                }},
                gridSize
              ]
            }
          },
          count: { $sum: 1 }
        }
      }
    ];
    
    const densityData = await User.aggregate(pipeline);
    
    return densityData.map(item => ({
      lng: item._id.lng,
      lat: item._id.lat,
      intensity: item.count
    }));
  }

  async getNearbyAlumni(userLocation, options = {}) {
    const { radius = 50000, companyId, excludeUserId, limit = 50 } = options;
    const { lng, lat } = userLocation;
    
    const query = {
      'currentCity.loc': {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      },
      'preferences.allowMap': true
    };
    
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }
    
    if (companyId) {
      query['placement.company'] = companyId;
    }
    
    return await User.find(query)
      .select('name avatar role currentCity placement')
      .populate('placement.company', 'name slug logo')
      .limit(limit);
  }

  async updateUserLocation(userId, locationData) {
    const { lng, lat, cityName, country } = locationData;
    
    return await User.findByIdAndUpdate(
      userId,
      {
        currentCity: {
          name: cityName,
          country,
          loc: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          }
        }
      },
      { new: true }
    );
  }

  async toggleLocationSharing(userId, allowMap) {
    return await User.findByIdAndUpdate(
      userId,
      { 'preferences.allowMap': allowMap },
      { new: true }
    );
  }

  async getLocationStats() {
    const stats = await User.aggregate([
      {
        $match: {
          'preferences.allowMap': true,
          'currentCity.loc': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$currentCity.name',
          count: { $sum: 1 },
          center: {
            $first: '$currentCity.loc'
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    
    return stats;
  }

  async getCompanyLocationDistribution(companyId) {
    return await User.aggregate([
      {
        $match: {
          'placement.company': companyId,
          'preferences.allowMap': true,
          'currentCity.loc': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$currentCity.name',
          count: { $sum: 1 },
          users: {
            $push: {
              name: '$name',
              avatar: '$avatar',
              role: '$placement.role'
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }
}

module.exports = new MapService();
