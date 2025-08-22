import { http } from './http';

const chatAPI = {
  // Get conversations
  getConversations: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return http(`/chat/conversations?${queryParams}`);
  },

  // Create conversation
  createConversation: (conversationData) => {
    return http('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify(conversationData)
    });
  },

  // Get conversation by ID
  getConversation: (conversationId) => {
    return http(`/chat/conversations/${conversationId}`);
  },

  // Get messages for conversation
  getMessages: (conversationId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return http(`/chat/conversations/${conversationId}/messages?${queryParams}`);
  },

  // Send message
  sendMessage: (conversationId, messageData) => {
    const formData = new FormData();
    formData.append('text', messageData.text || '');
    
    if (messageData.attachment) {
      formData.append('attachment', messageData.attachment);
    }

    return http(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type to let browser set it for FormData
    });
  },

  // Mark message as read
  markMessageRead: (messageId) => {
    return http(`/chat/messages/${messageId}/read`, {
      method: 'PATCH'
    });
  },

  // Get city room
  getCityRoom: (cityId) => {
    return http(`/chat/rooms/city/${cityId}`);
  },

  // Get company room
  getCompanyRoom: (companyId) => {
    return http(`/chat/rooms/company/${companyId}`);
  },

  // Search messages
  searchMessages: (query, params = {}) => {
    const queryParams = new URLSearchParams({ query, ...params }).toString();
    return http(`/chat/messages/search?${queryParams}`);
  }
};

export default chatAPI;
