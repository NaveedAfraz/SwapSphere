import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ChatState, Chat, Message } from './types/chat';

const initialState: ChatState = {
  chats: [],
  currentChat: null,
  messages: [],
  status: 'idle',
  error: null,
  sendMessageStatus: 'idle',
  sendMessageError: null,
  markAsReadStatus: 'idle',
  markAsReadError: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  },
  typingUsers: [],
  onlineUsers: [],
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state: ChatState) => {
      state.error = null;
    },
    clearSendMessageError: (state: ChatState) => {
      state.sendMessageError = null;
    },
    clearMarkAsReadError: (state: ChatState) => {
      state.markAsReadError = null;
    },
    resetSendMessageStatus: (state: ChatState) => {
      state.sendMessageStatus = 'idle';
      state.sendMessageError = null;
    },
    resetMarkAsReadStatus: (state: ChatState) => {
      state.markAsReadStatus = 'idle';
      state.markAsReadError = null;
    },
    setCurrentChat: (state: ChatState, action: PayloadAction<Chat | null>) => {
      state.currentChat = action.payload;
      if (action.payload) {
        state.messages = [];
      }
    },
    addMessage: (state: ChatState, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
      
      // Update last message in chat
      if (state.currentChat && action.payload.chat_id === state.currentChat.id) {
        state.currentChat.last_message = action.payload.content;
        state.currentChat.last_message_time = action.payload.created_at;
      }
      
      // Update chat in list
      const chatIndex = state.chats.findIndex(chat => chat.id === action.payload.chat_id);
      if (chatIndex !== -1) {
        state.chats[chatIndex].last_message = action.payload.content;
        state.chats[chatIndex].last_message_time = action.payload.created_at;
        state.chats[chatIndex].updated_at = action.payload.created_at;
      }
    },
    updateMessage: (state: ChatState, action: PayloadAction<{ messageId: string; updates: Partial<Message> }>) => {
      const { messageId, updates } = action.payload;
      const messageIndex = state.messages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        state.messages[messageIndex] = { ...state.messages[messageIndex], ...updates };
      }
    },
    removeMessage: (state: ChatState, action: PayloadAction<string>) => {
      const messageId = action.payload;
      state.messages = state.messages.filter(msg => msg.id !== messageId);
    },
    setTypingUsers: (state: ChatState, action: PayloadAction<string[]>) => {
      state.typingUsers = action.payload;
    },
    addTypingUser: (state: ChatState, action: PayloadAction<string>) => {
      if (!state.typingUsers.includes(action.payload)) {
        state.typingUsers.push(action.payload);
      }
    },
    removeTypingUser: (state: ChatState, action: PayloadAction<string>) => {
      state.typingUsers = state.typingUsers.filter(userId => userId !== action.payload);
    },
    setOnlineUsers: (state: ChatState, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
    addOnlineUser: (state: ChatState, action: PayloadAction<string>) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    removeOnlineUser: (state: ChatState, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter(userId => userId !== action.payload);
    },
    clearMessages: (state: ChatState) => {
      state.messages = [];
    },
    clearChats: (state: ChatState) => {
      state.chats = [];
      state.currentChat = null;
      state.messages = [];
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
      };
    },
    updateChatUnreadCount: (state: ChatState, action: PayloadAction<{ chatId: string; unreadCount: number }>) => {
      const { chatId, unreadCount } = action.payload;
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].unread_count = unreadCount;
      }
      if (state.currentChat?.id === chatId) {
        state.currentChat.unread_count = unreadCount;
      }
    },
  },
  extraReducers: (builder: any) => {
    // Handle fetch chats thunk
    builder
      .addCase('chat/fetchChats/pending', (state: ChatState) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('chat/fetchChats/fulfilled', (state: ChatState, action: PayloadAction<{ chats: Chat[]; pagination: any }>) => {
        state.status = 'success';
        state.chats = action.payload.chats;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('chat/fetchChats/rejected', (state: ChatState, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch chats';
      });

    // Handle fetch chat by ID thunk
    builder
      .addCase('chat/fetchChatById/pending', (state: ChatState) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('chat/fetchChatById/fulfilled', (state: ChatState, action: PayloadAction<{ chat: Chat; messages?: Message[] }>) => {
        state.status = 'success';
        state.currentChat = action.payload.chat;
        if (action.payload.messages) {
          state.messages = action.payload.messages;
        }
        state.error = null;
      })
      .addCase('chat/fetchChatById/rejected', (state: ChatState, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch chat';
      });

    // Handle create chat thunk
    builder
      .addCase('chat/createChat/pending', (state: ChatState) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('chat/createChat/fulfilled', (state: ChatState, action: PayloadAction<{ chat: Chat; messages?: Message[] }>) => {
        state.status = 'success';
        state.currentChat = action.payload.chat;
        state.chats.unshift(action.payload.chat);
        if (action.payload.messages) {
          state.messages = action.payload.messages;
        }
        state.error = null;
      })
      .addCase('chat/createChat/rejected', (state: ChatState, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to create chat';
      });

    // Handle fetch messages thunk
    builder
      .addCase('chat/fetchMessages/pending', (state: ChatState) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('chat/fetchMessages/fulfilled', (state: ChatState, action: PayloadAction<{ messages: Message[]; pagination: any }>) => {
        state.status = 'success';
        state.messages = action.payload.messages;
        state.error = null;
      })
      .addCase('chat/fetchMessages/rejected', (state: ChatState, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch messages';
      });

    // Handle send message thunk
    builder
      .addCase('chat/sendMessage/pending', (state: ChatState) => {
        state.sendMessageStatus = 'loading';
        state.sendMessageError = null;
      })
      .addCase('chat/sendMessage/fulfilled', (state: ChatState, action: PayloadAction<Message>) => {
        state.sendMessageStatus = 'success';
        state.messages.push(action.payload);
        
        // Update chat's last message
        if (state.currentChat && action.payload.chat_id === state.currentChat.id) {
          state.currentChat.last_message = action.payload.content;
          state.currentChat.last_message_time = action.payload.created_at;
        }
        
        // Update chat in list
        const chatIndex = state.chats.findIndex(chat => chat.id === action.payload.chat_id);
        if (chatIndex !== -1) {
          state.chats[chatIndex].last_message = action.payload.content;
          state.chats[chatIndex].last_message_time = action.payload.created_at;
          state.chats[chatIndex].updated_at = action.payload.created_at;
        }
        
        state.sendMessageError = null;
      })
      .addCase('chat/sendMessage/rejected', (state: ChatState, action: any) => {
        state.sendMessageStatus = 'error';
        state.sendMessageError = action.payload as string || 'Failed to send message';
      });

    // Handle mark as read thunk
    builder
      .addCase('chat/markAsRead/pending', (state: ChatState) => {
        state.markAsReadStatus = 'loading';
        state.markAsReadError = null;
      })
      .addCase('chat/markAsRead/fulfilled', (state: ChatState, action: PayloadAction<string>) => {
        state.markAsReadStatus = 'success';
        
        // Mark all messages as read
        state.messages.forEach(msg => {
          msg.is_read = true;
        });
        
        // Update unread count in current chat
        if (state.currentChat && action.payload === state.currentChat.id) {
          state.currentChat.unread_count = 0;
        }
        
        // Update unread count in chat list
        const chatIndex = state.chats.findIndex(chat => chat.id === action.payload);
        if (chatIndex !== -1) {
          state.chats[chatIndex].unread_count = 0;
        }
        
        state.markAsReadError = null;
      })
      .addCase('chat/markAsRead/rejected', (state: ChatState, action: any) => {
        state.markAsReadStatus = 'error';
        state.markAsReadError = action.payload as string || 'Failed to mark as read';
      });

    // Handle delete message thunk
    builder
      .addCase('chat/deleteMessage/fulfilled', (state: ChatState, action: PayloadAction<string>) => {
        state.messages = state.messages.filter(msg => msg.id !== action.payload);
      });

    // Handle upload chat image thunk
    builder
      .addCase('chat/uploadImage/pending', (state: ChatState) => {
        state.sendMessageStatus = 'loading';
        state.sendMessageError = null;
      })
      .addCase('chat/uploadImage/fulfilled', (state: ChatState, action: PayloadAction<{ image_url: string }>) => {
        state.sendMessageStatus = 'success';
        state.sendMessageError = null;
      })
      .addCase('chat/uploadImage/rejected', (state: ChatState, action: any) => {
        state.sendMessageStatus = 'error';
        state.sendMessageError = action.payload as string || 'Failed to upload image';
      });

    // Handle search chats thunk
    builder
      .addCase('chat/searchChats/pending', (state: ChatState) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('chat/searchChats/fulfilled', (state: ChatState, action: PayloadAction<{ chats: Chat[]; pagination: any }>) => {
        state.status = 'success';
        state.chats = action.payload.chats;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('chat/searchChats/rejected', (state: ChatState, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to search chats';
      });
  },
});

export const {
  clearError,
  clearSendMessageError,
  clearMarkAsReadError,
  resetSendMessageStatus,
  resetMarkAsReadStatus,
  setCurrentChat,
  addMessage,
  updateMessage,
  removeMessage,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  clearMessages,
  clearChats,
  updateChatUnreadCount,
} = chatSlice.actions;

export default chatSlice.reducer;
