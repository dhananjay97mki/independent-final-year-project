const Company = require('../models/Company');
const User = require('../models/User');
const { sendResponse, sendError } = require('../utils/response');

exports.getCompanies = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};
    
    const companies = await Company.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Company.countDocuments(query);
    
    sendResponse(res, { companies, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.getCompanyBySlug = async (req, res, next) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug });
    
    if (!company) {
      return sendError(res, 'Company not found', 404);
    }
    
    // Get alumni count
    const alumniCount = await User.countDocuments({ 'placement.company': company._id });
    
    sendResponse(res, { ...company.toObject(), alumniCount });
  } catch (error) {
    next(error);
  }
};

exports.getCompanyMembers = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const company = await Company.findOne({ slug });
    if (!company) {
      return sendError(res, 'Company not found', 404);
    }
    
    const members = await User.find({ 'placement.company': company._id })
      .populate('placement.company', 'name slug logo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password');
    
    const total = await User.countDocuments({ 'placement.company': company._id });
    
    sendResponse(res, { members, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.createCompany = async (req, res, next) => {
  try {
    const { name, slug, logo, domains, cities } = req.body;
    
    const company = new Company({ name, slug, logo, domains, cities });
    await company.save();
    
    sendResponse(res, company, 201);
  } catch (error) {
    next(error);
  }
};

exports.updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (!company) {
      return sendError(res, 'Company not found', 404);
    }
    
    sendResponse(res, company);
  } catch (error) {
    next(error);
  }
};

exports.deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    
    if (!company) {
      return sendError(res, 'Company not found', 404);
    }
    
    sendResponse(res, { message: 'Company deleted successfully' });
  } catch (error) {
    next(error);
  }
};
