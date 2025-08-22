import { http } from './http';

const mapAPI = {
  // Get heatmap data
  getHeat: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return http(`/map/heat?${queryParams}`);
  },

  // Get clustered data
  getClusters: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return http(`/map/cluster?${queryParams}`);
  },

  // Get density heatmap
  getDensityHeatmap: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return http(`/map/density-heatmap?${queryParams}`);
  },

  // Share user location
  shareLocation: (locationData) => {
    return http('/map/share-location', {
      method: 'POST',
      body: JSON.stringify(locationData)
    });
  },

  // Stop sharing location
  stopSharingLocation: () => {
    return http('/map/share-location', {
      method: 'DELETE'
    });
  },

  // Get user locations in area
  getUserLocations: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return http(`/map/user-locations?${queryParams}`);
  },

  // Get nearby alumni
  getNearbyAlumni: (lng, lat, radius = 50000) => {
    return http(`/users/nearby?lng=${lng}&lat=${lat}&radius=${radius}`);
  }
};

export default mapAPI;
