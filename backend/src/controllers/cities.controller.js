const City = require('../models/City');
const User = require('../models/User');
const { sendResponse, sendError } = require('../utils/response');

exports.getCities = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};
    
    const cities = await City.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await City.countDocuments(query);
    
    sendResponse(res, { cities, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.getCityById = async (req, res, next) => {
  try {
    const city = await City.findById(req.params.id);
    
    if (!city) {
      return sendError(res, 'City not found', 404);
    }
    
    // Get current alumni count
    const alumniCount = await User.countDocuments({ 'currentCity.name': city.name });
    city.stats.alumCount = alumniCount;
    await city.save();
    
    sendResponse(res, city);
  } catch (error) {
    next(error);
  }
};

exports.getNearCities = async (req, res, next) => {
  try {
    const { lng, lat, radius = 100000 } = req.query; // radius in meters
    
    const cities = await City.find({
      centroid: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      }
    });
    
    sendResponse(res, cities);
  } catch (error) {
    next(error);
  }
};

exports.getCityMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const city = await City.findById(id);
    if (!city) {
      return sendError(res, 'City not found', 404);
    }
    
    const members = await User.find({ 'currentCity.name': city.name })
      .populate('placement.company', 'name slug logo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password');
    
    const total = await User.countDocuments({ 'currentCity.name': city.name });
    
    sendResponse(res, { members, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.createCity = async (req, res, next) => {
  try {
    const { name, country, centroid, stats } = req.body;
    
    const city = new City({ name, country, centroid, stats });
    await city.save();
    
    sendResponse(res, city, 201);
  } catch (error) {
    next(error);
  }
};

exports.updateCity = async (req, res, next) => {
  try {
    const city = await City.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (!city) {
      return sendError(res, 'City not found', 404);
    }
    
    sendResponse(res, city);
  } catch (error) {
    next(error);
  }
};

exports.deleteCity = async (req, res, next) => {
  try {
    const city = await City.findByIdAndDelete(req.params.id);
    
    if (!city) {
      return sendError(res, 'City not found', 404);
    }
    
    sendResponse(res, { message: 'City deleted successfully' });
  } catch (error) {
    next(error);
  }
};
