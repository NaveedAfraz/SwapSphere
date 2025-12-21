import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { Interactions } from '@/src/constants/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { ThemedText } from '@/src/components/GlobalThemeComponents';
import { updateOfferThunk, counterOfferThunk } from '@/src/features/offer/offerThunks';
import { fetchChatByIdThunk } from '@/src/features/inbox/chatThunks';

interface OfferNegotiationProps {
  itemName?: string;
  itemImage?: string;
  originalPrice?: number;
  currentOffer?: number;
  isOwnOffer?: boolean;
  offerStatus?: string;
  offerId?: string;
  conversationId?: string;
  actualChatId?: string;
  onOfferUpdate?: (newOffer: number) => void;
  onAcceptOffer?: () => void;
}

export default function OfferNegotiation({
  itemName,
  itemImage,
  originalPrice,
  currentOffer,
  isOwnOffer,
  offerStatus,
  offerId,
  conversationId,
  actualChatId,
  onOfferUpdate,
  onAcceptOffer,
}: OfferNegotiationProps) {
  const dispatch = useDispatch();
  const { theme } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [tempOffer, setTempOffer] = useState((currentOffer || 0).toString());

  const handleEditOffer = () => {
    setIsEditing(true);
    setTempOffer((currentOffer || 0).toString());
  };

  const handleSaveOffer = () => {
    const newOffer = parseFloat(tempOffer);
    
    if (!isNaN(newOffer) && newOffer > 0) {
      // Always call parent handler if available
      if (onOfferUpdate) {
        onOfferUpdate(newOffer);
      } else {
        // Fallback to direct thunk dispatch only if no handler provided
        if (offerId) {
          if (isOwnOffer) {
            // User is updating their own offer
            dispatch(updateOfferThunk({
              id: offerId,
              data: { counter_amount: newOffer }
            }) as any).then((result: any) => {
              // Refresh chat data to get updated offer information
              const chatIdToRefresh = actualChatId || conversationId;
              if (chatIdToRefresh) {
                dispatch(fetchChatByIdThunk(chatIdToRefresh) as any);
              }
            }).catch((error: any) => {
              console.error("UPDATE OFFER FAILED:", error);
            });
          } else {
            // User is making a counter offer to someone else's offer
            dispatch(counterOfferThunk({
              offer_id: offerId,
              counter_amount: newOffer,
            }) as any).then((result: any) => {
              // Refresh chat data to get updated offer information
              const chatIdToRefresh = actualChatId || conversationId;
              if (chatIdToRefresh) {
                dispatch(fetchChatByIdThunk(chatIdToRefresh) as any);
              }
            }).catch((error: any) => {
              console.error("COUNTER OFFER FAILED:", error);
            });
          }
        }
      }
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTempOffer((currentOffer || 0).toString());
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.itemInfo}>
        <ThemedText type="body" style={styles.itemName}>{itemName}</ThemedText>
        <ThemedText type="caption" style={styles.originalPrice}>Original: ${originalPrice}</ThemedText>
      </View>

      <View style={styles.offerSection}>
        <View style={styles.offerHeader}>
          <ThemedText type="body" style={styles.offerLabel}>
            {isOwnOffer ? 'Your Offer' : 'Their Offer'}
          </ThemedText>
          {!isEditing && offerStatus !== 'accepted' && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditOffer}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Ionicons name="create-outline" size={16} color={theme.colors.accent} />
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={[styles.offerInput, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.primary,
                borderColor: theme.colors.border
              }]}
              value={`$${tempOffer}`}
              onChangeText={(text) => setTempOffer(text.replace('$', ''))}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton, { backgroundColor: theme.colors.background }]}
                onPress={handleCancelEdit}
                activeOpacity={Interactions.buttonOpacity}
              >
                <ThemedText type="caption" style={styles.cancelText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSaveOffer}
                activeOpacity={Interactions.buttonOpacity}
              >
                <ThemedText type="caption" style={[styles.saveText, { color: '#FFFFFF' }]}>Update</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.offerDisplay}>
            <View style={styles.offerInfo}>
              <ThemedText type="body" style={styles.offerAmount}>
                {currentOffer !== undefined ? `$${currentOffer}` : "No offer yet"}
              </ThemedText>
              {offerStatus && (
                <ThemedText type="caption" style={[
                  styles.statusText, 
                  { 
                    color: offerStatus === 'accepted' ? '#10B981' : 
                           offerStatus === 'countered' ? '#F59E0B' : 
                           offerStatus === 'pending' ? '#6B7280' : '#6B7280'
                  }
                ]}>
                  {offerStatus.charAt(0).toUpperCase() + offerStatus.slice(1)}
                </ThemedText>
              )}
            </View>
            {!isOwnOffer && onAcceptOffer && (
              <TouchableOpacity
                style={[styles.acceptButton, { backgroundColor: theme.colors.accent }]}
                onPress={onAcceptOffer}
                activeOpacity={Interactions.buttonOpacity}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <ThemedText type="caption" style={[styles.acceptText, { color: '#FFFFFF' }]}>Accept</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemInfo: {
    marginBottom: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 14,
    opacity: 0.7,
  },
  offerSection: {
    borderTopWidth: 1,
    borderTopColor: 'transparent',
    paddingTop: 16,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  offerLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    padding: 4,
  },
  editContainer: {
    marginTop: 12,
  },
  offerInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 120,
    marginBottom: 12,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  cancelButton: {},
  saveButton: {},
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
  },
  offerDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerInfo: {
    flex: 1,
  },
  offerAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
