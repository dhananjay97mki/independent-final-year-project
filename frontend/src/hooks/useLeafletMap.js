import { useRef, useEffect, useState } from 'react';
import L from 'leaflet';

export const useLeafletMap = (containerId, options = {}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (!containerId) return;

    const defaultOptions = {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
      attributionControl: true,
      ...options
    };

    // Create map
    const mapInstance = L.map(containerId, defaultOptions);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapInstance);

    mapRef.current = mapInstance;
    setMap(mapInstance);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [containerId]);

  const addMarker = (lat, lng, options = {}) => {
    if (!mapRef.current) return null;
    
    const marker = L.marker([lat, lng], options).addTo(mapRef.current);
    return marker;
  };

  const addHeatLayer = (points, options = {}) => {
    if (!mapRef.current || !window.L.heatLayer) return null;
    
    const heatLayer = window.L.heatLayer(points, options).addTo(mapRef.current);
    return heatLayer;
  };

  const fitBounds = (bounds) => {
    if (!mapRef.current) return;
    mapRef.current.fitBounds(bounds);
  };

  const setView = (center, zoom) => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, zoom);
  };

  return {
    map,
    addMarker,
    addHeatLayer,
    fitBounds,
    setView
  };
};

export default useLeafletMap;
