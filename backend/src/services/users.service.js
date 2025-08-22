const User = require('../models/User');
const bcrypt = require('bcryptjs');

class UsersService {
  async createUser(userData) {
    const { password, ...rest } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = new User({
      ...rest,
      password: hashedPassword
    });
    
    return await user.save();
  }

  async getUserById(id, selectFields = '') {
    return await User.findById(id)
      .select(selectFields)
      .populate('placement.company', 'name slug logo')
      .populate('companiesFollowed', 'name slug logo');
  }

  async updateUserLocation(userId, locationData) {
    const { cityName, country, coordinates } = locationData;
    
    return await User.findByIdAndUpdate(
      userId,
      {
        currentCity: {
          name: cityName,
          country,
          loc: {
            type: 'Point',
            coordinates: [coordinates.lng, coordinates.lat]
          }
        }
      },
      { new: true }
    );
  }

  async updateUserPlacement(userId, placementData) {
    return await User.findByIdAndUpdate(
      userId,
      { placement: placementData },
      { new: true }
    ).populate('placement.company', 'name slug logo');
  }

  async searchUsers(searchParams) {
    const { query, city, company, role, department, batch, page = 1, limit = 20 } = searchParams;
    
    const searchQuery = {};
    
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { department: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (city) searchQuery['currentCity.name'] = { $regex: city, $options: 'i' };
    if (company) searchQuery['placement.company'] = company;
    if (role) searchQuery.role = role;
    if (department) searchQuery.department = { $regex: department, $options: 'i' };
    if (batch) searchQuery.batch = batch;

    const users = await User.find(searchQuery)
      .populate('placement.company', 'name slug logo')
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(searchQuery);
    
    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getNearbyUsers(userLocation, options = {}) {
    const { radius = 50000, excludeUserId, companyId } = options;
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
    
    if (excludeUserId) query._id = { $ne: excludeUserId };
    if (companyId) query['placement.company'] = companyId;
    
    return await User.find(query)
      .populate('placement.company', 'name slug logo')
      .select('-password')
      .limit(50);
  }

  async getUserStatistics(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    // Get user's connections count, posts count, etc.
    const stats = await User.aggregate([
      { $match: { _id: user._id } },
      {
        $lookup: {
          from: 'connections',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $or: [
                      { $eq: ['$from', '$$userId'] },
                      { $eq: ['$to', '$$userId'] }
                    ]},
                    { $eq: ['$status', 'accepted'] }
                  ]
                }
              }
            }
          ],
          as: 'connections'
        }
      },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'author',
          as: 'posts'
        }
      },
      {
        $project: {
          connectionsCount: { $size: '$connections' },
          postsCount: { $size: '$posts' },
          joinedAt: '$createdAt'
        }
      }
    ]);
    
    return stats[0] || { connectionsCount: 0, postsCount: 0, joinedAt: user.createdAt };
  }

  async updateUserPreferences(userId, preferences) {
    return await User.findByIdAndUpdate(
      userId,
      { $set: { preferences } },
      { new: true }
    );
  }

  async followCompany(userId, companyId) {
    return await User.findByIdAndUpdate(
      userId,
      { $addToSet: { companiesFollowed: companyId } },
      { new: true }
    );
  }

  async unfollowCompany(userId, companyId) {
    return await User.findByIdAndUpdate(
      userId,
      { $pull: { companiesFollowed: companyId } },
      { new: true }
    );
  }

  async getBatchmates(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    return await User.find({
      _id: { $ne: userId },
      batch: user.batch,
      department: user.department
    })
    .populate('placement.company', 'name slug logo')
    .select('-password')
    .limit(50);
  }
}

module.exports = new UsersService();
