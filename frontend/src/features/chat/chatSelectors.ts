import type { RootState } from '../../store';
import type { ChatState, Chat, Message, MessageType } from './types/chat';

// Basic selectors
export const selectChatState = (state: RootState): ChatState => state.chat;

export const selectChats = (state: RootState): Chat[] => state.chat.chats;

export const selectCurrentChat = (state: RootState): Chat | null => state.chat.currentChat;

export const selectMessages = (state: RootState): Message[] => state.chat.messages;

export const selectChatStatus = (state: RootState): ChatState['status'] => state.chat.status;

export const selectChatError = (state: RootState): string | null => state.chat.error ?? null;

export const selectSendMessageStatus = (state: RootState): ChatState['sendMessageStatus'] => state.chat.sendMessageStatus;

export const selectSendMessageError = (state: RootState): string | null => state.chat.sendMessageError ?? null;

export const selectMarkAsReadStatus = (state: RootState): ChatState['markAsReadStatus'] => state.chat.markAsReadStatus;

export const selectMarkAsReadError = (state: RootState): string | null => state.chat.markAsReadError ?? null;

export const selectPagination = (state: RootState) => state.chat.pagination;

export const selectTypingUsers = (state: RootState): string[] => state.chat.typingUsers;

export const selectOnlineUsers = (state: RootState): string[] => state.chat.onlineUsers;

// Derived selectors
export const selectIsChatLoading = (state: RootState): boolean => state.chat.status === 'loading';

export const selectIsChatError = (state: RootState): boolean => state.chat.status === 'error';

export const selectIsChatSuccess = (state: RootState): boolean => state.chat.status === 'success';

export const selectIsChatIdle = (state: RootState): boolean => state.chat.status === 'idle';

export const selectIsSendingMessage = (state: RootState): boolean => state.chat.sendMessageStatus === 'loading';

export const selectIsSendMessageError = (state: RootState): boolean => state.chat.sendMessageStatus === 'error';

export const selectIsSendMessageSuccess = (state: RootState): boolean => state.chat.sendMessageStatus === 'success';

export const selectIsMarkingAsRead = (state: RootState): boolean => state.chat.markAsReadStatus === 'loading';

export const selectIsMarkAsReadError = (state: RootState): boolean => state.chat.markAsReadStatus === 'error';

export const selectIsMarkAsReadSuccess = (state: RootState): boolean => state.chat.markAsReadStatus === 'success';

export const selectHasMoreChats = (state: RootState): boolean => state.chat.pagination.hasMore;

export const selectTotalChats = (state: RootState): number => state.chat.pagination.total;

// Chat-specific selectors
export const selectChatById = (state: RootState, chatId: string): Chat | null => {
  return state.chat.chats.find(chat => chat.id === chatId) || null;
};

export const selectMessageById = (state: RootState, messageId: string): Message | null => {
  return state.chat.messages.find(message => message.id === messageId) || null;
};

export const selectUnreadChats = (state: RootState): Chat[] => {
  return state.chat.chats.filter(chat => chat.unread_count > 0);
};

export const selectUnreadCount = (state: RootState): number => {
  return state.chat.chats.reduce((total, chat) => total + chat.unread_count, 0);
};

export const selectActiveChats = (state: RootState): Chat[] => {
  return state.chat.chats.filter(chat => chat.is_active);
};

export const selectChatWithUser = (state: RootState, userId: string): Chat | null => {
  return state.chat.chats.find(chat => 
    chat.participant1_id === userId || chat.participant2_id === userId
  ) || null;
};

// Message-specific selectors
export const selectUnreadMessages = (state: RootState): Message[] => {
  return state.chat.messages.filter(message => !message.is_read);
};

export const selectMessagesByType = (state: RootState, type: MessageType): Message[] => {
  return state.chat.messages.filter(message => message.type === type);
};

export const selectTextMessages = (state: RootState): Message[] => {
  return state.chat.messages.filter(message => message.type === 'text');
};

export const selectImageMessages = (state: RootState): Message[] => {
  return state.chat.messages.filter(message => message.type === 'image');
};

export const selectOfferMessages = (state: RootState): Message[] => {
  return state.chat.messages.filter(message => message.type === 'offer');
};

export const selectSystemMessages = (state: RootState): Message[] => {
  return state.chat.messages.filter(message => message.type === 'system');
};

export const selectMessagesBySender = (state: RootState, senderId: string): Message[] => {
  return state.chat.messages.filter(message => message.sender_id === senderId);
};

export const selectLastMessage = (state: RootState): Message | null => {
  const messages = state.chat.messages;
  return messages.length > 0 ? messages[messages.length - 1] : null;
};

export const selectFirstUnreadMessage = (state: RootState): Message | null => {
  return state.chat.messages.find(message => !message.is_read) || null;
};

// User status selectors
export const selectIsUserTyping = (state: RootState, userId: string): boolean => {
  return state.chat.typingUsers.includes(userId);
};

export const selectIsUserOnline = (state: RootState, userId: string): boolean => {
  return state.chat.onlineUsers.includes(userId);
};

export const selectTypingUsersCount = (state: RootState): number => {
  return state.chat.typingUsers.length;
};

export const selectOnlineUsersCount = (state: RootState): number => {
  return state.chat.onlineUsers.length;
};

// Complex selectors
export const selectChatInfo = (state: RootState) => ({
  chats: selectChats(state),
  currentChat: selectCurrentChat(state),
  messages: selectMessages(state),
  status: selectChatStatus(state),
  sendMessageStatus: selectSendMessageStatus(state),
  markAsReadStatus: selectMarkAsReadStatus(state),
  error: selectChatError(state),
  sendMessageError: selectSendMessageError(state),
  markAsReadError: selectMarkAsReadError(state),
  pagination: selectPagination(state),
  typingUsers: selectTypingUsers(state),
  onlineUsers: selectOnlineUsers(state),
});

export const selectChatStats = (state: RootState) => {
  const chats = selectChats(state);
  const messages = selectMessages(state);
  
  return {
    totalChats: chats.length,
    activeChats: chats.filter(c => c.is_active).length,
    unreadChats: chats.filter(c => c.unread_count > 0).length,
    totalUnreadMessages: chats.reduce((total, chat) => total + chat.unread_count, 0),
    totalMessages: messages.length,
    textMessages: messages.filter(m => m.type === 'text').length,
    imageMessages: messages.filter(m => m.type === 'image').length,
    offerMessages: messages.filter(m => m.type === 'offer').length,
    onlineUsers: selectOnlineUsersCount(state),
    typingUsers: selectTypingUsersCount(state),
  };
};

export const selectChatWithListing = (state: RootState, listingId: string): Chat | null => {
  return state.chat.chats.find(chat => chat.listing_id === listingId) || null;
};

export const selectChatsByListing = (state: RootState, listingId: string): Chat[] => {
  return state.chat.chats.filter(chat => chat.listing_id === listingId);
};

export const selectRecentChats = (state: RootState, limit: number = 10): Chat[] => {
  return state.chat.chats
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, limit);
};

export const selectChatParticipants = (state: RootState, chatId: string): { id: string; name?: string; avatar?: string }[] => {
  const chat = selectChatById(state, chatId);
  if (!chat) return [];
  
  return [
    {
      id: chat.participant1_id,
      name: chat.participant1_name,
      avatar: chat.participant1_avatar,
    },
    {
      id: chat.participant2_id,
      name: chat.participant2_name,
      avatar: chat.participant2_avatar,
    },
  ];
};
