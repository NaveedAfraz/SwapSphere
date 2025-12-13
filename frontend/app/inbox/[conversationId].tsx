import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ChatScreen from '@/src/features/inbox/components/ChatScreen';

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();

  // Mock user and item data - in a real app, this would come from your API/context
  const mockConversations = {
    '1': {
      name: 'Sarah Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      itemName: 'iPhone 13 Pro',
      itemImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
      originalPrice: 899,
      currentOffer: 150,
      isOwnOffer: false,
    },
    '2': {
      name: 'Mike Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
      itemName: 'MacBook Air M1',
      itemImage: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
      originalPrice: 799,
      currentOffer: 650,
      isOwnOffer: true,
    },
    '3': {
      name: 'Emily Davis',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
      itemName: 'AirPods Pro',
      itemImage: 'https://images.unsplash.com/photo-1606210947703-9d1e5d3d8b5a?w=400',
      originalPrice: 179,
      currentOffer: 160,
      isOwnOffer: false,
    },
    '4': {
      name: 'Alex Thompson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      itemName: 'Gaming PC Setup',
      itemImage: 'https://images.unsplash.com/photo-1597872200968-1b80694e5c71?w=400',
      originalPrice: 1200,
      currentOffer: 950,
      isOwnOffer: true,
    },
    '5': {
      name: 'Lisa Park',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
      itemName: 'Vintage Camera',
      itemImage: 'https://images.unsplash.com/photo-1526170379881-4e43600e7a6c?w=400',
      originalPrice: 450,
      currentOffer: 400,
      isOwnOffer: false,
    },
  };

  const conversation = mockConversations[conversationId as keyof typeof mockConversations] || {
    name: 'Unknown User',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
    itemName: 'Unknown Item',
    itemImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    originalPrice: 0,
    currentOffer: 0,
    isOwnOffer: false,
  };

  return (
    <ChatScreen
      conversationId={conversationId as string}
      userName={conversation.name}
      userAvatar={conversation.avatar}
      itemName={conversation.itemName}
      itemImage={conversation.itemImage}
      originalPrice={conversation.originalPrice}
      currentOffer={conversation.currentOffer}
      isOwnOffer={conversation.isOwnOffer}
    />
  );
}
