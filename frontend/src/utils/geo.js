// Geographic utility functions for frontend

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// Format coordinates for display
export const formatCoordinates = (lng, lat, precision = 4) => {
  return {
    lng: parseFloat(lng.toFixed(precision)),
    lat: parseFloat(lat.toFixed(precision))
  };
};

// Validate coordinates
export const validateCoordinates = (lng, lat) => {
  return !isNaN(lng) && !isNaN(lat) && 
         lng >= -180 && lng <= 180 && 
         lat >= -90 && lat <= 90;
};

// Get user's current location
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

// Convert bounds object to string
export const boundsToString = (bounds) => {
  if (!bounds || typeof bounds.getSouth !== 'function') return '';
  return `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
};

// Parse bounds string to object
export const stringToBounds = (boundsStr) => {
  if (!boundsStr) return null;
  const [south, west, north, east] = boundsStr.split(',').map(Number);
  return { south, west, north, east };
};

// Check if point is within bounds
export const isPointInBounds = (lat, lng, bounds) => {
  return lat >= bounds.south && lat <= bounds.north &&
         lng >= bounds.west && lng <= bounds.east;
};

// Calculate center point of multiple coordinates
export const getCenterPoint = (coordinates) => {
  if (!coordinates || coordinates.length === 0) return null;

  const sum = coordinates.reduce((acc, coord) => {
    acc.lat += coord.lat;
    acc.lng += coord.lng;
    return acc;
  }, { lat: 0, lng: 0 });

  return {
    lat: sum.lat / coordinates.length,
    lng: sum.lng / coordinates.length
  };
};

// Generate random point within bounds (for testing)
export const randomPointInBounds = (bounds) => {
  const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
  const lng = bounds.west + Math.random() * (bounds.east - bounds.west);
  return { lat, lng };
};

// Format distance for display
export const formatDistance = (distanceInKm) => {
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)}m`;
  } else if (distanceInKm < 100) {
    return `${distanceInKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceInKm)}km`;
  }
};

// Get zoom level for distance
export const getZoomForDistance = (distanceInKm) => {
  if (distanceInKm > 1000) return 4;
  if (distanceInKm > 500) return 5;
  if (distanceInKm > 200) return 6;
  if (distanceInKm > 100) return 7;
  if (distanceInKm > 50) return 8;
  if (distanceInKm > 20) return 9;
  if (distanceInKm > 10) return 10;
  if (distanceInKm > 5) return 11;
  if (distanceInKm > 2) return 12;
  return 13;
};

export default {
  calculateDistance,
  formatCoordinates,
  validateCoordinates,
  getCurrentLocation,
  boundsToString,
  stringToBounds,
  isPointInBounds,
  getCenterPoint,
  randomPointInBounds,
  formatDistance,
  getZoomForDistance
};


