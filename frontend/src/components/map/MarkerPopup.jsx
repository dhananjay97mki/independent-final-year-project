import React from 'react';

const MarkerPopup = ({ user }) => {
  const handleMessage = () => {
    // Navigate to chat with user
    console.log('Message user:', user._id);
  };

  const handleConnect = () => {
    // Send connection request
    console.log('Connect with user:', user._id);
  };

  return (
    <div className="marker-popup">
      <div className="popup-header">
        <img 
          src={user.avatar || '/default-avatar.png'} 
          alt={user.name}
          className="popup-avatar"
        />
        <div className="popup-info">
          <h4>{user.name}</h4>
          <span className="popup-role">{user.role}</span>
          {user.isOnline && <span className="online-indicator">🟢 Online</span>}
        </div>
      </div>

      <div className="popup-content">
        {user.placement?.company && (
          <div className="popup-company">
            <img 
              src={user.placement.company.logo} 
              alt={user.placement.company.name}
              className="company-logo-small"
            />
            <span>{user.placement.company.name}</span>
          </div>
        )}

        <div className="popup-details">
          <span>📍 {user.currentCity?.name}</span>
          {user.placement?.role && <span>💼 {user.placement.role}</span>}
          <span>🎓 {user.department}</span>
        </div>
      </div>

      <div className="popup-actions">
        <button className="popup-btn message-btn" onClick={handleMessage}>
          💬 Message
        </button>
        <button className="popup-btn connect-btn" onClick={handleConnect}>
          🤝 Connect
        </button>
      </div>
    </div>
  );
};

export default MarkerPopup;
