import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { Interactions } from '@/src/constants/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { ThemedText } from '@/src/components/GlobalThemeComponents';
import { useAuth } from '@/src/hooks/useAuth';
import { updateOfferThunk, counterOfferThunk } from '@/src/features/offer/offerThunks';
import { fetchChatByIdThunk } from '@/src/features/inbox/chatThunks';
import SwapOfferModal from '@/src/features/dealRooms/components/SwapOfferModal';
import { DealOffer, SwapOfferPayload } from '@/src/features/dealRooms/types/swapOffer';

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
  buyerId?: string; // Add buyer ID for proper ownership calculation
  sellerId?: string; // Add seller ID for proper ownership calculation
  lastOfferUpdatedBy?: string; // Track who last updated the offer
  onOfferUpdate?: (newOffer: number) => void;
  onAcceptOffer?: () => void;
  currentDealOffer?: DealOffer; // Add swap offer support
  listingId?: string; // For swap modal exclusion
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
  buyerId,
  sellerId,
  lastOfferUpdatedBy,
  onOfferUpdate,
  onAcceptOffer,
  currentDealOffer,
  listingId,
}: OfferNegotiationProps) {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { user } = useAuth();

  // Debug logging
  console.log('[OFFER NEGOTIATION] Props received:', {
    currentOffer,
    currentDealOffer,
    offerId,
    offerStatus
  });

  // Calculate if this is the user's own offer based on who made the current offer
  // This should be recalculated based on the current offer data
  const calculatedIsOwnOffer = useMemo(() => {
    if (!user?.id) return false;
    
    // Check if current deal offer exists and who made it
    if (currentDealOffer) {
      console.log('[OFFER NEGOTIATION] Checking offer ownership:', {
        userId: user.id,
        offerId: currentDealOffer.id,
        metadata: currentDealOffer.metadata,
        buyerId: currentDealOffer.buyerId,
        sellerId: currentDealOffer.sellerId
      });
      
      // First check if metadata tells us who made this offer
      if (currentDealOffer.metadata?.made_by_user_id) {
        const isOwn = currentDealOffer.metadata.made_by_user_id === user.id;
        console.log('[OFFER NEGOTIATION] Made by user ID check:', isOwn);
        return isOwn;
      }
      
      // Check if metadata tells us who countered this offer
      if (currentDealOffer.metadata?.countered_by_user_id) {
        const isOwn = currentDealOffer.metadata.countered_by_user_id === user.id;
        console.log('[OFFER NEGOTIATION] Countered by user ID check:', isOwn);
        return isOwn;
      }
      
      // Check if metadata tells us who last updated this offer
      if (currentDealOffer.metadata?.updated_by_user_id) {
        const isOwn = currentDealOffer.metadata.updated_by_user_id === user.id;
        console.log('[OFFER NEGOTIATION] Updated by user ID check:', isOwn);
        return isOwn;
      }
      
      // Fallback: If the current user is the buyer who made this offer
      if (currentDealOffer.buyerId === user.id) {
        console.log('[OFFER NEGOTIATION] Buyer ID fallback check: true');
        return true;
      }
      // If the current user is the seller who made this offer
      if (currentDealOffer.sellerId && currentDealOffer.sellerId === user.id) {
        console.log('[OFFER NEGOTIATION] Seller ID fallback check: true');
        return true;
      }
    }
    
    // If we have explicit data about who last updated the offer, use that
    if (lastOfferUpdatedBy) {
      const isOwn = lastOfferUpdatedBy === user.id;
      console.log('[OFFER NEGOTIATION] Last offer updated by check:', isOwn);
      return isOwn;
    }
    
    // Fallback to the prop if available
    console.log('[OFFER NEGOTIATION] Using isOwnOffer prop fallback:', isOwnOffer);
    return isOwnOffer || false;
  }, [user?.id, currentDealOffer, isOwnOffer, lastOfferUpdatedBy]);

  const [isEditing, setIsEditing] = useState(false);
  const [tempOffer, setTempOffer] = useState((currentOffer || 0).toString());
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showOfferMenu, setShowOfferMenu] = useState(false);

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
    offerMenu: {
      position: 'absolute',
      top: 40,
      right: 0,
      borderRadius: 8,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
      zIndex: 1000,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    menuText: {
      fontSize: 14,
      fontWeight: '500',
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
    swapOfferDisplay: {
      marginTop: 8,
      paddingVertical: 8,
    },
    swapItemsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 4,
    },
    swapItem: {
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      minWidth: 80,
      alignItems: 'center',
    },
    swapItemTitle: {
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
      color: '#111827',
    },
    swapItemPrice: {
      fontSize: 10,
      color: '#6B7280',
      marginTop: 2,
    },
    cashAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: '#10B981',
      marginTop: 4,
    },
  });

  const handleEditOffer = () => {
    setIsEditing(true);
    setTempOffer((currentOffer || 0).toString());
  };

  const handleSaveOffer = () => {
    const newOffer = parseFloat(tempOffer);
    
    console.log('[OFFER] Save offer clicked - New offer:', newOffer, 'Current offer:', currentOffer, 'Offer ID:', offerId);
    console.log('[OFFER] User ID:', user?.id, 'Buyer ID:', buyerId, 'Seller ID:', sellerId);
    console.log('[OFFER] Is own offer:', calculatedIsOwnOffer, 'Has onOfferUpdate callback:', !!onOfferUpdate);
    
    if (!isNaN(newOffer) && newOffer > 0) {
      // Always call parent handler if available
      if (onOfferUpdate) {
        console.log('[OFFER] Calling onOfferUpdate callback with new offer:', newOffer);
        onOfferUpdate(newOffer); 
      } else {
        console.log('[OFFER] No onOfferUpdate callback, using direct thunk dispatch');
        // Fallback to direct thunk dispatch only if no handler provided
        if (offerId) {
          if (calculatedIsOwnOffer) {
            // User is updating their own offer
            console.log('[OFFER] Updating own offer via updateOfferThunk');
            dispatch(updateOfferThunk({
              id: offerId,
              data: { 
                counter_amount: newOffer,
                offer_type: 'cash',
                cash_amount: newOffer,
                swap_items: []
              }
            }) as any).then((result: any) => {
              console.log('[OFFER] Update offer result:', result);
              // Refresh chat data to get updated offer information
              const chatIdToRefresh = actualChatId || conversationId;
              if (chatIdToRefresh) {
                console.log('[OFFER] Refreshing chat data for ID:', chatIdToRefresh);
                dispatch(fetchChatByIdThunk(chatIdToRefresh) as any);
              }
            }).catch((error: any) => {
              console.error("UPDATE OFFER FAILED:", error);
            });
          } else {
            // User is making a counter offer to someone else's offer
            console.log('[OFFER] Making counter offer via counterOfferThunk');
            dispatch(counterOfferThunk({
              offer_id: offerId,
              counter_amount: newOffer,
            }) as any).then((result: any) => {
              console.log('[OFFER] Counter offer result:', result);
              // Refresh chat data to get updated offer information
              const chatIdToRefresh = actualChatId || conversationId;
              if (chatIdToRefresh) {
                console.log('[OFFER] Refreshing chat data for ID:', chatIdToRefresh);
                dispatch(fetchChatByIdThunk(chatIdToRefresh) as any);
              }
            }).catch((error: any) => {
              console.error("COUNTER OFFER FAILED:", error);
            });
          }
        } else {
          console.error('[OFFER] No offer ID available for update');
        }
      }
      setIsEditing(false);
    } else {
      console.error('[OFFER] Invalid offer amount:', newOffer);
    }
  };

  const handleSwapOffer = () => {
    setShowSwapModal(true);
    setShowOfferMenu(false);
  };

  const renderSwapOfferDisplay = () => {
    if (!currentDealOffer || currentDealOffer.type === 'cash') return null;

    return (
      <View style={styles.swapOfferDisplay}>
        <View style={styles.swapItemsContainer}>
          {currentDealOffer.swapItems.map((item, index) => (
            <View key={index} style={styles.swapItem}>
              <Text style={styles.swapItemTitle}>{item.title}</Text>
              <Text style={styles.swapItemPrice}>${item.price}</Text>
            </View>
          ))}
        </View>
        {currentDealOffer.cashAmount > 0 && (
          <Text style={styles.cashAmount}>+ ${currentDealOffer.cashAmount}</Text>
        )}
      </View>
    );
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
            {calculatedIsOwnOffer ? 'Your Offer' : 'Their Offer'}
          </ThemedText>
          {!isEditing && offerStatus !== 'accepted' && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowOfferMenu(!showOfferMenu)}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Ionicons name="ellipsis-horizontal" size={16} color={theme.colors.accent} />
            </TouchableOpacity>
          )}
        </View>

        {/* Offer Menu */}
        {showOfferMenu && (
          <View style={[styles.offerMenu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleEditOffer}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Ionicons name="cash-outline" size={16} color={theme.colors.primary} />
              <ThemedText style={styles.menuText}>Cash Offer</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSwapOffer}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Ionicons name="swap-horizontal" size={16} color={theme.colors.primary} />
              <ThemedText style={styles.menuText}>Swap / Hybrid</ThemedText>
            </TouchableOpacity>
          </View>
        )}

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
                <ThemedText type="caption" style={[styles.saveText, { color: theme.colors.background }]}>Update</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.offerDisplay}>
            <View style={styles.offerInfo}>
              <ThemedText type="body" style={styles.offerAmount}>
                {currentDealOffer && currentDealOffer.type !== 'cash' ? (
                  // Show hybrid/swap display if it's not a cash offer
                  currentDealOffer.type === 'swap' ? (
                    `Swap Offer (${currentDealOffer.swapItems?.length || 0} items)`
                  ) : currentDealOffer.type === 'hybrid' ? (
                    `Hybrid: $${currentDealOffer.cashAmount} + ${currentDealOffer.swapItems?.length || 0} items`
                  ) : (
                    'Swap Offer'
                  )
                ) : (
                  // For cash offers or when currentDealOffer is cash type, show currentOffer
                  currentOffer !== undefined ? `$${currentOffer}` : "No offer yet"
                )}
              </ThemedText>
              {renderSwapOfferDisplay()}
              {offerStatus && (
                <ThemedText type="caption" style={[
                  styles.statusText, 
                  { 
                    color: offerStatus === 'accepted' ? '#10B981' : 
                           offerStatus === 'countered' ? '#F59E0B' : 
                           offerStatus === 'pending' ? '#6B7280' : 
                           offerStatus === 'delivered' ? '#3B82F6' :
                           offerStatus === 'completed' ? '#10B981' :
                           offerStatus === 'shipped' ? '#F59E0B' : '#6B7280'
                  }
                ]}>
                  {offerStatus === 'accepted' ? 'Accepted' :
                   offerStatus === 'delivered' ? 'Delivered' :
                   offerStatus === 'completed' ? 'Completed' :
                   offerStatus === 'shipped' ? 'Shipped' :
                   offerStatus.charAt(0).toUpperCase() + offerStatus.slice(1)}
                </ThemedText>
              )}
            </View>
            {(() => {
              console.log('[OFFER NEGOTIATION] Accept button check:', {
                calculatedIsOwnOffer,
                onAcceptOffer: !!onAcceptOffer,
                offerStatus,
                shouldShow: !calculatedIsOwnOffer && onAcceptOffer
              });
              return null;
            })()}
            {!calculatedIsOwnOffer && onAcceptOffer && (
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

      {/* Swap Offer Modal */}
      <SwapOfferModal
        visible={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        userListingId={listingId}
        listingId={listingId || ''}
        buyerId={user?.id || ''}
      />
    </View>
  );
}
