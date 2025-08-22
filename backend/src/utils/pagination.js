// Pagination utilities for API responses

// Calculate pagination info
const getPaginationInfo = (page, limit, totalCount) => {
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 20;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const skip = (currentPage - 1) * itemsPerPage;
  
  return {
    currentPage,
    itemsPerPage,
    totalPages,
    totalCount,
    skip,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null
  };
};

// Create pagination response format
const createPaginationResponse = (data, page, limit, totalCount, additionalInfo = {}) => {
  const paginationInfo = getPaginationInfo(page, limit, totalCount);
  
  return {
    data,
    pagination: {
      currentPage: paginationInfo.currentPage,
      totalPages: paginationInfo.totalPages,
      totalCount: paginationInfo.totalCount,
      itemsPerPage: paginationInfo.itemsPerPage,
      hasNextPage: paginationInfo.hasNextPage,
      hasPrevPage: paginationInfo.hasPrevPage,
      nextPage: paginationInfo.nextPage,
      prevPage: paginationInfo.prevPage
    },
    ...additionalInfo
  };
};

// Generate page links for API navigation
const generatePageLinks = (baseUrl, page, limit, totalCount) => {
  const paginationInfo = getPaginationInfo(page, limit, totalCount);
  const links = {};
  
  // Self link
  links.self = `${baseUrl}?page=${paginationInfo.currentPage}&limit=${paginationInfo.itemsPerPage}`;
  
  // First page link
  links.first = `${baseUrl}?page=1&limit=${paginationInfo.itemsPerPage}`;
  
  // Last page link
  links.last = `${baseUrl}?page=${paginationInfo.totalPages}&limit=${paginationInfo.itemsPerPage}`;
  
  // Previous page link
  if (paginationInfo.hasPrevPage) {
    links.prev = `${baseUrl}?page=${paginationInfo.prevPage}&limit=${paginationInfo.itemsPerPage}`;
  }
  
  // Next page link
  if (paginationInfo.hasNextPage) {
    links.next = `${baseUrl}?page=${paginationInfo.nextPage}&limit=${paginationInfo.itemsPerPage}`;
  }
  
  return links;
};

// Validate pagination parameters
const validatePaginationParams = (page, limit) => {
  const errors = [];
  
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  
  if (page && (isNaN(parsedPage) || parsedPage < 1)) {
    errors.push('Page must be a positive integer');
  }
  
  if (limit && (isNaN(parsedLimit) || parsedLimit < 1)) {
    errors.push('Limit must be a positive integer');
  }
  
  if (parsedLimit > 100) {
    errors.push('Limit cannot exceed 100 items per page');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    page: Math.max(1, parsedPage || 1),
    limit: Math.min(100, Math.max(1, parsedLimit || 20))
  };
};

// Create MongoDB skip and limit for pagination
const getMongoosePagination = (page, limit) => {
  const validation = validatePaginationParams(page, limit);
  return {
    skip: (validation.page - 1) * validation.limit,
    limit: validation.limit,
    page: validation.page
  };
};

// Aggregate pagination for MongoDB aggregation pipelines
const getAggregationPagination = (page, limit) => {
  const { skip, limit: limitValue } = getMongoosePagination(page, limit);
  
  return [
    { $skip: skip },
    { $limit: limitValue }
  ];
};

// Create cursor-based pagination info
const getCursorPaginationInfo = (data, limit, sortField = '_id') => {
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, -1) : data;
  
  const result = {
    items,
    hasMore,
    cursor: items.length > 0 ? items[items.length - 1][sortField] : null
  };
  
  return result;
};

// Parse cursor pagination parameters
const parseCursorParams = (cursor, limit = 20, sortField = '_id', sortOrder = 1) => {
  const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
  
  const query = {};
  if (cursor) {
    query[sortField] = sortOrder === 1 ? { $gt: cursor } : { $lt: cursor };
  }
  
  return {
    query,
    limit: parsedLimit + 1, // Get one extra item to check if there are more
    sort: { [sortField]: sortOrder }
  };
};

// Helper to get page numbers for pagination UI
const getPageNumbers = (currentPage, totalPages, maxVisible = 5) => {
  const pages = [];
  const half = Math.floor(maxVisible / 2);
  
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  // Adjust start if we're near the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push({
      number: i,
      isCurrent: i === currentPage,
      isDisabled: false
    });
  }
  
  // Add ellipsis and first/last pages if needed
  if (start > 1) {
    if (start > 2) {
      pages.unshift({ number: '...', isDisabled: true });
    }
    pages.unshift({ number: 1, isCurrent: false, isDisabled: false });
  }
  
  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push({ number: '...', isDisabled: true });
    }
    pages.push({ number: totalPages, isCurrent: false, isDisabled: false });
  }
  
  return pages;
};

// Create search pagination with filters
const createSearchPagination = (results, page, limit, totalCount, searchQuery, filters = {}) => {
  const paginationResponse = createPaginationResponse(results, page, limit, totalCount);
  
  return {
    ...paginationResponse,
    search: {
      query: searchQuery,
      filters,
      resultsFound: totalCount > 0
    }
  };
};

module.exports = {
  getPaginationInfo,
  createPaginationResponse,
  generatePageLinks,
  validatePaginationParams,
  getMongoosePagination,
  getAggregationPagination,
  getCursorPaginationInfo,
  parseCursorParams,
  getPageNumbers,
  createSearchPagination
};
