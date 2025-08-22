import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import io from 'socket.io-client';
import { 
  addMessage, 
  addTypingUser, 
  removeTypingUser, 
  setOnlineUsers,
  updateConversationLastMessage,
  incrementUnreadCount 
} from '../store/chat.slice';

export const useSocket = () => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  const { currentUser, token } = useSelector(state => state.auth);
  const { activeConversation } = useSelector(state => state.chat);

  useEffect(() => {
    if (!token || !currentUser) return;

    // Initialize socket connection
    socketRef.current = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token
      },
      transports: ['websocket']
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to server');
      socket.emit('user_online');
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Chat events
    socket.on('new_message', (data) => {
      dispatch(addMessage(data.message));
      dispatch(updateConversationLastMessage({
        conversationId: data.conversationId,
        message: data.message
      }));
      
      // Increment unread count if not in active conversation
      if (!activeConversation || activeConversation._id !== data.conversationId) {
        dispatch(incrementUnreadCount({ conversationId: data.conversationId }));
      }
    });

    socket.on('user_typing', (data) => {
      dispatch(addTypingUser(data));
    });

    socket.on('user_stopped_typing', (data) => {
      dispatch(removeTypingUser(data));
    });

    // Presence events
    socket.on('user_status_changed', (data) => {
      console.log('User status changed:', data);
    });

    socket.on('online_users_list', (users) => {
      dispatch(setOnlineUsers(users));
    });

    socket.on('user_location_updated', (data) => {
      console.log('User location updated:', data);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      if (socket) {
        socket.emit('user_offline');
        socket.disconnect();
      }
    };
  }, [token, currentUser, dispatch, activeConversation]);

  return socketRef.current;
};

export default useSocket;
