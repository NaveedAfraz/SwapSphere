import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  DealRoom,
  DealRoomStateType,
  DealRoomsResponse,
  DealRoomResponse,
  Message,
  MessagesResponse,
  DealEvent,
  DealEventsResponse,
  SendMessagePayload,
  UpdateDealRoomStatePayload,
  DealRoomSearchParams,
  MessageSearchParams,
  DealEventSearchParams,
} from './types/dealRoom';
import { apiClient } from '../../services/api';

// Async thunks
export const fetchDealRooms = createAsyncThunk<
  DealRoomsResponse,
  DealRoomSearchParams
>('dealRooms/fetchDealRooms', async (params = {}) => {
  const response = await apiClient.get('/deal-rooms', { params });
  return response.data;
});

export const fetchDealRoom = createAsyncThunk<
  DealRoom,
  string
>('dealRooms/fetchDealRoom', async (dealRoomId) => {
  // Add cache-busting timestamp to ensure fresh data
  const timestamp = Date.now();
  const response = await apiClient.get(`/deal-rooms/${dealRoomId}?_t=${timestamp}`);
  return response.data;
});

export const createDealRoom = createAsyncThunk<
  DealRoomResponse,
  { listing_id: string; seller_id: string; intent_id?: string }
>('dealRooms/createDealRoom', async (dealRoomData) => {
  const response = await apiClient.post('/deal-rooms', dealRoomData);
  return response.data;
});

export const findDealRoom = createAsyncThunk<
  DealRoomResponse,
  { seller_id: string; listing_id: string }
>('dealRooms/findDealRoom', async (searchParams) => {
  const response = await apiClient.get('/deal-rooms/find', { params: searchParams });
  return response.data;
});

export const updateDealRoomState = createAsyncThunk<
  DealRoomResponse,
  { dealRoomId: string; state: string; metadata?: Record<string, any> }
>('dealRooms/updateDealRoomState', async ({ dealRoomId, state, metadata }) => {
  const response = await apiClient.patch(`/deal-rooms/${dealRoomId}/state`, {
    state,
    metadata,
  });
  return response.data;
});

export const fetchMessages = createAsyncThunk<
  { messages: Message[]; pagination: any; dealRoomId: string },
  { dealRoomId: string; params?: MessageSearchParams }
>('dealRooms/fetchMessages', async ({ dealRoomId, params = {} }) => {
  const response = await apiClient.get(`/messages/${dealRoomId}`, { params });
  return { ...response.data, dealRoomId };
});

export const sendMessage = createAsyncThunk<
  { data: Message; dealRoomId: string },
  { dealRoomId: string; payload: SendMessagePayload }
>('dealRooms/sendMessage', async ({ dealRoomId, payload }) => {
  const response = await apiClient.post(`/messages/${dealRoomId}`, payload);
  return { ...response.data, dealRoomId };
});

export const markMessagesAsRead = createAsyncThunk<
  void,
  { dealRoomId: string; message_ids: string[] }
>('dealRooms/markMessagesAsRead', async ({ dealRoomId, message_ids }) => {
  await apiClient.patch(`/messages/${dealRoomId}/read`, { message_ids });
});

export const fetchDealEvents = createAsyncThunk<
  { events: DealEvent[]; pagination: any; dealRoomId: string },
  { dealRoomId: string; params?: DealEventSearchParams }
>('dealRooms/fetchDealEvents', async ({ dealRoomId, params = {} }) => {
  const response = await apiClient.get(`/deal-events/${dealRoomId}`, { params });
  return { ...response.data, dealRoomId };
});

// Initial state
const initialState: DealRoomStateType = {
  dealRooms: [],
  currentDealRoom: null,
  messages: {},
  events: {},
  status: 'idle',
  error: null,
  sendMessageStatus: 'idle',
  sendMessageError: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  typing: {},
  onlineUsers: [],
};

// Slice
const dealRoomSlice = createSlice({
  name: 'dealRooms',
  initialState,
  reducers: {
    clearCurrentDealRoom: (state) => {
      state.currentDealRoom = null;
    },
    clearError: (state) => {
      state.error = null;
      state.sendMessageError = null;
    },
    setTyping: (state, action: PayloadAction<{ dealRoomId: string; isTyping: boolean }>) => {
      const { dealRoomId, isTyping } = action.payload;
      if (isTyping) {
        state.typing[dealRoomId] = true;
      } else {
        delete state.typing[dealRoomId];
      }
    },
    addMessage: (state, action: PayloadAction<{ dealRoomId: string; message: Message }>) => {
      const { dealRoomId, message } = action.payload;
      
      // Validate message before adding
      if (!message || !message.id) {
        console.warn('Invalid message being added:', message);
        return;
      }
      
      if (!state.messages[dealRoomId]) {
        state.messages[dealRoomId] = [];
      }
      state.messages[dealRoomId].push(message);
      
      // Update unread count if message is not from current user
      const currentDealRoom = state.dealRooms.find(dr => dr.id === dealRoomId);
      if (currentDealRoom && !message.is_read) {
        currentDealRoom.unread_count = (currentDealRoom.unread_count || 0) + 1;
        currentDealRoom.last_message = message.body;
        currentDealRoom.last_message_at = message.created_at;
      }
    },
    updateMessageReadStatus: (state, action: PayloadAction<{ dealRoomId: string; messageIds: string[] }>) => {
      const { dealRoomId, messageIds } = action.payload;
      if (state.messages[dealRoomId]) {
        state.messages[dealRoomId] = state.messages[dealRoomId].map((message: Message) =>
          messageIds.includes(message.id) ? { ...message, is_read: true } : message
        );
      }
      
      // Update unread count
      const currentDealRoom = state.dealRooms.find((dr: DealRoom) => dr.id === dealRoomId);
      if (currentDealRoom) {
        const unreadMessages = state.messages[dealRoomId]?.filter((m: Message) => !m.is_read && !messageIds.includes(m.id)) || [];
        currentDealRoom.unread_count = unreadMessages.length;
      }
    },
    updateDealRoomStateAction: (state, action: PayloadAction<{ dealRoomId: string; newState: string; metadata?: Record<string, any> }>) => {
      const { dealRoomId, newState, metadata } = action.payload;
      const dealRoom = state.dealRooms.find(dr => dr.id === dealRoomId);
      if (dealRoom) {
        dealRoom.current_state = newState as any;
        if (metadata) {
          dealRoom.metadata = { ...dealRoom.metadata, ...metadata };
        }
      }
      
      if (state.currentDealRoom?.id === dealRoomId) {
        state.currentDealRoom.current_state = newState as any;
        if (metadata) {
          state.currentDealRoom.metadata = { ...state.currentDealRoom.metadata, ...metadata };
        }
      }
    },
    addDealEvent: (state, action: PayloadAction<{ dealRoomId: string; event: DealEvent }>) => {
      const { dealRoomId, event } = action.payload;
      if (!state.events[dealRoomId]) {
        state.events[dealRoomId] = [];
      }
      state.events[dealRoomId].unshift(event);
    },
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch deal rooms
    builder
      .addCase(fetchDealRooms.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDealRooms.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.dealRooms = action.payload.deal_rooms;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchDealRooms.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch deal rooms';
      });

    // Fetch single deal room
    builder
      .addCase(fetchDealRoom.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDealRoom.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentDealRoom = action.payload;
      })
      .addCase(fetchDealRoom.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch deal room';
      });

    // Create deal room
    builder
      .addCase(createDealRoom.fulfilled, (state, action) => {
        state.dealRooms.unshift(action.payload.data);
      })
      .addCase(createDealRoom.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create deal room';
      });

    // Find deal room
    builder
      .addCase(findDealRoom.fulfilled, (state, action) => {
        state.currentDealRoom = action.payload.data;
      })
      .addCase(findDealRoom.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to find deal room';
      });

  // Update deal room state
    builder
      .addCase(updateDealRoomState.fulfilled, (state, action) => {
        const updatedDealRoom = action.payload.data;
        const index = state.dealRooms.findIndex(dr => dr.id === updatedDealRoom.id);
        if (index !== -1) {
          state.dealRooms[index] = updatedDealRoom;
        }
        if (state.currentDealRoom?.id === updatedDealRoom.id) {
          state.currentDealRoom = updatedDealRoom;
        }
      })
      .addCase(updateDealRoomState.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update deal room state';
      });

    // Fetch messages
    builder
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { messages, dealRoomId } = action.payload;
        state.messages[dealRoomId] = messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch messages';
      });

  // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.sendMessageStatus = 'loading';
        state.sendMessageError = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendMessageStatus = 'succeeded';
        const { data: message, dealRoomId } = action.payload;
        
        // Validate message before adding
        if (!message || !message.id) {
          console.warn('Invalid message received from sendMessage:', message);
          return;
        }
        
        if (!state.messages[dealRoomId]) {
          state.messages[dealRoomId] = [];
        }
        state.messages[dealRoomId].push(message);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendMessageStatus = 'failed';
        state.sendMessageError = action.error.message || 'Failed to send message';
      });

    // Mark messages as read
    builder
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { dealRoomId, message_ids } = action.meta.arg;
        if (state.messages[dealRoomId]) {
          state.messages[dealRoomId] = state.messages[dealRoomId].map(message =>
            message_ids.includes(message.id) ? { ...message, is_read: true } : message
          );
        }
        
        // Update unread count
        const currentDealRoom = state.dealRooms.find(dr => dr.id === dealRoomId);
        if (currentDealRoom) {
          const unreadMessages = state.messages[dealRoomId]?.filter(m => !m.is_read) || [];
          currentDealRoom.unread_count = unreadMessages.length;
        }
      })
      .addCase(markMessagesAsRead.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to mark messages as read';
      });

    // Fetch deal events
    builder
      .addCase(fetchDealEvents.fulfilled, (state, action) => {
        const { events, dealRoomId } = action.payload;
        state.events[dealRoomId] = events;
      })
      .addCase(fetchDealEvents.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch deal events';
      });
  },
});

export const {
  clearCurrentDealRoom,
  clearError,
  setTyping,
  addMessage,
  updateMessageReadStatus,
  updateDealRoomStateAction,
  addDealEvent,
  setOnlineUsers,
} = dealRoomSlice.actions;

export default dealRoomSlice.reducer;
