const Company = require('../models/Company');
const User = require('../models/User');

class CompaniesService {
  async createCompany(companyData) {
    const company = new Company(companyData);
    return await company.save();
  }

  async getCompanyBySlug(slug) {
    const company = await Company.findOne({ slug });
    if (!company) return null;
    
    // Get additional stats
    const stats = await this.getCompanyStats(company._id);
    
    return {
      ...company.toObject(),
      ...stats
    };
  }

  async getCompanyStats(companyId) {
    const [
      alumniCount,
      cityDistribution,
      departmentDistribution,
      recentJoinees
    ] = await Promise.all([
      User.countDocuments({ 'placement.company': companyId }),
      this.getAlumniCityDistribution(companyId),
      this.getAlumniDepartmentDistribution(companyId),
      this.getRecentJoinees(companyId)
    ]);
    
    return {
      alumniCount,
      cityDistribution,
      departmentDistribution,
      recentJoinees
    };
  }

  async getAlumniCityDistribution(companyId) {
    return await User.aggregate([
      { $match: { 'placement.company': companyId } },
      {
        $group: {
          _id: '$currentCity.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
  }

  async getAlumniDepartmentDistribution(companyId) {
    return await User.aggregate([
      { $match: { 'placement.company': companyId } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  async getRecentJoinees(companyId, limit = 10) {
    return await User.find({ 'placement.company': companyId })
      .sort({ 'placement.startDate': -1 })
      .limit(limit)
      .select('name avatar placement.startDate placement.role')
      .populate('placement.company', 'name slug logo');
  }

  async getCompanyMembers(companyId, options = {}) {
    const { page = 1, limit = 20, city, department, role } = options;
    
    const query = { 'placement.company': companyId };
    if (city) query['currentCity.name'] = { $regex: city, $options: 'i' };
    if (department) query.department = { $regex: department, $options: 'i' };
    if (role) query['placement.role'] = { $regex: role, $options: 'i' };
    
    const members = await User.find(query)
      .populate('placement.company', 'name slug logo')
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'placement.startDate': -1 });
    
    const total = await User.countDocuments(query);
    
    return {
      members,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async searchCompanies(searchParams) {
    const { query, page = 1, limit = 20 } = searchParams;
    
    const searchQuery = query ? 
      { name: { $regex: query, $options: 'i' } } : {};
    
    const companies = await Company.find(searchQuery)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });
    
    const total = await Company.countDocuments(searchQuery);
    
    return {
      companies,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateCompany(companyId, updateData) {
    return await Company.findByIdAndUpdate(companyId, updateData, { new: true });
  }

  async deleteCompany(companyId) {
    // Also update users who have this company in their placement
    await User.updateMany(
      { 'placement.company': companyId },
      { $unset: { 'placement.company': 1 } }
    );
    
    return await Company.findByIdAndDelete(companyId);
  }

  async getPopularCompanies(limit = 10) {
    return await User.aggregate([
      { $match: { 'placement.company': { $exists: true } } },
      {
        $group: {
          _id: '$placement.company',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'company'
        }
      },
      { $unwind: '$company' },
      {
        $project: {
          _id: '$company._id',
          name: '$company.name',
          slug: '$company.slug',
          logo: '$company.logo',
          alumniCount: '$count'
        }
      }
    ]);
  }
}

module.exports = new CompaniesService();
