const Post = require('../models/Post');
const Message = require('../models/Message');

class PostsService {
  async createPost(authorId, postData) {
    const { body, company, city, attachments } = postData;
    
    const post = new Post({
      author: authorId,
      body,
      company,
      city,
      attachments
    });
    
    await post.save();
    await post.populate('author', 'name avatar role');
    await post.populate('company', 'name slug logo');
    await post.populate('city', 'name');
    
    return post;
  }

  async getFeed(userId, options = {}) {
    const { page = 1, limit = 10, company, city } = options;
    
    // Get user's followed companies and current city for personalized feed
    const User = require('../models/User');
    const user = await User.findById(userId).select('companiesFollowed currentCity');
    
    const query = {};
    
    if (company) {
      query.company = company;
    } else if (city) {
      query.city = city;
    } else {
      // Personalized feed: posts from followed companies and current city
      query.$or = [
        { company: { $in: user.companiesFollowed || [] } },
        { city: user.currentCity?.name ? { $regex: user.currentCity.name, $options: 'i' } : null }
      ].filter(condition => condition.city !== null);
    }
    
    const posts = await Post.find(query)
      .populate('author', 'name avatar role')
      .populate('company', 'name slug logo')
      .populate('city', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Post.countDocuments(query);
    
    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getPostById(postId) {
    const post = await Post.findById(postId)
      .populate('author', 'name avatar role')
      .populate('company', 'name slug logo')
      .populate('city', 'name');
    
    if (!post) throw new Error('Post not found');
    
    return post;
  }

  async updatePost(postId, authorId, updateData) {
    const post = await Post.findOneAndUpdate(
      { _id: postId, author: authorId },
      updateData,
      { new: true }
    ).populate('author', 'name avatar role');
    
    if (!post) throw new Error('Post not found or unauthorized');
    
    return post;
  }

  async deletePost(postId, authorId) {
    const post = await Post.findOneAndDelete({ _id: postId, author: authorId });
    
    if (!post) throw new Error('Post not found or unauthorized');
    
    // Delete associated comments
    await Message.deleteMany({ _id: { $in: post.comments } });
    
    return post;
  }

  async likePost(postId, userId) {
    const post = await Post.findByIdAndUpdate(
      postId,
      { $addToSet: { likes: userId } },
      { new: true }
    );
    
    return { likesCount: post.likes.length, isLiked: true };
  }

  async unlikePost(postId, userId) {
    const post = await Post.findByIdAndUpdate(
      postId,
      { $pull: { likes: userId } },
      { new: true }
    );
    
    return { likesCount: post.likes.length, isLiked: false };
  }

  async addComment(postId, userId, commentData) {
    const { text } = commentData;
    
    const comment = new Message({
      sender: userId,
      text,
      sentAt: new Date()
    });
    
    await comment.save();
    
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment._id }
    });
    
    await comment.populate('sender', 'name avatar');
    
    return comment;
  }

  async getComments(postId, options = {}) {
    const { page = 1, limit = 10 } = options;
    
    const post = await Post.findById(postId)
      .populate({
        path: 'comments',
        populate: { path: 'sender', select: 'name avatar' },
        options: {
          sort: { sentAt: -1 },
          limit: limit * 1,
          skip: (page - 1) * limit
        }
      });
    
    if (!post) throw new Error('Post not found');
    
    const total = post.comments.length;
    
    return {
      comments: post.comments,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getTrendingPosts(options = {}) {
    const { limit = 10, timeframe = 7 } = options;
    
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - timeframe);
    
    return await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: dateThreshold }
        }
      },
      {
        $addFields: {
          likesCount: { $size: '$likes' },
          commentsCount: { $size: '$comments' },
          engagementScore: {
            $add: [
              { $multiply: [{ $size: '$likes' }, 2] },
              { $size: '$comments' }
            ]
          }
        }
      },
      { $sort: { engagementScore: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'company'
        }
      },
      {
        $lookup: {
          from: 'cities',
          localField: 'city',
          foreignField: '_id',
          as: 'city'
        }
      },
      {
        $project: {
          body: 1,
          attachments: 1,
          createdAt: 1,
          likesCount: 1,
          commentsCount: 1,
          engagementScore: 1,
          'author.name': 1,
          'author.avatar': 1,
          'author.role': 1,
          'company.name': 1,
          'company.slug': 1,
          'company.logo': 1,
          'city.name': 1
        }
      }
    ]);
  }

  async getPostsByCompany(companyId, options = {}) {
    const { page = 1, limit = 10 } = options;
    
    const posts = await Post.find({ company: companyId })
      .populate('author', 'name avatar role')
      .populate('company', 'name slug logo')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Post.countDocuments({ company: companyId });
    
    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getPostsByCity(cityId, options = {}) {
    const { page = 1, limit = 10 } = options;
    
    const posts = await Post.find({ city: cityId })
      .populate('author', 'name avatar role')
      .populate('city', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Post.countDocuments({ city: cityId });
    
    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}

module.exports = new PostsService();
