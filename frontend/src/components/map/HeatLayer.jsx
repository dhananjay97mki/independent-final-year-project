import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

const HeatLayer = ({ points, options = {} }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    const defaultOptions = {
      radius: 25,
      maxZoom: 12,
      max: 1.0,
      ...options
    };

    // Convert points to leaflet heat format
    const heatPoints = points.map(point => [
      point.lat,
      point.lng,
      point.intensity || 1
    ]);

    // Create heat layer
    const heatLayer = L.heatLayer(heatPoints, defaultOptions);
    heatLayer.addTo(map);

    // Cleanup function
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, options]);

  return null;
};

export default HeatLayer;
