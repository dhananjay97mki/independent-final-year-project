import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import chatAPI from '../api/chat.api';

// Async thunks
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getConversations(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ conversationId, ...params }, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getMessages(conversationId, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ conversationId, messageData }, { rejectWithValue }) => {
    try {
      const response = await chatAPI.sendMessage(conversationId, messageData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (conversationData, { rejectWithValue }) => {
    try {
      const response = await chatAPI.createConversation(conversationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create conversation');
    }
  }
);

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  onlineUsers: [],
  typingUsers: [],
  loading: false,
  error: null,
  unreadCount: 0
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
      state.messages = []; // Clear messages when switching conversations
    },
    
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    
    updateMessage: (state, action) => {
      const index = state.messages.findIndex(msg => msg._id === action.payload._id);
      if (index !== -1) {
        state.messages[index] = action.payload;
      }
    },
    
    setTypingUsers: (state, action) => {
      state.typingUsers = action.payload;
    },
    
    addTypingUser: (state, action) => {
      const exists = state.typingUsers.find(user => user.userId === action.payload.userId);
      if (!exists) {
        state.typingUsers.push(action.payload);
      }
    },
    
    removeTypingUser: (state, action) => {
      state.typingUsers = state.typingUsers.filter(user => user.userId !== action.payload.userId);
    },
    
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    
    updateConversationLastMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      const conversation = state.conversations.find(conv => conv._id === conversationId);
      if (conversation) {
        conversation.lastMessage = message;
        conversation.updatedAt = message.sentAt;
      }
    },
    
    incrementUnreadCount: (state, action) => {
      const { conversationId } = action.payload;
      const conversation = state.conversations.find(conv => conv._id === conversationId);
      if (conversation) {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
      }
      state.unreadCount += 1;
    },
    
    resetUnreadCount: (state, action) => {
      const { conversationId } = action.payload;
      const conversation = state.conversations.find(conv => conv._id === conversationId);
      if (conversation) {
        state.unreadCount -= conversation.unreadCount || 0;
        conversation.unreadCount = 0;
      }
    },
    
    clearChatData: (state) => {
      state.conversations = [];
      state.activeConversation = null;
      state.messages = [];
      state.typingUsers = [];
      state.unreadCount = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload.conversations || action.payload;
        // Calculate total unread count
        state.unreadCount = state.conversations.reduce(
          (total, conv) => total + (conv.unreadCount || 0), 0
        );
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.messages || action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Send message
      .addCase(sendMessage.pending, (state) => {
        // Optionally add optimistic message here
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        // Message will be added via socket events
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Create conversation
      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload);
        state.activeConversation = action.payload;
      });
  }
});

export const {
  setActiveConversation,
  addMessage,
  updateMessage,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  setOnlineUsers,
  updateConversationLastMessage,
  incrementUnreadCount,
  resetUnreadCount,
  clearChatData
} = chatSlice.actions;

export default chatSlice.reducer;
