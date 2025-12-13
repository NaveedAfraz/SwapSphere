import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Interactions } from '@/src/constants/theme';

interface Conversation {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  listing: string;
  listingImage: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  onPressConversation: (id: number) => void;
}

export default function ConversationList({ conversations, onPressConversation }: ConversationListProps) {
  return (
    <View style={styles.container}>
      {conversations.map(conversation => (
        <TouchableOpacity 
          key={conversation.id} 
          style={styles.conversationItem}
          onPress={() => onPressConversation(conversation.id)}
          activeOpacity={Interactions.activeOpacity}
        >
          <Image source={{ uri: conversation.avatar }} style={styles.avatar} />
          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Text style={styles.name}>{conversation.name}</Text>
              <Text style={styles.time}>{conversation.time}</Text>
            </View>
            <View style={styles.listingRow}>
              <Image source={{ uri: conversation.listingImage }} style={styles.listingImage} />
              <Text style={styles.listingName}>{conversation.listing}</Text>
            </View>
            <Text style={styles.lastMessage} numberOfLines={2}>
              {conversation.lastMessage}
            </Text>
          </View>
          {conversation.unread > 0 && (
            <View style={styles.unreadIndicator}>
              <Text style={styles.unreadCount}>{conversation.unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  time: {
    fontSize: 12,
    color: '#6B7280',
  },
  listingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  listingImage: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 6,
  },
  listingName: {
    fontSize: 14,
    color: '#6B7280',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  unreadIndicator: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
