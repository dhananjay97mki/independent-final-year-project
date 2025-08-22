import { http } from './http';

const citiesAPI = {
  // Get all cities
  getCities: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return http(`/cities?${queryParams}`);
  },

  // Get city by ID
  getCityById: (cityId) => {
    return http(`/cities/${cityId}`);
  },

  // Get city intel
  getCityIntel: (cityId) => {
    return http(`/city-intel/${cityId}`);
  },

  // Get city tips
  getCityTips: (cityId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return http(`/city-intel/${cityId}/tips?${queryParams}`);
  },

  // Add city tip
  addCityTip: (cityId, tipData) => {
    return http(`/city-intel/${cityId}/tips`, {
      method: 'POST',
      body: JSON.stringify(tipData)
    });
  },

  // Get city members
  getCityMembers: (cityId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return http(`/cities/${cityId}/members?${queryParams}`);
  },

  // Get near cities
  getNearCities: (lng, lat, radius = 100000) => {
    return http(`/cities/near?lng=${lng}&lat=${lat}&radius=${radius}`);
  },

  // Update city intel (admin)
  updateCityIntel: (cityId, intelData) => {
    return http(`/city-intel/${cityId}`, {
      method: 'PATCH',
      body: JSON.stringify(intelData)
    });
  }
};

export default citiesAPI;
