import { http } from './http';

const companiesAPI = {
  // Get all companies
  getCompanies: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return http(`/companies?${queryParams}`);
  },

  // Get company by slug
  getCompanyBySlug: (slug) => {
    return http(`/companies/${slug}`);
  },

  // Get company members
  getCompanyMembers: (slug, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return http(`/companies/${slug}/members?${queryParams}`);
  },

  // Follow company
  followCompany: (companyId) => {
    return http(`/users/me/follow-company`, {
      method: 'POST',
      body: JSON.stringify({ companyId })
    });
  },

  // Unfollow company
  unfollowCompany: (companyId) => {
    return http(`/users/me/unfollow-company/${companyId}`, {
      method: 'DELETE'
    });
  },

  // Create company (admin)
  createCompany: (companyData) => {
    return http('/companies', {
      method: 'POST',
      body: JSON.stringify(companyData)
    });
  },

  // Update company (admin)
  updateCompany: (companyId, companyData) => {
    return http(`/companies/${companyId}`, {
      method: 'PATCH',
      body: JSON.stringify(companyData)
    });
  },

  // Get popular companies
  getPopularCompanies: () => {
    return http('/companies/popular');
  }
};

export default companiesAPI;
