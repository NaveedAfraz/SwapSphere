import type { RootState } from '../../store';
import type { ChatState, Chat, Message, ConversationInfo } from './types/chat';

// Basic selectors
export const selectChatState = (state: RootState): ChatState => state.chat;

export const selectChats = (state: RootState): Chat[] => 
  selectChatState(state).chats;

export const selectCurrentChat = (state: RootState): Chat | null => 
  selectChatState(state).currentChat;

export const selectMessages = (state: RootState): Record<string, Message[]> => 
  selectChatState(state).messages;

export const selectChatMessages = (state: RootState, chatId: string): Message[] => 
  selectChatState(state).messages[chatId] || [];

export const selectChatStatus = (state: RootState): string => 
  selectChatState(state).status;

export const selectChatError = (state: RootState): string | null => 
  selectChatState(state).error;

export const selectChatPagination = (state: RootState) => 
  selectChatState(state).pagination;

export const selectChatSubscriptions = (state: RootState): Record<string, boolean> => 
  selectChatState(state).subscriptions;

export const selectTypingUsers = (state: RootState): Record<string, boolean> => 
  selectChatState(state).typing;

// Derived selectors
export const selectIsChatLoading = (state: RootState): boolean => 
  selectChatStatus(state) === 'loading';

export const selectIsChatError = (state: RootState): boolean => 
  selectChatStatus(state) === 'failed';

export const selectIsChatSuccess = (state: RootState): boolean => 
  selectChatStatus(state) === 'succeeded';

export const selectHasMoreChats = (state: RootState): boolean => 
  selectChatPagination(state).hasNext;

export const selectTotalChats = (state: RootState): number => 
  selectChatPagination(state).total;

export const selectUnreadChatsCount = (state: RootState): number => 
  selectChats(state).filter(chat => (chat.unread_count || 0) > 0).length;

export const selectTotalUnreadMessages = (state: RootState): number => 
  selectChats(state).reduce((total, chat) => total + (chat.unread_count || 0), 0);

// Chat-specific selectors
export const selectChatById = (state: RootState, chatId: string): Chat | undefined => 
  selectChats(state).find(chat => chat.id === chatId);

export const selectChatByListingId = (state: RootState, listingId: string): Chat | undefined => 
  selectChats(state).find(chat => chat.listing_id === listingId);

export const selectChatByParticipant = (state: RootState, participantId: string): Chat[] => 
  selectChats(state).filter(chat => 
    chat.participants?.some(participant => participant.user_id === participantId)
  );

export const selectChatsWithUnreadMessages = (state: RootState): Chat[] => 
  selectChats(state).filter(chat => (chat.unread_count || 0) > 0);

export const selectRecentChats = (state: RootState, limit: number = 10): Chat[] => 
  selectChats(state)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, limit);

// Message-specific selectors
export const selectUnreadMessages = (state: RootState, chatId: string): Message[] => 
  selectChatMessages(state, chatId).filter(message => !message.is_read);

export const selectMessageById = (state: RootState, chatId: string, messageId: string): Message | undefined => 
  selectChatMessages(state, chatId).find(message => message.id === messageId);

export const selectLastMessage = (state: RootState, chatId: string): Message | undefined => {
  const messages = selectChatMessages(state, chatId);
  return messages.length > 0 ? messages[messages.length - 1] : undefined;
};

export const selectSystemMessages = (state: RootState, chatId: string): Message[] => 
  selectChatMessages(state, chatId).filter(message => message.is_system);

export const selectUserMessages = (state: RootState, chatId: string): Message[] => 
  selectChatMessages(state, chatId).filter(message => !message.is_system);

// Conversation info selector (for UI components)
export const selectConversationInfo = (state: RootState, chatId: string): ConversationInfo | null => {
  const chat = selectChatById(state, chatId);
  if (!chat) return null;

  const lastMessage = selectLastMessage(state, chatId);
  const otherParticipant = chat.participants?.find(p => p.user_id !== 'current_user_id'); // Replace with actual current user ID
  
  return {
    id: chat.id,
    name: otherParticipant?.user?.profile?.name || 'Unknown User',
    avatar: otherParticipant?.user?.profile?.avatar_key || '',
    itemName: chat.listing?.title || 'Unknown Item',
    itemImage: chat.listing?.primary_image_url || '',
    originalPrice: chat.listing?.price || 0,
    currentOffer: undefined, // This would come from offers data
    isOwnOffer: undefined, // This would come from offers data
    lastMessage: lastMessage?.body,
    lastMessageTime: lastMessage?.created_at,
    unreadCount: chat.unread_count || 0,
    isOnline: false // This would come from presence system
  };
};

// Subscription selectors
export const selectIsSubscribedToChat = (state: RootState, chatId: string): boolean => 
  selectChatSubscriptions(state)[chatId] || false;

export const selectIsUserTyping = (state: RootState, chatId: string): boolean => 
  selectTypingUsers(state)[chatId] || false;

// Utility selectors
export const selectChatStats = (state: RootState) => {
  const chats = selectChats(state);
  const unreadChats = selectChatsWithUnreadMessages(state);
  
  return {
    totalChats: chats.length,
    unreadChats: unreadChats.length,
    totalUnreadMessages: selectTotalUnreadMessages(state),
    activeChats: chats.filter(chat => chat.updated_at).length,
    recentChats: selectRecentChats(state, 5).length,
  };
};
