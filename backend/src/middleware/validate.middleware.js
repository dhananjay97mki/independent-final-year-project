const { body, param, query, validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

// Generic validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return sendError(res, 'Validation failed', 400, { errors: errorMessages });
  }
  
  next();
};

// Auth validation rules
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('role')
    .isIn(['student', 'alumni'])
    .withMessage('Role must be either student or alumni'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Department must be between 2 and 100 characters'),
  
  body('batch')
    .optional()
    .trim()
    .isLength({ min: 4, max: 10 })
    .withMessage('Batch must be between 4 and 10 characters'),
  
  body('passoutYear')
    .optional()
    .isInt({ min: 1950, max: new Date().getFullYear() + 10 })
    .withMessage('Please provide a valid passout year'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// User validation rules
const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('currentCity.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City name must be between 2 and 100 characters'),
  
  body('currentCity.country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country name must be between 2 and 100 characters'),
  
  body('currentCity.loc.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array of [longitude, latitude]'),
  
  body('currentCity.loc.coordinates.*')
    .optional()
    .isNumeric()
    .withMessage('Coordinates must be numeric values'),
  
  body('placement.role')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Job role must be between 2 and 100 characters'),
  
  body('placement.officeCity')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Office city must be between 2 and 100 characters'),
  
  body('placement.startDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  
  handleValidationErrors
];

// Post validation rules
const validateCreatePost = [
  body('body')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Post content must be between 1 and 2000 characters'),
  
  body('company')
    .optional()
    .isMongoId()
    .withMessage('Please provide a valid company ID'),
  
  body('city')
    .optional()
    .isMongoId()
    .withMessage('Please provide a valid city ID'),
  
  handleValidationErrors
];

// Message validation rules
const validateSendMessage = [
  body('text')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message text must be between 1 and 1000 characters'),
  
  param('id')
    .isMongoId()
    .withMessage('Please provide a valid conversation ID'),
  
  // At least one of text or attachment should be present
  body().custom((value, { req }) => {
    if (!req.body.text && !req.file) {
      throw new Error('Either text or attachment is required');
    }
    return true;
  }),
  
  handleValidationErrors
];

// Company validation rules
const validateCreateCompany = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  
  body('slug')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug must be lowercase letters, numbers, and hyphens only'),
  
  body('domains')
    .optional()
    .isArray()
    .withMessage('Domains must be an array'),
  
  body('domains.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Each domain must be between 2 and 100 characters'),
  
  body('cities')
    .optional()
    .isArray()
    .withMessage('Cities must be an array'),
  
  body('cities.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Each city must be between 2 and 100 characters'),
  
  handleValidationErrors
];

// City validation rules
const validateCreateCity = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City name must be between 2 and 100 characters'),
  
  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country name must be between 2 and 100 characters'),
  
  body('centroid.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Centroid coordinates must be an array of [longitude, latitude]'),
  
  body('centroid.coordinates.*')
    .isNumeric()
    .withMessage('Coordinates must be numeric values'),
  
  body('stats.livingCostIndex')
    .optional()
    .isNumeric({ min: 0 })
    .withMessage('Living cost index must be a positive number'),
  
  body('stats.rentMedian')
    .optional()
    .isNumeric({ min: 0 })
    .withMessage('Rent median must be a positive number'),
  
  handleValidationErrors
];

// Search validation rules
const validateSearch = [
  query('query')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('type')
    .optional()
    .isIn(['users', 'companies', 'cities', 'posts'])
    .withMessage('Type must be one of: users, companies, cities, posts'),
  
  handleValidationErrors
];

// Map validation rules
const validateMapQuery = [
  query('bounds')
    .optional()
    .matches(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/)
    .withMessage('Bounds must be in format: south,west,north,east'),
  
  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  query('radius')
    .optional()
    .isInt({ min: 1000, max: 500000 })
    .withMessage('Radius must be between 1000 and 500000 meters'),
  
  query('zoom')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Zoom must be between 1 and 20'),
  
  handleValidationErrors
];

const validateLocationShare = [
  body('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('cityName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City name must be between 2 and 100 characters'),
  
  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country name must be between 2 and 100 characters'),
  
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Please provide a valid ${paramName}`),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// File upload validation
const validateFileUpload = (fieldName, options = {}) => {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'] } = options;
  
  return (req, res, next) => {
    const file = req.file || req.files?.[fieldName];
    
    if (!file && options.required) {
      return sendError(res, `${fieldName} is required`, 400);
    }
    
    if (file) {
      if (file.size > maxSize) {
        return sendError(res, `File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB`, 400);
      }
      
      if (!allowedTypes.includes(file.mimetype)) {
        return sendError(res, `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`, 400);
      }
    }
    
    next();
  };
};

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateCreatePost,
  validateSendMessage,
  validateCreateCompany,
  validateCreateCity,
  validateSearch,
  validateMapQuery,
  validateLocationShare,
  validateObjectId,
  validatePagination,
  validateFileUpload
};
