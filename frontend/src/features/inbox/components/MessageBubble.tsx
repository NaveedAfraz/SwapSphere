import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Interactions } from '@/src/constants/theme';

interface MessageBubbleProps {
  message: string;
  timestamp: string;
  isOwn: boolean;
  senderAvatar?: string;
  senderName?: string;
}

export default function MessageBubble({ 
  message, 
  timestamp, 
  isOwn, 
  senderAvatar, 
  senderName 
}: MessageBubbleProps) {
  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      {!isOwn && (
        <View style={styles.senderInfo}>
          {senderAvatar && <Image source={{ uri: senderAvatar }} style={styles.avatar} />}
          <Text style={styles.senderName}>{senderName}</Text>
        </View>
      )}
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText]}>
          {message}
        </Text>
        <Text style={[styles.timestamp, isOwn ? styles.ownTimestamp : styles.otherTimestamp]}>
          {timestamp}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
  },
  ownBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: '#FFFFFF',
  },
  otherText: {
    color: '#111827',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: '#9CA3AF',
    textAlign: 'left',
  },
});
