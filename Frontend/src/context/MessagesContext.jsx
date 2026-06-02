import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

const MessagesContext = createContext();

export const MessagesProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [teamMessages, setTeamMessages] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const activeThreadRef = useRef(null);
  const socketRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
      const totalUnread = res.data.reduce((sum, conv) => sum + (conv.unread || 0), 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  }, [isAuthenticated]);

  const fetchMessages = useCallback(async (otherId, jobId = null) => {
    if (!isAuthenticated || !otherId) return;
    setActiveThreadId(otherId);
    activeThreadRef.current = otherId;
    try {
      const url = jobId ? `/messages/job/${jobId}` : `/messages/${otherId}`;
      const res = await api.get(url, { params: { jobId } });
      setMessages(res.data);
      // Mark as read when thread is opened
      await api.patch(`/messages/${otherId}/read`);
      fetchConversations();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, [isAuthenticated, fetchConversations]);

  const fetchContacts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/messages/users');
      setContacts(res.data);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  }, [isAuthenticated]);

  const fetchTeamMessages = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/messages/team');
      setTeamMessages(res.data);
    } catch (error) {
      console.error('Failed to fetch team messages:', error);
    }
  }, [isAuthenticated]);

  const sendMessage = async (receiverId, content, jobId = null) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', { receiverId, content, jobId });
    } else {
      try {
        const res = await api.post('/messages', { receiverId, content, jobId });
        setMessages(prev => [...prev, res.data]);
        fetchConversations();
      } catch (error) {
        toast.error('Failed to send message');
      }
    }
  };

  const sendTeamMessage = async (content) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_team_message', { content });
    } else {
      try {
        const res = await api.post('/messages/team', { content });
        setTeamMessages(prev => [...prev, res.data]);
      } catch (error) {
        toast.error('Failed to send team message');
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      fetchContacts();

      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const socketUrl = apiUrl.endsWith('/api') ? apiUrl.replace(/\/api$/, '') : apiUrl;

      console.log('[Socket] Connecting to:', socketUrl);
      const socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'] // Try websocket first, fallback to polling
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[Socket] Connected with ID:', socket.id);
      });

      socket.on('connect_error', (err) => {
        console.error('[Socket] Connection error:', err.message);
      });

      socket.on('receive_message', (message) => {
        console.log('[Socket] Received message:', message);
        setMessages(prev => {
          const currentThreadId = activeThreadRef.current;

          // Logic for thread matching:
          // 1. Direct match (ID match)
          let isCurrentThread = (
            Number(message.senderId) === Number(currentThreadId) ||
            Number(message.receiverId) === Number(currentThreadId)
          );

          // 2. Special case for Customers: Show messages from ANY admin/manager 
          // This allows the Support UI to "snap" to the active admin who is currently replying.
          if (!isCurrentThread && user?.role?.toUpperCase() === 'CUSTOMER') {
            const senderRole = message.sender?.role?.toUpperCase();
            if (senderRole === 'ADMIN' || senderRole === 'MANAGER') {
              isCurrentThread = true;
            }
          }

          if (isCurrentThread) {
            if (prev.some(m => m.id === message.id)) return prev;
            return [...prev, message];
          }
          return prev;
        });
        fetchConversations();
      });

      socket.on('receive_team_message', (message) => {
        console.log('[Socket] Received team message:', message);
        setTeamMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [isAuthenticated, user?.id, fetchConversations, fetchContacts]);

  const deleteConversation = async (otherId) => {
    try {
      await api.delete(`/messages/${otherId}`);
      toast.success('Conversation deleted');
      if (activeThreadId === otherId) {
        setMessages([]);
        setActiveThreadId(null);
      }
      fetchConversations();
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  };

  const deleteAllMessages = async () => {
    try {
      await api.delete('/messages');
      toast.success('Inbox cleared');
      setMessages([]);
      setConversations([]);
      setUnreadCount(0);
      setActiveThreadId(null);
      fetchConversations();
    } catch (error) {
      toast.error('Failed to clear inbox');
    }
  };

  const deleteMessages = async (messageIds) => {
    try {
      await api.delete('/messages/batch', { data: { ids: messageIds } });
      toast.success('Selected messages deleted');
      setMessages(prev => prev.filter(m => !messageIds.includes(m.id)));
      fetchConversations();
    } catch (error) {
      toast.error('Failed to delete messages');
    }
  };

  return (
    <MessagesContext.Provider value={{
      conversations,
      messages,
      contacts,
      unreadCount,
      activeThreadId,
      isLoading,
      fetchMessages,
      sendMessage,
      refreshConversations: fetchConversations,
      deleteConversation,
      deleteAllMessages,
      deleteMessages,
      teamMessages,
      fetchTeamMessages,
      sendTeamMessage,
      socket: socketRef.current
    }}>
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};
