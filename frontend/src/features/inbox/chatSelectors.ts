import type { RootState } from '../../store';
import type { ChatState, Chat, Message, ConversationInfo } from './types/chat';

// Essential selectors only
export const selectChats = (state: RootState): Chat[] => 
  state.chat.chats || [];

export const selectCurrentChat = (state: RootState): Chat | null => 
  state.chat.currentChat;

export const selectChatMessages = (state: RootState, chatId: string): Message[] => 
  state.chat.messages[chatId] || [];

export const selectConversationInfo = (state: RootState, chatId: string): ConversationInfo | null => {
  // Prioritize currentChat when available (has pricing data)
  let chat = null;
  if (state.chat.currentChat && state.chat.currentChat.id === chatId) {
    chat = state.chat.currentChat as any;
  } else {
    // Fallback to chat list (basic data only)
    const chats = state.chat.chats || [];
    chat = chats.find(c => c.id === chatId) || null;
  }

  if (!chat) return null;

  const lastMessage = state.chat.messages[chatId]?.slice(-1)[0];
  // Get current user ID from auth state
  const currentUserId = state.auth.user?.id;
  const otherParticipant = chat.participants?.find((p: any) => p.user_id !== currentUserId) || chat.participants?.[0];

  // Attempt to read profile from participant.user or participant.user.profile
  const otherUserProfile = (otherParticipant && (otherParticipant.user?.profile || otherParticipant.user?.profile)) || null;

  // For counter offers, the original buyer still owns their offer
  const isCounterOffer = chat.user_offer?.status === 'countered';
  
  // Check if current user owns this offer (buyer always owns their offer, even if countered)
  const isOwnOffer = chat.user_offer?.buyer_id === currentUserId;

  return {
    id: chat.id,
    name: chat.other_user_name,
    avatar: chat.other_user_avatar,
    itemName: chat.listing_title,
    itemImage: chat.listing_image,
    originalPrice: chat.listing_price,
    currentOffer: chat.user_offer?.price ? parseFloat(chat.user_offer.price) : undefined,
    isOwnOffer: isOwnOffer,
    offerStatus: chat.user_offer?.status,
    offerId: chat.user_offer?.id, // Add offer ID for updates
    lastMessage: lastMessage?.body,
    lastMessageTime: lastMessage?.created_at,
    unreadCount: chat.unread_count,
    isOnline: false // This would come from presence system
  };
};

// Derived selectors
export const selectIsChatLoading = (state: RootState): boolean => 
  state.chat.status === 'loading';

export const selectUnreadChatsCount = (state: RootState): number => 
  (state.chat.chats || []).filter(chat => (chat.unread_count || 0) > 0).length;
