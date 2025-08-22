import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCityIntel, fetchCityTips } from '../../store/city.slice';

const CityIntel = () => {
  const { cityId } = useParams();
  const dispatch = useDispatch();
  const { cityData, tips, loading } = useSelector(state => state.city);
  
  useEffect(() => {
    if (cityId) {
      dispatch(fetchCityIntel(cityId));
      dispatch(fetchCityTips(cityId));
    }
  }, [cityId, dispatch]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Loading city information...</div>;
  }

  if (!cityData) {
    return <div className="error">City information not found</div>;
  }

  return (
    <div className="city-intel-container">
      <div className="city-header">
        <h1>{cityData.name}</h1>
        <p className="city-subtitle">{cityData.country}</p>
        <div className="alumni-count">
          <span>{cityData.stats.alumCount} Alumni</span>
        </div>
      </div>

      <div className="intel-grid">
        <div className="intel-card cost-card">
          <h3>💰 Cost of Living</h3>
          <div className="cost-details">
            <div className="cost-item">
              <span>Living Cost Index</span>
              <span className="value">{cityData.stats.livingCostIndex || 'N/A'}</span>
            </div>
            <div className="cost-item">
              <span>Median Rent</span>
              <span className="value">
                {cityData.stats.rentMedian ? formatCurrency(cityData.stats.rentMedian) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="intel-card commute-card">
          <h3>🚗 Transportation</h3>
          <div className="commute-info">
            {cityData.stats.commuteTips ? (
              <p>{cityData.stats.commuteTips}</p>
            ) : (
              <p>No commute information available yet.</p>
            )}
          </div>
        </div>

        <div className="intel-card safety-card">
          <h3>🛡️ Safety & Security</h3>
          <div className="safety-info">
            {cityData.stats.safetyNote ? (
              <p>{cityData.stats.safetyNote}</p>
            ) : (
              <p>No safety information available yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="tips-section">
        <h2>💡 Tips from Alumni</h2>
        {tips.length > 0 ? (
          <div className="tips-list">
            {tips.map((tip) => (
              <div key={tip._id} className="tip-card">
                <div className="tip-header">
                  <div className="author-info">
                    <img 
                      src={tip.author.avatar || '/default-avatar.png'} 
                      alt={tip.author.name}
                      className="author-avatar"
                    />
                    <div>
                      <span className="author-name">{tip.author.name}</span>
                      <span className="author-role">{tip.author.role}</span>
                    </div>
                  </div>
                  <span className="tip-date">
                    {new Date(tip.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="tip-content">
                  <p>{tip.body}</p>
                </div>
                <div className="tip-stats">
                  <span>👍 {tip.likes?.length || 0} likes</span>
                  <span>💬 {tip.comments?.length || 0} comments</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-tips">
            <p>No tips available yet. Be the first to share your experience!</p>
            <button className="add-tip-btn">Add Your Tip</button>
          </div>
        )}
      </div>

      <div className="quick-stats">
        <h3>Quick Stats</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Top Companies</span>
            <div className="stat-list">
              <span>• Google (12 alumni)</span>
              <span>• Microsoft (8 alumni)</span>
              <span>• Amazon (6 alumni)</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-label">Popular Areas</span>
            <div className="stat-list">
              <span>• Koramangala</span>
              <span>• HSR Layout</span>
              <span>• Whitefield</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityIntel;
