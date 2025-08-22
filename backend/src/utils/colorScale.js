const User = require('../models/User');
const { sendResponse, sendError } = require('../utils/response');
const { toMongoBounds, createClusters } = require('../utils/geo');

exports.getClusters = async (req, res, next) => {
  try {
    const { bounds, zoom = 5, companyId } = req.query;

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

    const users = await User.find(query)
      .select('currentCity.loc name avatar role')
      .lean();

    const clusters = createClusters(users, parseInt(zoom));

    sendResponse(res, clusters);
  } catch (error) {
    next(error);
  }
};

exports.getHeat = async (req, res, next) => {
  try {
    const { bounds, companyId } = req.query;

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

    const users = await User.find(query)
      .select('currentCity.loc')
      .lean();

    // ✅ Correct mapping to heatmap points
    const heatPoints = users.map(user => ({
      lng: user.currentCity.loc.coordinates[0], // longitude
      lat: user.currentCity.loc.coordinates[1], // latitude
      intensity: 1
    }));

    sendResponse(res, heatPoints);
  } catch (error) {
    next(error);
  }
};

exports.getDensityHeatmap = async (req, res, next) => {
  try {
    const { bounds } = req.query;

    const pipeline = [
      {
        $match: {
          'preferences.allowMap': true,
          'currentCity.loc': { $exists: true }
        }
      }
    ];

    if (bounds) {
      const mongoBounds = toMongoBounds(bounds);
      pipeline[0].$match['currentCity.loc'] = {
        $geoWithin: { $box: mongoBounds }
      };
    }

    pipeline.push({
      $group: {
        _id: {
          $let: {
            vars: {
              lng: { $arrayElemAt: ['$currentCity.loc.coordinates', 0] },
              lat: { $arrayElemAt: ['$currentCity.loc.coordinates', 1] }
            },
            in: {
              lng: { $floor: { $multiply: ['$$lng', 100] } },
              lat: { $floor: { $multiply: ['$$lat', 100] } }
            }
          }
        },
        count: { $sum: 1 }
      }
    });

    const densityData = await User.aggregate(pipeline);

    const heatmap = densityData.map(item => ({
      lng: item._id.lng / 100,
      lat: item._id.lat / 100,
      intensity: item.count
    }));

    sendResponse(res, heatmap);
  } catch (error) {
    next(error);
  }
};

exports.shareLocation = async (req, res, next) => {
  try {
    const { lng, lat } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      'preferences.allowMap': true,
      'currentCity.loc': {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      }
    });

    sendResponse(res, { message: 'Location shared successfully' });
  } catch (error) {
    next(error);
  }
};

exports.stopSharingLocation = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      'preferences.allowMap': false
    });

    sendResponse(res, { message: 'Location sharing stopped' });
  } catch (error) {
    next(error);
  }
};

exports.getUserLocations = async (req, res, next) => {
  try {
    const users = await User.find({
      'preferences.allowMap': true,
      'currentCity.loc': { $exists: true },
      _id: { $ne: req.user.id }
    })
      .select('name avatar currentCity.loc role')
      .populate('placement.company', 'name slug logo');

    sendResponse(res, users);
  } catch (error) {
    next(error);
  }
};
