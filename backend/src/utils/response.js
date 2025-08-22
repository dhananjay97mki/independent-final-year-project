// Standardized API response utilities

// Success response format
const sendResponse = (res, data, statusCode = 200, message = 'Success') => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  
  return res.status(statusCode).json(response);
};

// Error response format
const sendError = (res, message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  // Log error for debugging (except for client errors)
  if (statusCode >= 500) {
    console.error(`Server Error ${statusCode}:`, message, errors);
  }
  
  return res.status(statusCode).json(response);
};

// Validation error response
const sendValidationError = (res, errors) => {
  return sendError(res, 'Validation failed', 400, errors);
};

// Not found response
const sendNotFound = (res, resource = 'Resource') => {
  return sendError(res, `${resource} not found`, 404);
};

// Unauthorized response
const sendUnauthorized = (res, message = 'Unauthorized access') => {
  return sendError(res, message, 401);
};

// Forbidden response
const sendForbidden = (res, message = 'Forbidden access') => {
  return sendError(res, message, 403);
};

// Conflict response
const sendConflict = (res, message = 'Resource already exists') => {
  return sendError(res, message, 409);
};

// Too many requests response
const sendTooManyRequests = (res, message = 'Too many requests') => {
  return sendError(res, message, 429);
};

// Server error response
const sendServerError = (res, message = 'Internal server error') => {
  return sendError(res, message, 500);
};

// Paginated response
const sendPaginatedResponse = (res, data, pagination, message = 'Success') => {
  const response = {
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString()
  };
  
  return res.status(200).json(response);
};

// Search response with results and filters
const sendSearchResponse = (res, results, totalCount, searchQuery, filters = {}, pagination = null) => {
  const response = {
    success: true,
    message: 'Search completed',
    data: {
      results,
      totalCount,
      query: searchQuery,
      filters: filters
    },
    timestamp: new Date().toISOString()
  };
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  return res.status(200).json(response);
};

// File upload response
const sendFileUploadResponse = (res, fileInfo, message = 'File uploaded successfully') => {
  return sendResponse(res, fileInfo, 201, message);
};

// Bulk operation response
const sendBulkOperationResponse = (res, results, message = 'Bulk operation completed') => {
  const response = {
    success: true,
    message,
    data: {
      processed: results.length,
      results
    },
    timestamp: new Date().toISOString()
  };
  
  return res.status(200).json(response);
};

// API health check response
const sendHealthCheck = (res, services = {}) => {
  const allServicesHealthy = Object.values(services).every(status => status === 'healthy');
  const statusCode = allServicesHealthy ? 200 : 503;
  
  const response = {
    success: allServicesHealthy,
    message: allServicesHealthy ? 'All systems operational' : 'Some services unavailable',
    data: {
      status: allServicesHealthy ? 'healthy' : 'degraded',
      services,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  };
  
  return res.status(statusCode).json(response);
};

// Generic async handler wrapper to catch errors
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Express error handler middleware
const errorHandler = (err, req, res, next) => {
  let message = err.message || 'Internal server error';
  let statusCode = err.statusCode || 500;
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
    return sendValidationError(res, errors);
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
    statusCode = 409;
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    message = 'Invalid ID format';
    statusCode = 400;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
  }
  
  if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
    statusCode = 401;
  }
  
  // Log error for debugging
  if (statusCode >= 500) {
    console.error('Error:', err);
  }
  
  return sendError(res, message, statusCode);
};

// Rate limiting response
const sendRateLimitResponse = (res, retryAfter = 60) => {
  res.set('Retry-After', retryAfter);
  return sendTooManyRequests(res, 'Rate limit exceeded. Please try again later.');
};

// API deprecation warning
const sendDeprecationWarning = (res, message, newEndpoint = null) => {
  res.set('X-API-Deprecation-Warning', message);
  if (newEndpoint) {
    res.set('X-API-New-Endpoint', newEndpoint);
  }
};

// Custom response with additional headers
const sendResponseWithHeaders = (res, data, statusCode = 200, message = 'Success', headers = {}) => {
  // Set custom headers
  Object.entries(headers).forEach(([key, value]) => {
    res.set(key, value);
  });
  
  return sendResponse(res, data, statusCode, message);
};

module.exports = {
  sendResponse,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendConflict,
  sendTooManyRequests,
  sendServerError,
  sendPaginatedResponse,
  sendSearchResponse,
  sendFileUploadResponse,
  sendBulkOperationResponse,
  sendHealthCheck,
  sendRateLimitResponse,
  sendDeprecationWarning,
  sendResponseWithHeaders,
  asyncHandler,
  errorHandler
};
