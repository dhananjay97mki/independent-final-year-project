const City = require('../models/City');
const Post = require('../models/Post');

class CityIntelService {
  async getCityIntel(cityId) {
    const city = await City.findById(cityId);
    if (!city) throw new Error('City not found');
    
    const [tips, faqs, recentDiscussions] = await Promise.all([
      this.getCityTips(cityId),
      this.getCityFAQs(cityId),
      this.getRecentDiscussions(cityId)
    ]);
    
    return {
      city,
      tips,
      faqs,
      recentDiscussions
    };
  }

  async getCityTips(cityId, options = {}) {
    const { page = 1, limit = 10, category } = options;
    
    const query = { city: cityId };
    if (category) {
      query.body = { $regex: category, $options: 'i' };
    }
    
    const tips = await Post.find(query)
      .populate('author', 'name avatar role')
      .populate('city', 'name')
      .sort({ likes: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Post.countDocuments(query);
    
    return {
      tips,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getCityFAQs(cityId) {
    // Get most liked posts as FAQs
    return await Post.find({ city: cityId })
      .populate('author', 'name avatar role')
      .sort({ 'likes.length': -1 })
      .limit(5);
  }

  async getRecentDiscussions(cityId, limit = 5) {
    return await Post.find({ city: cityId })
      .populate('author', 'name avatar role')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async addCityTip(cityId, authorId, tipData) {
    const { body, attachments, category } = tipData;
    
    const post = new Post({
      author: authorId,
      body,
      city: cityId,
      attachments,
      category
    });
    
    await post.save();
    await post.populate('author', 'name avatar role');
    await post.populate('city', 'name');
    
    return post;
  }

  async updateCityIntel(cityId, intelData) {
    const { livingCostIndex, rentMedian, commuteTips, safetyNote } = intelData;
    
    return await City.findByIdAndUpdate(
      cityId,
      {
        $set: {
          'stats.livingCostIndex': livingCostIndex,
          'stats.rentMedian': rentMedian,
          'stats.commuteTips': commuteTips,
          'stats.safetyNote': safetyNote
        }
      },
      { new: true }
    );
  }

  async getCostOfLivingComparison(cityIds) {
    const cities = await City.find({ _id: { $in: cityIds } })
      .select('name stats.livingCostIndex stats.rentMedian');
    
    return cities.map(city => ({
      name: city.name,
      livingCostIndex: city.stats.livingCostIndex || 0,
      rentMedian: city.stats.rentMedian || 0
    }));
  }

  async getCityRecommendations(userId, cityId) {
    // Get recommendations from users who moved to this city
    const recommendations = await Post.aggregate([
      {
        $match: {
          city: cityId,
          body: { $regex: /(recommend|suggest|advice|tip)/i }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: '$author' },
      {
        $project: {
          body: 1,
          createdAt: 1,
          likes: { $size: '$likes' },
          'author.name': 1,
          'author.avatar': 1,
          'author.role': 1
        }
      },
      { $sort: { likes: -1, createdAt: -1 } },
      { $limit: 10 }
    ]);
    
    return recommendations;
  }

  async getMovingChecklist(cityId) {
    // Generate a moving checklist based on city-specific requirements
    const city = await City.findById(cityId);
    if (!city) throw new Error('City not found');
    
    const baseChecklist = [
      'Find accommodation',
      'Set up bank account',
      'Get local SIM card',
      'Register with local authorities',
      'Find grocery stores nearby',
      'Explore public transportation',
      'Connect with local alumni'
    ];
    
    // Add city-specific items based on city stats
    const citySpecificItems = [];
    
    if (city.stats.commuteTips) {
      citySpecificItems.push('Review commute options');
    }
    
    if (city.stats.safetyNote) {
      citySpecificItems.push('Review safety guidelines');
    }
    
    return {
      city: city.name,
      checklist: [...baseChecklist, ...citySpecificItems]
    };
  }

  async getCityExpenseBreakdown(cityId) {
    const city = await City.findById(cityId);
    if (!city) throw new Error('City not found');
    
    // Calculate expense breakdown based on living cost index
    const baseCost = city.stats.livingCostIndex || 100;
    const rentMedian = city.stats.rentMedian || 0;
    
    return {
      city: city.name,
      expenses: {
        rent: rentMedian,
        food: Math.round((baseCost * 0.3)),
        transportation: Math.round((baseCost * 0.15)),
        utilities: Math.round((baseCost * 0.1)),
        entertainment: Math.round((baseCost * 0.1)),
        miscellaneous: Math.round((baseCost * 0.1))
      },
      totalEstimated: rentMedian + Math.round((baseCost * 0.75))
    };
  }
}

module.exports = new CityIntelService();
