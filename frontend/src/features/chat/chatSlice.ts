import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ChatState, Chat, Message } from '../inbox/types/chat';
import {
  fetchChatsThunk,
  fetchChatByIdThunk,
  createChatThunk,
  fetchMessagesThunk,
  sendMessageThunk,
  markMessagesAsReadThunk,
  deleteMessageThunk,
  findOrCreateChatByUsersThunk,
} from '../inbox/chatThunks';

const initialState: ChatState = {
  chats: [],
  currentChat: null,
  messages: {},
  status: 'idle',
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  subscriptions: {},
  typing: {},
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state: ChatState) => {
      state.error = null;
    },
    setCurrentChat: (state: ChatState, action: PayloadAction<Chat | null>) => {
      state.currentChat = action.payload;
    },
    setChats: (state: ChatState, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
    },
    addMessage: (state: ChatState, action: PayloadAction<{ chatId: string; message: Message }>) => {
      const { chatId, message } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(message);
    },
    setMessages: (state: ChatState, action: PayloadAction<{ chatId: string; messages: Message[] }>) => {
      const { chatId, messages } = action.payload;
      state.messages[chatId] = messages;
    },
    updateSubscription: (state: ChatState, action: PayloadAction<{ chatId: string; subscribed: boolean }>) => {
      const { chatId, subscribed } = action.payload;
      state.subscriptions[chatId] = subscribed;
    },
    setTyping: (state: ChatState, action: PayloadAction<{ chatId: string; typing: boolean }>) => {
      const { chatId, typing } = action.payload;
      state.typing[chatId] = typing;
    },
  },
  extraReducers: (builder) => {
    // Fetch chats
    builder
      .addCase(fetchChatsThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchChatsThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.chats = action.payload.chats;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchChatsThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Fetch chat by ID
    builder
      .addCase(fetchChatByIdThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchChatByIdThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentChat = action.payload.data;
      })
      .addCase(fetchChatByIdThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Create chat
    builder
      .addCase(createChatThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createChatThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const newChat = action.payload.data || action.payload;
        state.currentChat = newChat;
        // Add to chats list if not already there
        if (!state.chats.find(chat => chat.id === newChat.id)) {
          state.chats.unshift(newChat);
        }
      })
      .addCase(createChatThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Find or create chat by users
    builder
      .addCase(findOrCreateChatByUsersThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(findOrCreateChatByUsersThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const chat = action.payload.data || action.payload;
        state.currentChat = chat;
        // Add to chats list if not already there
        if (!state.chats.find(c => c.id === chat.id)) {
          state.chats.unshift(chat);
        }
      })
      .addCase(findOrCreateChatByUsersThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Fetch messages
    builder
      .addCase(fetchMessagesThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMessagesThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { chatId } = action.meta.arg;
        state.messages[chatId] = action.payload.messages;
      })
      .addCase(fetchMessagesThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Send message
    builder
      .addCase(sendMessageThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(sendMessageThunk.fulfilled, (state, action) => {
        const message = action.payload.data || action.payload;
        const { chatId } = action.meta.arg;
        if (!state.messages[chatId]) {
          state.messages[chatId] = [];
        }
        state.messages[chatId].push(message);
      })
      .addCase(sendMessageThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Mark messages as read
    builder
      .addCase(markMessagesAsReadThunk.fulfilled, (state, action) => {
        const { chatId } = action.meta.arg;
        // Update messages as read
        if (state.messages[chatId]) {
          state.messages[chatId] = state.messages[chatId].map(msg => ({
            ...msg,
            is_read: true
          }));
        }
      });

    // Delete message
    builder
      .addCase(deleteMessageThunk.fulfilled, (state, action) => {
        const { chatId, messageId } = action.meta.arg;
        if (state.messages[chatId]) {
          state.messages[chatId] = state.messages[chatId].filter(msg => msg.id !== messageId);
        }
      });
  },
});

export const {
  clearError,
  setCurrentChat,
  setChats,
  addMessage,
  setMessages,
  updateSubscription,
  setTyping,
} = chatSlice.actions;

export default chatSlice.reducer;
