import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const LeafletMap = ({ 
  center = [20.5937, 78.9629], 
  zoom = 5, 
  children, 
  onMapReady,
  onBoundsChange 
}) => {
  const mapRef = useRef();

  useEffect(() => {
    if (mapRef.current && onMapReady) {
      const map = mapRef.current;
      onMapReady(map);

      // Set up bounds change handler
      if (onBoundsChange) {
        const handleMoveEnd = () => {
          onBoundsChange(map.getBounds());
        };

        map.on('moveend', handleMoveEnd);
        
        // Initial bounds
        setTimeout(() => handleMoveEnd(), 100);

        return () => {
          map.off('moveend', handleMoveEnd);
        };
      }
    }
  }, [onMapReady, onBoundsChange]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      {children}
    </MapContainer>
  );
};

export default LeafletMap;
