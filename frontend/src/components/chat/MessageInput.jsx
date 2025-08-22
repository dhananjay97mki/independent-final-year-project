import React, { useState, useRef } from 'react';

const MessageInput = ({ onSendMessage, onTyping }) => {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Handle typing indicators
    if (!isTyping) {
      setIsTyping(true);
      onTyping?.(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping?.(false);
    }, 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim() && !attachment) return;
    
    const messageData = {
      text: message.trim(),
      attachment: attachment
    };
    
    onSendMessage(messageData);
    
    // Clear form
    setMessage('');
    setAttachment(null);
    
    // Stop typing indicator
    setIsTyping(false);
    onTyping?.(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you'd upload the file and get a URL
      setAttachment(URL.createObjectURL(file));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-container">
      {attachment && (
        <div className="attachment-preview">
          <img src={attachment} alt="Attachment preview" />
          <button 
            className="remove-attachment"
            onClick={() => setAttachment(null)}
          >
            ×
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="message-input-form">
        <button
          type="button"
          className="attachment-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          📎
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          style={{ display: 'none' }}
        />
        
        <textarea
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="message-input"
          rows={1}
        />
        
        <button 
          type="submit" 
          className="send-btn"
          disabled={!message.trim() && !attachment}
        >
          ➤
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
