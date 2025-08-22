const User = require('../models/User');
const Company = require('../models/Company');
const City = require('../models/City');
const Post = require('../models/Post');

class SearchService {
  async globalSearch(query, options = {}) {
    const { type, limit = 5 } = options;
    
    const results = {};
    
    if (!type || type === 'users') {
      results.users = await this.searchUsers(query, { limit });
    }
    
    if (!type || type === 'companies') {
      results.companies = await this.searchCompanies(query, { limit });
    }
    
    if (!type || type === 'cities') {
      results.cities = await this.searchCities(query, { limit });
    }
    
    if (!type || type === 'posts') {
      results.posts = await this.searchPosts(query, { limit });
    }
    
    return results;
  }

  async searchUsers(query, options = {}) {
    const { limit = 20, page = 1, filters = {} } = options;
    
    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { department: { $regex: query, $options: 'i' } },
        { batch: { $regex: query, $options: 'i' } }
      ]
    };
    
    // Apply filters
    if (filters.city) {
      searchQuery['currentCity.name'] = { $regex: filters.city, $options: 'i' };
    }
    
    if (filters.company) {
      searchQuery['placement.company'] = filters.company;
    }
    
    if (filters.role) {
      searchQuery.role = filters.role;
    }
    
    if (filters.department) {
      searchQuery.department = { $regex: filters.department, $options: 'i' };
    }
    
    if (filters.batch) {
      searchQuery.batch = filters.batch;
    }
    
    const users = await User.find(searchQuery)
      .populate('placement.company', 'name slug logo')
      .select('-password')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(searchQuery);
    
    return {
      results: users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async searchCompanies(query, options = {}) {
    const { limit = 20, page = 1 } = options;
    
    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { domains: { $regex: query, $options: 'i' } }
      ]
    };
    
    const companies = await Company.find(searchQuery)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ name: 1 });
    
    // Add alumni count to each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const alumniCount = await User.countDocuments({ 'placement.company': company._id });
        return {
          ...company.toObject(),
          alumniCount
        };
      })
    );
    
    const total = await Company.countDocuments(searchQuery);
    
    return {
      results: companiesWithStats,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async searchCities(query, options = {}) {
    const { limit = 20, page = 1 } = options;
    
    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { country: { $regex: query, $options: 'i' } }
      ]
    };
    
    const cities = await City.find(searchQuery)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ 'stats.alumCount': -1 });
    
    const total = await City.countDocuments(searchQuery);
    
    return {
      results: cities,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async searchPosts(query, options = {}) {
    const { limit = 20, page = 1, filters = {} } = options;
    
    const searchQuery = {
      body: { $regex: query, $options: 'i' }
    };
    
    if (filters.company) {
      searchQuery.company = filters.company;
    }
    
    if (filters.city) {
      searchQuery.city = filters.city;
    }
    
    if (filters.author) {
      searchQuery.author = filters.author;
    }
    
    const posts = await Post.find(searchQuery)
      .populate('author', 'name avatar role')
      .populate('company', 'name slug logo')
      .populate('city', 'name')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Post.countDocuments(searchQuery);
    
    return {
      results: posts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getSearchSuggestions(query, type = 'all') {
    const suggestions = {};
    
    if (type === 'all' || type === 'users') {
      suggestions.users = await User.find({
        name: { $regex: `^${query}`, $options: 'i' }
      })
      .select('name avatar role')
      .limit(5);
    }
    
    if (type === 'all' || type === 'companies') {
      suggestions.companies = await Company.find({
        name: { $regex: `^${query}`, $options: 'i' }
      })
      .select('name slug logo')
      .limit(5);
    }
    
    if (type === 'all' || type === 'cities') {
      suggestions.cities = await City.find({
        name: { $regex: `^${query}`, $options: 'i' }
      })
      .select('name country')
      .limit(5);
    }
    
    return suggestions;
  }

  async getPopularSearches() {
    // In a real app, you'd track search queries and return popular ones
    // For now, return some static popular searches
    return {
      companies: ['Google', 'Microsoft', 'Amazon', 'Ola', 'Uber', 'Zomato'],
      cities: ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai'],
      departments: ['Computer Science', 'Electronics', 'Mechanical', 'Civil']
    };
  }

  async advancedSearch(searchParams) {
    const {
      query,
      type = 'users',
      filters = {},
      sortBy = 'relevance',
      page = 1,
      limit = 20
    } = searchParams;
    
    let results;
    
    switch (type) {
      case 'users':
        results = await this.searchUsers(query, { limit, page, filters });
        break;
      case 'companies':
        results = await this.searchCompanies(query, { limit, page });
        break;
      case 'cities':
        results = await this.searchCities(query, { limit, page });
        break;
      case 'posts':
        results = await this.searchPosts(query, { limit, page, filters });
        break;
      default:
        results = await this.globalSearch(query, { limit: Math.floor(limit / 4) });
    }
    
    return results;
  }

  async getSearchFilters(type) {
    const filters = {};
    
    if (type === 'users') {
      filters.roles = ['student', 'alumni'];
      filters.departments = await User.distinct('department');
      filters.batches = await User.distinct('batch');
      filters.cities = await User.distinct('currentCity.name');
    }
    
    if (type === 'posts') {
      filters.companies = await Company.find().select('_id name');
      filters.cities = await City.find().select('_id name');
    }
    
    return filters;
  }
}

module.exports = new SearchService();
