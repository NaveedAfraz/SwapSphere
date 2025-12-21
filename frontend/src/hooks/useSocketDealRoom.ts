import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from './redux';
import { selectAccessToken } from '../features/auth/authSelectors';
import { io, Socket } from 'socket.io-client';
import { 
  addMessage, 
  setTyping, 
  updateMessageReadStatus,
  updateDealRoomStateAction,
  addDealEvent,
  setOnlineUsers 
} from '../features/dealRooms/dealRoomSlice';
import { Message, DealEvent } from '../features/dealRooms/types/dealRoom';
import { useAuth } from './useAuth';


export const useSocketDealRoom = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, authStatus } = useAuth();
  const token = useAppSelector(selectAccessToken);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user || !token) return;

    // Initialize socket connection
    socketRef.current = io(process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.104:5000', {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to deal room socket server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from deal room socket server');
    });

    // Deal room events
    socket.on('joined_deal_room', ({ dealRoomId }) => {
      console.log(`Joined deal room: ${dealRoomId}`);
    });

    socket.on('left_deal_room', ({ dealRoomId }) => {
      console.log(`Left deal room: ${dealRoomId}`);
    });

    // Message events
    socket.on('new_message', (message: Message) => {
      dispatch(addMessage({ dealRoomId: message.deal_room_id, message }));
    });

    // Typing events
    socket.on('user_typing', ({ userId, dealRoomId, isTyping }) => {
      if (userId !== user?.id) {
        dispatch(setTyping({ dealRoomId, isTyping }));
      }
    });

    // Read receipts
    socket.on('messages_read', ({ userId, dealRoomId, messageIds }) => {
      dispatch(updateMessageReadStatus({ dealRoomId, messageIds }));
    });

    // Deal state changes
    socket.on('deal_state_changed', ({ dealRoomId, oldState, state: newState, updatedBy, metadata }) => {
      dispatch(updateDealRoomStateAction({ dealRoomId, newState, metadata }) as any);
      
      // Create a deal event for the state change
      const event: DealEvent = {
        id: Date.now().toString(), // Temporary ID
        deal_room_id: dealRoomId,
        actor_id: updatedBy,
        event_type: 'state_changed',
        payload: {
          old_state: oldState,
          new_state: newState,
          ...metadata,
        },
        created_at: new Date().toISOString(),
      };
      dispatch(addDealEvent({ dealRoomId, event }));
    });

    // Online users
    socket.on('online_users', (users: string[]) => {
      dispatch(setOnlineUsers(users));
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user, dispatch]);

  // Socket actions
  const joinDealRoom = (dealRoomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join_deal_room', dealRoomId);
    }
  };

  const leaveDealRoom = (dealRoomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_deal_room', dealRoomId);
    }
  };

  const sendMessage = (dealRoomId: string, body: string, attachments: any[] = []) => {
    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        dealRoomId,
        body,
        attachments,
      });
    }
  };

  const startTyping = (dealRoomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('typing_start', dealRoomId);
    }
  };

  const stopTyping = (dealRoomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('typing_stop', dealRoomId);
    }
  };

  const markAsRead = (dealRoomId: string, messageIds: string[]) => {
    if (socketRef.current) {
      socketRef.current.emit('mark_read', {
        dealRoomId,
        messageIds,
      });
    }
  };

  const updateDealState = (dealRoomId: string, newState: string, metadata?: Record<string, any>) => {
    if (socketRef.current) {
      socketRef.current.emit('update_deal_state', {
        dealRoomId,
        state: newState,
        metadata,
      });
    }
  };

  return {
    isConnected: socketRef.current?.connected || false,
    joinDealRoom,
    leaveDealRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    updateDealState,
  };
};
