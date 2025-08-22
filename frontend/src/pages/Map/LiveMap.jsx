import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import LeafletMap from '../../components/map/LeafletMap';
import HeatLayer from '../../components/map/HeatLayer';
import ClusterLayer from '../../components/map/ClusterLayer';
import MapFilters from '../../components/map/MapFilters';
import { fetchHeatData, fetchClusters, setMapBounds } from '../../store/map.slice';
import '../../styles/map.css';

const LiveMap = () => {
  const dispatch = useDispatch();
  const { heatData, clusters, loading, filters } = useSelector(state => state.map);
  const [mapRef, setMapRef] = useState(null);
  const [showHeat, setShowHeat] = useState(true);
  const [showClusters, setShowClusters] = useState(false);

  // Update data when map bounds change
  const handleBoundsChange = (bounds) => {
    const boundsStr = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
    dispatch(setMapBounds(boundsStr));
    
    if (showHeat) {
      dispatch(fetchHeatData({ bounds: boundsStr, ...filters }));
    }
    
    if (showClusters) {
      const zoom = mapRef?.getZoom() || 5;
      dispatch(fetchClusters({ bounds: boundsStr, zoom, ...filters }));
    }
  };

  // Toggle between heat and cluster view
  const toggleView = (viewType) => {
    if (viewType === 'heat') {
      setShowHeat(true);
      setShowClusters(false);
      if (mapRef) {
        const bounds = mapRef.getBounds();
        handleBoundsChange(bounds);
      }
    } else {
      setShowHeat(false);
      setShowClusters(true);
      if (mapRef) {
        const bounds = mapRef.getBounds();
        handleBoundsChange(bounds);
      }
    }
  };

  return (
    <div className="live-map-container">
      <div className="map-header">
        <h1>Alumni Live Map</h1>
        <div className="view-toggles">
          <button 
            className={`toggle-btn ${showHeat ? 'active' : ''}`}
            onClick={() => toggleView('heat')}
          >
            Heat View
          </button>
          <button 
            className={`toggle-btn ${showClusters ? 'active' : ''}`}
            onClick={() => toggleView('clusters')}
          >
            Cluster View
          </button>
        </div>
      </div>

      <div className="map-content">
        <MapFilters />
        
        <div className="map-wrapper">
          <LeafletMap
            center={[20.5937, 78.9629]} // India center
            zoom={5}
            onMapReady={setMapRef}
            onBoundsChange={handleBoundsChange}
          >
            {showHeat && heatData.length > 0 && (
              <HeatLayer points={heatData} />
            )}
            
            {showClusters && clusters.length > 0 && (
              <ClusterLayer clusters={clusters} />
            )}
          </LeafletMap>

          {loading && (
            <div className="map-loading">
              <div className="spinner"></div>
              <span>Loading alumni data...</span>
            </div>
          )}
        </div>
      </div>

      <div className="map-legend">
        <h4>Alumni Density</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="color-box" style={{backgroundColor: '#0000ff'}}></span>
            <span>Low (1-5)</span>
          </div>
          <div className="legend-item">
            <span className="color-box" style={{backgroundColor: '#00ff00'}}></span>
            <span>Medium (6-15)</span>
          </div>
          <div className="legend-item">
            <span className="color-box" style={{backgroundColor: '#ffa500'}}></span>
            <span>High (16-30)</span>
          </div>
          <div className="legend-item">
            <span className="color-box" style={{backgroundColor: '#ff0000'}}></span>
            <span>Very High (31+)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
