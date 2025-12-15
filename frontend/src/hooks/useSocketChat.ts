import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { addMessage, setMessages } from '../features/chat/chatSlice';
import { selectUser } from '../features/auth/authSelectors';
import type { Message } from '../features/inbox/types/chat';

// Hook for Socket.IO connection management
export const useSocketConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);

  const connect = useCallback(async () => {
    try {
      setError(null);
      const socket = await socketService.connect();
      setIsConnected(true);
      
      // Set up message listener
      socket.on('new_message', (message: Message) => {
        dispatch(addMessage({ chatId: message.chat_id, message }));
      });

      // Set up typing indicator listeners
      socket.on('user_typing', (data: any) => {
        // Dispatch typing indicator update to Redux
        dispatch({
          type: 'chat/setTyping',
          payload: { chatId: data.chatId, typing: data.isTyping }
        });
      });

      // Set up read receipts
      socket.on('messages_read', (data: any) => {
        // Update message read status in Redux
        // This would need to be implemented in your chat slice
      });

    } catch (err: any) {
      setError(err.message || 'Connection failed');
      setIsConnected(false);
    }
  }, [dispatch]);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
  }, []);

  // Auto-connect when user is available
  useEffect(() => {
    if (currentUser && !isConnected) {
      connect();
    }

    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [currentUser, isConnected, connect, disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect
  };
};

// Hook for chat room management
export const useChatRoom = (chatId: string) => {
  const [isInRoom, setIsInRoom] = useState(false);
  const socket = socketService.getSocket();

  const joinRoom = useCallback(() => {
    if (socket?.connected && chatId) {
      socketService.joinChat(chatId);
      setIsInRoom(true);
    }
  }, [chatId, socket]);

  const leaveRoom = useCallback(() => {
    if (socket?.connected && chatId) {
      socketService.leaveChat(chatId);
      setIsInRoom(false);
    }
  }, [chatId, socket]);

  // Auto-join when chatId changes and socket is connected
  useEffect(() => {
    if (socket?.connected && chatId && !isInRoom) {
      joinRoom();
    }

    return () => {
      if (isInRoom) {
        leaveRoom();
      }
    };
  }, [chatId, socket, isInRoom, joinRoom, leaveRoom]);

  return {
    isInRoom,
    joinRoom,
    leaveRoom
  };
};

// Hook for sending messages
export const useSendMessage = () => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (chatId: string, body: string, attachments: any[] = []) => {
    try {
      setIsSending(true);
      setError(null);
      
      socketService.sendMessage(chatId, body, attachments);
      
      // Socket.IO is fire-and-forget for sending
      // The message will come back through the 'new_message' event
      setIsSending(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setIsSending(false);
    }
  }, []);

  return {
    sendMessage,
    isSending,
    error
  };
};

// Hook for typing indicators
export const useTypingIndicator = (chatId: string) => {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = React.useRef<number | null>(null);

  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      socketService.startTyping(chatId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [chatId, isTyping]);

  const stopTyping = useCallback(() => {
    if (isTyping) {
      setIsTyping(false);
      socketService.stopTyping(chatId);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [chatId, isTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isTyping,
    startTyping,
    stopTyping
  };
};

// Hook for read receipts
export const useReadReceipts = () => {
  const markAsRead = useCallback((chatId: string, messageIds: string[]) => {
    socketService.markAsRead(chatId, messageIds);
  }, []);

  return {
    markAsRead
  };
};

// Combined hook for all chat functionality
export const useSocketChat = (chatId: string) => {
  const connection = useSocketConnection();
  const room = useChatRoom(chatId);
  const sendMessage = useSendMessage();
  const typing = useTypingIndicator(chatId);
  const readReceipts = useReadReceipts();

  return {
    // Connection
    isConnected: connection.isConnected,
    connectionError: connection.error,
    
    // Room management
    isInRoom: room.isInRoom,
    joinRoom: room.joinRoom,
    leaveRoom: room.leaveRoom,
    
    // Messaging
    sendMessage: sendMessage.sendMessage,
    isSending: sendMessage.isSending,
    sendError: sendMessage.error,
    
    // Typing
    isTyping: typing.isTyping,
    startTyping: typing.startTyping,
    stopTyping: typing.stopTyping,
    
    // Read receipts
    markAsRead: readReceipts.markAsRead
  };
};
