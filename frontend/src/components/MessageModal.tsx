import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { ThemedText } from '@/src/components/GlobalThemeComponents';

interface MessageModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  buttonText?: string;
  type?: 'error' | 'success' | 'info';
  onConfirm?: () => void;
  confirmText?: string;
  showCancel?: boolean;
}

export function MessageModal({ 
  visible, 
  title, 
  message, 
  onClose, 
  buttonText = "OK",
  type = 'info',
  onConfirm,
  confirmText = "Confirm",
  showCancel = false
}: MessageModalProps) {
  const { theme } = useTheme();

  const getButtonColor = () => {
    switch (type) {
      case 'error':
        return theme.colors.error;
      case 'success':
        return theme.colors.success;
      default:
        return theme.colors.primary;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.header}>
            <ThemedText type="subheading" style={styles.title}>
              {title}
            </ThemedText>
          </View>
          
          <View style={styles.content}>
            <ThemedText type="body" style={styles.message}>
              {message}
            </ThemedText>
          </View>
          
          <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
            {showCancel && (
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton, { borderColor: theme.colors.border }]} 
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText, { color: theme.colors.secondary }]}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: getButtonColor() }]} 
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>{showCancel ? confirmText : buttonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#7f8c8d',
  },
});
