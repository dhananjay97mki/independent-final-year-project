import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import MarkerPopup from './MarkerPopup';

// Custom cluster icon
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  let size = 'small';
  
  if (count >= 100) size = 'large';
  else if (count >= 10) size = 'medium';
  
  return L.divIcon({
    html: `<div class="cluster-marker cluster-${size}">
      <span>${count}</span>
    </div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(40, 40, true)
  });
};

// Custom marker icon
const createCustomIcon = (user) => {
  const iconHtml = `
    <div class="custom-marker">
      <img src="${user.avatar || '/default-avatar.png'}" alt="${user.name}" />
      <div class="marker-status ${user.isOnline ? 'online' : 'offline'}"></div>
    </div>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });
};

const ClusterLayer = ({ clusters }) => {
  return (
    <MarkerClusterGroup
      chunkedLoading
      iconCreateFunction={createClusterCustomIcon}
      maxClusterRadius={50}
      spiderfyOnMaxZoom={true}
      showCoverageOnHover={false}
      zoomToBoundsOnClick={true}
    >
      {clusters.map((cluster) => 
        cluster.users.map((user) => (
          <Marker
            key={user._id}
            position={[
              user.currentCity.loc.coordinates[1], // lat
              user.currentCity.loc.coordinates  // lng
            ]}
            icon={createCustomIcon(user)}
          >
            <Popup>
              <MarkerPopup user={user} />
            </Popup>
          </Marker>
        ))
      )}
    </MarkerClusterGroup>
  );
};

export default ClusterLayer;
