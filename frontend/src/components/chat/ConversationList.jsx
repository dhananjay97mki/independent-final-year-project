import React from 'react';

const ConversationList = ({ 
  conversations, 
  activeConversation, 
  onConversationSelect, 
  loading 
}) => {
  const formatLastMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  const getConversationName = (conversation) => {
    if (conversation.type === 'city') {
      return `${conversation.city?.name} City`;
    }
    if (conversation.type === 'company') {
      return `${conversation.company?.name} Company`;
    }
    // For DM, show other participant's name
    return conversation.members
      .filter(member => member._id !== currentUser?.id)
      .map(member => member.name)
      .join(', ') || 'Direct Message';
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.type === 'city') {
      return '/city-icon.png';
    }
    if (conversation.type === 'company') {
      return conversation.company?.logo || '/company-icon.png';
    }
    // For DM, show other participant's avatar
    const otherMember = conversation.members.find(member => member._id !== currentUser?.id);
    return otherMember?.avatar || '/default-avatar.png';
  };

  if (loading) {
    return (
      <div className="conversations-loading">
        <div className="loading-spinner"></div>
        <span>Loading conversations...</span>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      {conversations.length === 0 ? (
        <div className="no-conversations">
          <div className="no-conversations-icon">💬</div>
          <h3>No conversations yet</h3>
          <p>Start a conversation with alumni in your city or company</p>
        </div>
      ) : (
        conversations.map((conversation) => (
          <div
            key={conversation._id}
            className={`conversation-item ${
              activeConversation?._id === conversation._id ? 'active' : ''
            }`}
            onClick={() => onConversationSelect(conversation)}
          >
            <div className="conversation-avatar">
              <img 
                src={getConversationAvatar(conversation)} 
                alt={getConversationName(conversation)}
              />
              {conversation.type === 'dm' && (
                <div className="online-status"></div>
              )}
            </div>

            <div className="conversation-content">
              <div className="conversation-header">
                <h4 className="conversation-name">
                  {getConversationName(conversation)}
                </h4>
                {conversation.lastMessage && (
                  <span className="last-message-time">
                    {formatLastMessageTime(conversation.lastMessage.sentAt)}
                  </span>
                )}
              </div>

              <div className="conversation-preview">
                {conversation.lastMessage ? (
                  <span className="last-message">
                    {conversation.lastMessage.sender?.name}: {' '}
                    {conversation.lastMessage.text || '📎 Attachment'}
                  </span>
                ) : (
                  <span className="no-messages">No messages yet</span>
                )}
                
                {conversation.unreadCount > 0 && (
                  <span className="unread-count">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>

            <div className="conversation-type-indicator">
              {conversation.type === 'city' && '🏙️'}
              {conversation.type === 'company' && '🏢'}
              {conversation.type === 'dm' && '👤'}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ConversationList;
