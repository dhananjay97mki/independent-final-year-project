const Post = require('../models/Post');
const Message = require('../models/Message');
const { sendResponse, sendError } = require('../utils/response');

exports.getPosts = async (req, res, next) => {
  try {
    const { company, city, author, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (company) query.company = company;
    if (city) query.city = city;
    if (author) query.author = author;
    
    const posts = await Post.find(query)
      .populate('author', 'name avatar role')
      .populate('company', 'name slug logo')
      .populate('city', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Post.countDocuments(query);
    
    sendResponse(res, { posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const { body, company, city } = req.body;
    const attachments = req.files ? req.files.map(file => file.path) : [];
    
    const post = new Post({
      author: req.user.id,
      body,
      company,
      city,
      attachments
    });
    
    await post.save();
    await post.populate('author', 'name avatar role');
    await post.populate('company', 'name slug logo');
    await post.populate('city', 'name');
    
    sendResponse(res, post, 201);
  } catch (error) {
    next(error);
  }
};

exports.getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar role')
      .populate('company', 'name slug logo')
      .populate('city', 'name');
    
    if (!post) {
      return sendError(res, 'Post not found', 404);
    }
    
    sendResponse(res, post);
  } catch (error) {
    next(error);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, author: req.user.id },
      req.body,
      { new: true }
    ).populate('author', 'name avatar role');
    
    if (!post) {
      return sendError(res, 'Post not found or unauthorized', 404);
    }
    
    sendResponse(res, post);
  } catch (error) {
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, author: req.user.id });
    
    if (!post) {
      return sendError(res, 'Post not found or unauthorized', 404);
    }
    
    sendResponse(res, { message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { likes: req.user.id } },
      { new: true }
    );
    
    sendResponse(res, { likesCount: post.likes.length });
  } catch (error) {
    next(error);
  }
};

exports.unlikePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $pull: { likes: req.user.id } },
      { new: true }
    );
    
    sendResponse(res, { likesCount: post.likes.length });
  } catch (error) {
    next(error);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    
    const message = new Message({
      sender: req.user.id,
      text,
      sentAt: new Date()
    });
    
    await message.save();
    
    await Post.findByIdAndUpdate(req.params.id, {
      $push: { comments: message._id }
    });
    
    await message.populate('sender', 'name avatar');
    
    sendResponse(res, message, 201);
  } catch (error) {
    next(error);
  }
};

exports.getComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const post = await Post.findById(req.params.id)
      .populate({
        path: 'comments',
        populate: { path: 'sender', select: 'name avatar' },
        options: {
          sort: { sentAt: -1 },
          limit: limit * 1,
          skip: (page - 1) * limit
        }
      });
    
    sendResponse(res, { comments: post.comments });
  } catch (error) {
    next(error);
  }
};
