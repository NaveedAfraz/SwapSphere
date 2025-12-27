import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../../hooks/redux';
import { useTheme } from '@/src/contexts/ThemeContext';
import { ThemedText } from '@/src/components/ThemedView';
import { createAuction } from '../auctionThunks';
import { Ionicons } from '@expo/vector-icons';
import DefaultAvatar from '../../dealRooms/components/DefaultAvatar';

interface StartAuctionModalProps {
  visible: boolean;
  onClose: () => void;
  dealRoomId: string;
  listingId: string;
  sellerId: string;
  currentOffer?: number;
  availableBuyers?: Array<{
    user_id: string;
    name: string;
    avatar?: string;
    last_offer_amount?: number;
    commitment_score?: number;
  }>;
}

const StartAuctionModal: React.FC<StartAuctionModalProps> = ({
  visible,
  onClose,
  dealRoomId,
  listingId,
  sellerId,
  currentOffer,
  availableBuyers = [],
}) => {
  const dispatch = useAppDispatch();
  const { theme } = useTheme();
  const { isCreating } = useAppSelector((state) => state.auction);

  const [startPrice, setStartPrice] = useState(currentOffer?.toString() || '');
  const [minimumIncrement, setMinimumIncrement] = useState('100');
  const [duration, setDuration] = useState('30');
  const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]);

  const durationOptions = [
    { label: '15 minutes', value: '15' },
    { label: '30 minutes', value: '30' },
    { label: '60 minutes', value: '60' },
  ];

  useEffect(() => {
    if (availableBuyers.length > 0) {
      setSelectedBuyers(availableBuyers.map(buyer => buyer.user_id));
    }
  }, [availableBuyers]);

  const handleBuyerToggle = (buyerId: string) => {
    setSelectedBuyers(prev => 
      prev.includes(buyerId)
        ? prev.filter(id => id !== buyerId)
        : [...prev, buyerId]
    );
  };

  const handleStartAuction = () => {
    // Validation
    if (!startPrice || parseFloat(startPrice) <= 0) {
      Alert.alert('Error', 'Please enter a valid starting price');
      return;
    }

    if (!minimumIncrement || parseFloat(minimumIncrement) <= 0) {
      Alert.alert('Error', 'Please enter a valid minimum increment');
      return;
    }

    if (selectedBuyers.length === 0) {
      Alert.alert('Error', 'Please select at least one buyer to invite');
      return;
    }

    const auctionData = {
      directDealId: dealRoomId,
      startPrice: parseFloat(startPrice),
      minIncrement: parseFloat(minimumIncrement),
      durationMinutes: parseInt(duration),
      inviteeIds: selectedBuyers,
    };

    dispatch(createAuction(auctionData))
      .unwrap()
      .then((result) => {
        Alert.alert('Success', 'Auction created successfully!');
        onClose();
        // Navigate to auction deal room
        // This will be handled by the parent component
      })
      .catch((error) => {
        Alert.alert('Error', 'Failed to create auction. Please try again.');
      });
  };

  const getCommitmentBadgeColor = (score?: number) => {
    if (!score) return theme.colors.border;
    if (score >= 90) return '#10B981'; // Green
    if (score >= 70) return '#3B82F6'; // Blue
    if (score >= 50) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  const getCommitmentBadgeText = (score?: number) => {
    if (!score) return 'New';
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Start Auction</ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Listing Info */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <ThemedText style={styles.sectionTitle}>Auction Details</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Starting Price</ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.primary,
                  },
                ]}
                value={startPrice}
                onChangeText={setStartPrice}
                placeholder="0.00"
                placeholderTextColor={theme.colors.secondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Minimum Increment</ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.primary,
                  },
                ]}
                value={minimumIncrement}
                onChangeText={setMinimumIncrement}
                placeholder="0.00"
                placeholderTextColor={theme.colors.secondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Duration</ThemedText>
              <View style={styles.durationOptions}>
                {durationOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.durationOption,
                      {
                        backgroundColor: duration === option.value
                          ? theme.colors.accent
                          : theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => setDuration(option.value)}
                  >
                    <ThemedText
                      style={[
                        styles.durationOptionText,
                        {
                          color: duration === option.value
                            ? theme.colors.surface
                            : theme.colors.primary,
                        },
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Invite Buyers */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <ThemedText style={styles.sectionTitle}>Invite Buyers</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Select buyers to participate in this auction
            </ThemedText>

            {availableBuyers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={theme.colors.secondary} />
                <ThemedText style={styles.emptyText}>
                  No buyers available to invite
                </ThemedText>
              </View>
            ) : (
              <View style={styles.buyersList}>
                {availableBuyers.map((buyer) => (
                  <TouchableOpacity
                    key={buyer.user_id}
                    style={[
                      styles.buyerItem,
                      {
                        backgroundColor: selectedBuyers.includes(buyer.user_id)
                          ? `${theme.colors.accent}20`
                          : theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => handleBuyerToggle(buyer.user_id)}
                  >
                    <View style={styles.buyerInfo}>
                      {buyer.avatar ? (
                        <Image source={{ uri: buyer.avatar }} style={styles.buyerAvatar} />
                      ) : (
                        <DefaultAvatar size={40} name={buyer.name} />
                      )}
                      <View style={styles.buyerDetails}>
                        <ThemedText style={styles.buyerName}>{buyer.name}</ThemedText>
                        {buyer.last_offer_amount && (
                          <ThemedText style={styles.lastOffer}>
                            Last offer: ${buyer.last_offer_amount}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                    <View style={styles.buyerRight}>
                      <View
                        style={[
                          styles.commitmentBadge,
                          { backgroundColor: getCommitmentBadgeColor(buyer.commitment_score) },
                        ]}
                      >
                        <ThemedText style={styles.commitmentText}>
                          {getCommitmentBadgeText(buyer.commitment_score)}
                        </ThemedText>
                      </View>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: selectedBuyers.includes(buyer.user_id)
                              ? theme.colors.accent
                              : theme.colors.background,
                            borderColor: theme.colors.border,
                          },
                        ]}
                      >
                        {selectedBuyers.includes(buyer.user_id) && (
                          <Ionicons name="checkmark" size={16} color={theme.colors.surface} />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={[styles.actions, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { borderColor: theme.colors.border }]}
            onPress={onClose}
            disabled={isCreating}
          >
            <ThemedText style={[styles.buttonText, { color: theme.colors.primary }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.startButton,
              {
                backgroundColor: isCreating ? theme.colors.border : theme.colors.accent,
              },
            ]}
            onPress={handleStartAuction}
            disabled={isCreating}
          >
            <ThemedText style={[styles.buttonText, { color: theme.colors.surface }]}>
              {isCreating ? 'Creating...' : 'Start Auction'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  durationOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  durationOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  buyersList: {
    gap: 12,
  },
  buyerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  buyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  buyerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  buyerDetails: {
    flex: 1,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  lastOffer: {
    fontSize: 12,
    marginTop: 2,
  },
  buyerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  commitmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  commitmentText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  startButton: {
    // backgroundColor will be set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StartAuctionModal;
