import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ConversationList from '../../components/chat/ConversationList';
import ChatWindow from '../../components/chat/ChatWindow';
import { fetchConversations, setActiveConversation } from '../../store/chat.slice';
import { useSocket } from '../../hooks/useSocket';
import '../../styles/chat.css';

const Chat = () => {
  const dispatch = useDispatch();
  const { conversations, activeConversation, loading } = useSelector(state => state.chat);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showConversations, setShowConversations] = useState(true);
  
  const socket = useSocket();

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleConversationSelect = (conversation) => {
    dispatch(setActiveConversation(conversation));
    
    if (isMobile) {
      setShowConversations(false);
    }

    // Join conversation room via socket
    if (socket) {
      socket.emit('join_conversation', conversation._id);
    }
  };

  const handleBackToConversations = () => {
    setShowConversations(true);
    dispatch(setActiveConversation(null));
  };

  return (
    <div className="chat-container">
      <div className="chat-layout">
        {/* Conversations Panel */}
        <div className={`conversations-panel ${isMobile && !showConversations ? 'hidden' : ''}`}>
          <div className="conversations-header">
            <h2>Messages</h2>
            <button className="new-chat-btn">+ New Chat</button>
          </div>
          
          <ConversationList
            conversations={conversations}
            activeConversation={activeConversation}
            onConversationSelect={handleConversationSelect}
            loading={loading}
          />
        </div>

        {/* Chat Window */}
        <div className={`chat-window-panel ${isMobile && showConversations ? 'hidden' : ''}`}>
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              onBack={isMobile ? handleBackToConversations : null}
              socket={socket}
            />
          ) : (
            <div className="no-conversation-selected">
              <div className="no-chat-content">
                <div className="no-chat-icon">💬</div>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile floating action button */}
      {isMobile && (
        <button className="mobile-fab">
          <span>+</span>
        </button>
      )}
    </div>
  );
};

export default Chat;
