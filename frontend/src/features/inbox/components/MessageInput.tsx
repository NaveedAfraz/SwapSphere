import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Interactions } from '@/src/constants/theme';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
}

export default function MessageInput({ 
  onSendMessage, 
  placeholder = "Type a message..." 
}: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, message.trim() ? styles.sendButtonActive : styles.sendButtonInactive]}
          onPress={handleSend}
          disabled={!message.trim()}
          activeOpacity={Interactions.buttonOpacity}
        >
          <Ionicons
            name="send"
            size={20}
            color={message.trim() ? '#FFFFFF' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#3B82F6',
  },
  sendButtonInactive: {
    backgroundColor: '#F3F4F6',
  },
});
