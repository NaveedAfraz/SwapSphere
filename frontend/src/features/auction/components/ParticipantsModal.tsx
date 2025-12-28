import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/contexts/ThemeContext';
import { ThemedText } from '@/src/components/ThemedView';
import DefaultAvatar from '@/src/features/dealRooms/components/DefaultAvatar';
import { AuctionParticipant } from '../auctionSlice';

interface ParticipantsModalProps {
  visible: boolean;
  onClose: () => void;
  participants: AuctionParticipant[];
  activeUserId?: string;
}

export const ParticipantsModal: React.FC<ParticipantsModalProps> = ({
  visible,
  onClose,
  participants,
  activeUserId,
}) => {
  const { theme } = useTheme();
  const slideAnimation = useRef(new Animated.Value(0)).current;

  const openModal = () => {
    // Slide in the modal
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    // Slide out the modal
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  React.useEffect(() => {
    if (visible) {
      openModal();
    } else {
      // Reset animation when modal is closed
      slideAnimation.setValue(0);
    }
  }, [visible]);

  if (!participants || participants.length === 0) {
    return null;
  }


  // Group participants by role and remove duplicates
  const uniqueParticipants = participants; // .filter((participant, index, self) =>
  //   index === self.findIndex((p) => p.userId === participant.userId)
  // );


  const sellers = uniqueParticipants.filter(p => p.role === 'seller');
  const buyers = uniqueParticipants.filter(p => p.role === 'buyer');


  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={closeModal}
    >
      <Animated.View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          onPress={closeModal}
          activeOpacity={1}
        />
        <Animated.View 
          style={[
            styles.participantsModal,
            {
              backgroundColor: theme.colors.surface,
              shadowColor: '#e01c1c020',
            }
          ]}
        >
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
            <View style={styles.modalHeaderContent}>
              <Ionicons name="people" size={24} color={theme.colors.primary} />
              <ThemedText style={styles.modalTitle}>Participants ({uniqueParticipants.length})</ThemedText>
            </View>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.secondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Sellers */}
            {sellers.length > 0 && (
              <View style={styles.participantGroup}>
                <ThemedText style={[styles.participantGroupTitle, { color: theme.colors.secondary }]}>Seller</ThemedText>
                {sellers.map((seller) => (
                  <View key={seller.userId} style={[styles.participantItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <View style={styles.participantAvatar}>
                      {seller.avatarUrl ? (
                        <Image source={{ uri: seller.avatarUrl }} style={styles.avatarImage} />
                      ) : (
                        <DefaultAvatar name={seller.name} size={40} />
                      )}
                    </View>
                    <View style={styles.participantInfo}>
                      <ThemedText style={styles.participantName}>{seller.name}</ThemedText>
                      <ThemedText style={[styles.participantRole, { color: theme.colors.secondary }]}>Seller</ThemedText>
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: theme.colors.accent }]}>
                      <Ionicons name="storefront" size={12} color="white" />
                      <ThemedText style={styles.roleBadgeText}>Seller</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Buyers */}
            {buyers.length > 0 && (
              <View style={styles.participantGroup}>
                <ThemedText style={[styles.participantGroupTitle, { color: theme.colors.secondary }]}>Buyers ({buyers.length})</ThemedText>
                {buyers.map((buyer) => (
                  <View key={buyer.userId} style={[styles.participantItem, { 
                    backgroundColor: theme.colors.surface, 
                    borderColor: buyer.userId === activeUserId ? theme.colors.accent : theme.colors.border,
                    borderWidth: buyer.userId === activeUserId ? 2 : 1
                  }]}>
                    <View style={styles.participantAvatar}>
                      {buyer.avatarUrl ? (
                        <Image source={{ uri: buyer.avatarUrl }} style={styles.avatarImage} />
                      ) : (
                        <DefaultAvatar name={buyer.name} size={40} />
                      )}
                    </View>
                    <View style={styles.participantInfo}>
                      <ThemedText style={styles.participantName}>{buyer.name}</ThemedText>
                      <ThemedText style={[styles.participantRole, { color: theme.colors.secondary }]}>Buyer</ThemedText>
                    </View>
                    {buyer.userId === activeUserId && (
                      <View style={[styles.roleBadge, { backgroundColor: theme.colors.accent }]}>
                        <Ionicons name="person" size={12} color="white" />
                        <ThemedText style={styles.roleBadgeText}>You</ThemedText>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  participantsModal: {
    width: '80%',
    height: '100%',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  participantGroup: {
    marginBottom: 16,
  },
  participantGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  participantAvatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
  },
  participantRole: {
    fontSize: 14,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
