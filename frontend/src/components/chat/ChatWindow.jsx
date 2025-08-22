import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import MessageInput from './MessageInput';

const ChatWindow = ({ conversation, onBack, socket }) => {
  const { currentUser } = useSelector(state => state.auth);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (conversation && socket) {
      // Load messages
      loadMessages();
      
      // Socket event listeners
      socket.on('new_message', handleNewMessage);
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stopped_typing', handleUserStoppedTyping);
      socket.on('messages_read', handleMessagesRead);

      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('user_typing', handleUserTyping);
        socket.off('user_stopped_typing', handleUserStoppedTyping);
        socket.off('messages_read', handleMessagesRead);
      };
    }
  }, [conversation, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chat/conversations/${conversation._id}/messages`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (data) => {
    if (data.conversationId === conversation._id) {
      setMessages(prev => [...prev, data.message]);
    }
  };

  const handleUserTyping = (data) => {
    if (data.conversationId === conversation._id && data.userId !== currentUser.id) {
      setTypingUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
    }
  };

  const handleUserStoppedTyping = (data) => {
    if (data.conversationId === conversation._id) {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    }
  };

  const handleMessagesRead = (data) => {
    if (data.conversationId === conversation._id) {
      setMessages(prev => prev.map(msg => 
        data.messageIds.includes(msg._id) 
          ? { ...msg, readBy: [...(msg.readBy || []), data.userId] }
          : msg
      ));
    }
  };

  const handleSendMessage = (messageData) => {
    if (socket) {
      socket.emit('send_message', {
        conversationId: conversation._id,
        ...messageData
      });
    }
  };

  const handleTyping = (isTyping) => {
    if (socket && conversation) {
      if (isTyping) {
        socket.emit('typing_start', conversation._id);
      } else {
        socket.emit('typing_stop', conversation._id);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConversationTitle = () => {
    if (conversation.type === 'city') {
      return `${conversation.city?.name} City Chat`;
    }
    if (conversation.type === 'company') {
      return `${conversation.company?.name} Company Chat`;
    }
    return conversation.members
      .filter(member => member._id !== currentUser?.id)
      .map(member => member.name)
      .join(', ') || 'Direct Message';
  };

  if (loading) {
    return (
      <div className="chat-window loading">
        <div className="loading-spinner"></div>
        <span>Loading messages...</span>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
        )}
        <div className="chat-title">
          <h3>{getConversationTitle()}</h3>
          <span className="member-count">
            {conversation.members?.length || 0} members
          </span>
        </div>
        <div className="chat-actions">
          <button className="chat-action-btn">🔍</button>
          <button className="chat-action-btn">⋮</button>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((message, index) => {
          const isOwnMessage = message.sender._id === currentUser?.id;
          const showAvatar = !isOwnMessage && (
            index === 0 || 
            messages[index - 1].sender._id !== message.sender._id
          );

          return (
            <div
              key={message._id}
              className={`message-wrapper ${isOwnMessage ? 'own-message' : 'other-message'}`}
            >
              {showAvatar && (
                <img
                  src={message.sender.avatar || '/default-avatar.png'}
                  alt={message.sender.name}
                  className="message-avatar"
                />
              )}
              
              <div className="message-content">
                {!isOwnMessage && showAvatar && (
                  <span className="sender-name">{message.sender.name}</span>
                )}
                
                <div className="message-bubble">
                  {message.text && <p>{message.text}</p>}
                  {message.attachment && (
                    <div className="message-attachment">
                      <img src={message.attachment} alt="Attachment" />
                    </div>
                  )}
                </div>
                
                <div className="message-meta">
                  <span className="message-time">
                    {formatMessageTime(message.sentAt)}
                  </span>
                  {isOwnMessage && (
                    <span className="message-status">
                      {message.readBy?.length > 1 ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>
              {typingUsers.map(u => u.userName).join(', ')} 
              {typingUsers.length === 1 ? ' is' : ' are'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <MessageInput 
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
      />
    </div>
  );
};

export default ChatWindow;
