const User = require('../models/User');
const { sendResponse, sendError } = require('../utils/response');

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('placement.company', 'name slug logo')
      .populate('companiesFollowed', 'name slug logo');
    
    sendResponse(res, user);
  } catch (error) {
    next(error);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'currentCity', 'placement', 'preferences', 'department', 'batch'];
    const updates = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true })
      .populate('placement.company', 'name slug logo');
    
    sendResponse(res, user);
  } catch (error) {
    next(error);
  }
};

exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No avatar file provided', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { avatar: req.file.path }, 
      { new: true }
    );
    
    sendResponse(res, { avatar: user.avatar });
  } catch (error) {
    next(error);
  }
};

exports.searchUsers = async (req, res, next) => {
  try {
    const { query, city, company, role, page = 1, limit = 20 } = req.query;
    
    const searchQuery = {};
    
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (city) searchQuery['currentCity.name'] = { $regex: city, $options: 'i' };
    if (company) searchQuery['placement.company'] = company;
    if (role) searchQuery.role = role;

    const users = await User.find(searchQuery)
      .populate('placement.company', 'name slug logo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password');
    
    const total = await User.countDocuments(searchQuery);
    
    sendResponse(res, { users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.getNearbyUsers = async (req, res, next) => {
  try {
    const { lng, lat, radius = 50000 } = req.query; // radius in meters
    
    const users = await User.find({
      'currentCity.loc': {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      },
      _id: { $ne: req.user.id },
      'preferences.allowMap': true
    })
    .populate('placement.company', 'name slug logo')
    .select('-password');
    
    sendResponse(res, users);
  } catch (error) {
    next(error);
  }
};

exports.getUsersByCity = async (req, res, next) => {
  try {
    const { cityId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const users = await User.find({ 'currentCity._id': cityId })
      .populate('placement.company', 'name slug logo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password');
    
    const total = await User.countDocuments({ 'currentCity._id': cityId });
    
    sendResponse(res, { users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('placement.company', 'name slug logo')
      .populate('companiesFollowed', 'name slug logo')
      .select('-password');
    
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    
    sendResponse(res, user);
  } catch (error) {
    next(error);
  }
};

exports.followCompany = async (req, res, next) => {
  try {
    const { companyId } = req.body;
    
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { companiesFollowed: companyId }
    });
    
    sendResponse(res, { message: 'Company followed successfully' });
  } catch (error) {
    next(error);
  }
};

exports.unfollowCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { companiesFollowed: companyId }
    });
    
    sendResponse(res, { message: 'Company unfollowed successfully' });
  } catch (error) {
    next(error);
  }
};
