const City = require('../models/City');
const Post = require('../models/Post');
const { sendResponse, sendError } = require('../utils/response');

exports.getCityIntel = async (req, res, next) => {
  try {
    const { cityId } = req.params;
    
    const city = await City.findById(cityId);
    if (!city) {
      return sendError(res, 'City not found', 404);
    }
    
    // Get recent tips/posts about this city
    const tips = await Post.find({ city: cityId })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);
    
    sendResponse(res, { city, tips });
  } catch (error) {
    next(error);
  }
};

exports.updateCityIntel = async (req, res, next) => {
  try {
    const { cityId } = req.params;
    const { stats } = req.body;
    
    const city = await City.findByIdAndUpdate(
      cityId, 
      { $set: { stats } }, 
      { new: true }
    );
    
    if (!city) {
      return sendError(res, 'City not found', 404);
    }
    
    sendResponse(res, city);
  } catch (error) {
    next(error);
  }
};

exports.addCityTip = async (req, res, next) => {
  try {
    const { cityId } = req.params;
    const { body, attachments } = req.body;
    
    const post = new Post({
      author: req.user.id,
      body,
      city: cityId,
      attachments
    });
    
    await post.save();
    await post.populate('author', 'name avatar');
    
    sendResponse(res, post, 201);
  } catch (error) {
    next(error);
  }
};

exports.getCityTips = async (req, res, next) => {
  try {
    const { cityId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const tips = await Post.find({ city: cityId })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Post.countDocuments({ city: cityId });
    
    sendResponse(res, { tips, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.updateCityTip = async (req, res, next) => {
  try {
    const { tipId } = req.params;
    
    const tip = await Post.findOneAndUpdate(
      { _id: tipId, author: req.user.id },
      req.body,
      { new: true }
    ).populate('author', 'name avatar');
    
    if (!tip) {
      return sendError(res, 'Tip not found or unauthorized', 404);
    }
    
    sendResponse(res, tip);
  } catch (error) {
    next(error);
  }
};

exports.deleteCityTip = async (req, res, next) => {
  try {
    const { tipId } = req.params;
    
    const tip = await Post.findOneAndDelete({ _id: tipId, author: req.user.id });
    
    if (!tip) {
      return sendError(res, 'Tip not found or unauthorized', 404);
    }
    
    sendResponse(res, { message: 'Tip deleted successfully' });
  } catch (error) {
    next(error);
  }
};
