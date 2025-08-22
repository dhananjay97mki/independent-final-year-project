const City = require('../models/City');
const User = require('../models/User');

class CitiesService {
  async createCity(cityData) {
    const city = new City(cityData);
    return await city.save();
  }

  async getCityById(cityId) {
    const city = await City.findById(cityId);
    if (!city) return null;
    
    // Update alumni count
    const alumniCount = await User.countDocuments({ 'currentCity.name': city.name });
    
    if (city.stats.alumCount !== alumniCount) {
      city.stats.alumCount = alumniCount;
      await city.save();
    }
    
    return city;
  }

  async getCityStats(cityId) {
    const city = await City.findById(cityId);
    if (!city) throw new Error('City not found');
    
    const [
      alumniCount,
      companyDistribution,
      departmentDistribution,
      batchDistribution
    ] = await Promise.all([
      User.countDocuments({ 'currentCity.name': city.name }),
      this.getCompanyDistribution(city.name),
      this.getDepartmentDistribution(city.name),
      this.getBatchDistribution(city.name)
    ]);
    
    return {
      alumniCount,
      companyDistribution,
      departmentDistribution,
      batchDistribution
    };
  }

  async getCompanyDistribution(cityName) {
    return await User.aggregate([
      { 
        $match: { 
          'currentCity.name': cityName,
          'placement.company': { $exists: true }
        } 
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'placement.company',
          foreignField: '_id',
          as: 'company'
        }
      },
      { $unwind: '$company' },
      {
        $group: {
          _id: '$company._id',
          name: { $first: '$company.name' },
          logo: { $first: '$company.logo' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
  }

  async getDepartmentDistribution(cityName) {
    return await User.aggregate([
      { $match: { 'currentCity.name': cityName } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  async getBatchDistribution(cityName) {
    return await User.aggregate([
      { $match: { 'currentCity.name': cityName } },
      {
        $group: {
          _id: '$batch',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
  }

  async getCityMembers(cityId, options = {}) {
    const { page = 1, limit = 20, company, department, batch } = options;
    
    const city = await City.findById(cityId);
    if (!city) throw new Error('City not found');
    
    const query = { 'currentCity.name': city.name };
    if (company) query['placement.company'] = company;
    if (department) query.department = { $regex: department, $options: 'i' };
    if (batch) query.batch = batch;
    
    const members = await User.find(query)
      .populate('placement.company', 'name slug logo')
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);
    
    return {
      members,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getNearCities(coordinates, radius = 100000) {
    const { lng, lat } = coordinates;
    
    return await City.find({
      centroid: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      }
    }).limit(10);
  }

  async updateCityStats(cityId, statsData) {
    return await City.findByIdAndUpdate(
      cityId,
      { $set: { stats: statsData } },
      { new: true }
    );
  }

  async searchCities(searchParams) {
    const { query, page = 1, limit = 20 } = searchParams;
    
    const searchQuery = query ? 
      { name: { $regex: query, $options: 'i' } } : {};
    
    const cities = await City.find(searchQuery)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'stats.alumCount': -1 });
    
    const total = await City.countDocuments(searchQuery);
    
    return {
      cities,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getPopularCities(limit = 10) {
    return await City.find({})
      .sort({ 'stats.alumCount': -1 })
      .limit(limit);
  }

  async updateAlumniCounts() {
    const cities = await City.find({});
    
    for (const city of cities) {
      const count = await User.countDocuments({ 'currentCity.name': city.name });
      if (city.stats.alumCount !== count) {
        city.stats.alumCount = count;
        await city.save();
      }
    }
    
    return { message: 'Alumni counts updated', citiesUpdated: cities.length };
  }
}

module.exports = new CitiesService();
