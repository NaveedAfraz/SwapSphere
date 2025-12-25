import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Modal,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useTheme } from '@/src/contexts/ThemeContext';
import { ThemedText } from '@/src/components/ThemedView';
import { Interactions } from '@/src/constants/theme';
import { UserListingForSwap, SwapOfferPayload } from '../types/swapOffer';
import { fetchUserListingsForSwapThunk } from '@/src/features/listing/listingThunks';
import { createSwapOfferThunk } from '@/src/features/offer/offerThunks';
import type { CreateOfferPayload } from '@/src/features/offer/types/offer';

interface SwapOfferModalProps {
  visible: boolean;
  onClose: () => void;
  userListingId?: string; // To exclude current listing from swap options
  listingId: string; // Target listing ID for the offer
  buyerId: string; // Buyer user ID
  initialData?: {
    type: 'swap' | 'hybrid';
    cashAmount?: number;
    swapItems: UserListingForSwap[];
  };
}

export default function SwapOfferModal({
  visible,
  onClose,
  userListingId,
  listingId,
  buyerId,
  initialData,
}: SwapOfferModalProps) {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const [offerType, setOfferType] = useState<'swap' | 'hybrid'>('swap');
  const [cashAmount, setCashAmount] = useState('');
  const [userListings, setUserListings] = useState<UserListingForSwap[]>([]);
  const [selectedItems, setSelectedItems] = useState<UserListingForSwap[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize with initial data if provided
  useEffect(() => {
    if (initialData) {
      setOfferType(initialData.type);
      setCashAmount(initialData.cashAmount?.toString() || '');
      setSelectedItems(initialData.swapItems || []);
    } else {
      setOfferType('swap');
      setCashAmount('');
      setSelectedItems([]);
    }
  }, [initialData, visible]);

  // Fetch user's listings for swap
  useEffect(() => {
    if (visible) {
      fetchUserListings();
    }
  }, [visible]);

  const fetchUserListings = async () => {
    setLoading(true);
    try {
      const result = await dispatch(fetchUserListingsForSwapThunk({ 
        excludeListingId: userListingId 
      }) as any);
      
      if (fetchUserListingsForSwapThunk.fulfilled.match(result)) {
        setUserListings(result.payload);
      } else {
        throw new Error(result.payload || 'Failed to fetch listings');
      }
    } catch (error: any) {
      console.error('Error fetching user listings:', error);
      Alert.alert('Error', error.message || 'Failed to load your listings');
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (item: UserListingForSwap) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id);
    if (isSelected) {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleSubmit = async () => {
    console.log('[SWAP MODAL] handleSubmit called', {
      offerType,
      cashAmount,
      selectedItemsCount: selectedItems.length,
      listingId,
      buyerId
    });

    if (selectedItems.length === 0) {
      console.log('[SWAP MODAL] Validation failed: No items selected');
      Alert.alert('Error', 'Please select at least one item to swap');
      return;
    }

    if (offerType === 'hybrid' && (!cashAmount || parseFloat(cashAmount) <= 0)) {
      console.log('[SWAP MODAL] Validation failed: Invalid hybrid cash amount', { cashAmount });
      Alert.alert('Error', 'Please enter a valid cash amount for hybrid offer');
      return;
    }

    try {
      setLoading(true);
      
      // Create swap offer using the new thunk
      const offerPayload: CreateOfferPayload = {
        listing_id: listingId,
        amount: offerType === 'hybrid' ? parseFloat(cashAmount) : 0,
        buyer_id: buyerId,
        offer_type: offerType,
        cash_amount: offerType === 'hybrid' ? parseFloat(cashAmount) : 0,
        swap_items: selectedItems.map(item => ({
          listing_id: item.id,
          title: item.title,
          image: item.primary_image_url || '',
          price: item.price,
          condition: item.condition,
          category: item.category,
        })),
      };

      console.log('[SWAP MODAL] Dispatching createSwapOfferThunk with payload:', {
        ...offerPayload,
        swap_items_count: offerPayload.swap_items?.length || 0
      });

      const result = await dispatch(createSwapOfferThunk(offerPayload) as any);
      
      console.log('[SWAP MODAL] Thunk result:', {
        fulfilled: createSwapOfferThunk.fulfilled.match(result),
        payload: result.payload
      });
      
      if (createSwapOfferThunk.fulfilled.match(result)) {
        console.log('[SWAP MODAL] Swap offer created successfully');
        Alert.alert('Success', 'Swap offer sent successfully!');
        onClose();
      } else {
        console.log('[SWAP MODAL] Swap offer creation failed:', result.payload);
        throw new Error(result.payload || 'Failed to create swap offer');
      }
    } catch (error: any) {
      console.error('[SWAP MODAL] Error creating swap offer:', error);
      Alert.alert('Error', error.message || 'Failed to send swap offer');
    } finally {
      setLoading(false);
    }
  };

  const renderListingItem = ({ item }: { item: UserListingForSwap }) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.listingItem,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isSelected ? theme.colors.accent : theme.colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => toggleItemSelection(item)}
        activeOpacity={Interactions.buttonOpacity}
      >
        <Image
          source={{ uri: item.primary_image_url || 'https://via.placeholder.com/60' }}
          style={styles.itemImage}
        />
        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, { color: theme.colors.primary }]} numberOfLines={2}>
            {item.title}
          </Text>
          <ThemedText style={styles.itemPrice}>
            ${item.price}
          </ThemedText>
          <ThemedText style={styles.itemCondition}>
            {item.condition}
          </ThemedText>
        </View>
        <View style={styles.checkboxContainer}>
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={24}
            color={isSelected ? theme.colors.accent : theme.colors.secondary}
          />
        </View>
      </TouchableOpacity>
    );
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
          <ThemedText style={styles.headerTitle}>Make Swap Offer</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Offer Type Selection */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Offer Type</ThemedText>
            <View style={styles.offerTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.offerTypeButton,
                  {
                    backgroundColor: offerType === 'swap' ? theme.colors.accent : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => setOfferType('swap')}
              >
                <Ionicons
                  name="swap-horizontal"
                  size={20}
                  color={offerType === 'swap' ? theme.colors.surface : theme.colors.primary}
                />
                <ThemedText
                  style={[
                    styles.offerTypeText,
                    { color: offerType === 'swap' ? theme.colors.surface : theme.colors.primary },
                  ]}
                >
                  Swap Only
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.offerTypeButton,
                  {
                    backgroundColor: offerType === 'hybrid' ? theme.colors.accent : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => setOfferType('hybrid')}
              >
                <Ionicons
                  name="add-circle"
                  size={20}
                  color={offerType === 'hybrid' ? theme.colors.surface : theme.colors.primary}
                />
                <ThemedText
                  style={[
                    styles.offerTypeText,
                    { color: offerType === 'hybrid' ? theme.colors.surface : theme.colors.primary },
                  ]}
                >
                  Swap + Cash
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cash Amount (for hybrid offers) */}
          {offerType === 'hybrid' && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Additional Cash</ThemedText>
              <View style={styles.cashInputContainer}>
                <ThemedText style={styles.currencySymbol}>$</ThemedText>
                <TextInput
                  style={[
                    styles.cashInput,
                    {
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.primary,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  value={cashAmount}
                  onChangeText={setCashAmount}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.secondary}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {/* Select Items to Swap */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Select Items to Swap ({selectedItems.length})
            </ThemedText>
            {loading ? (
              <ThemedText style={styles.loadingText}>Loading your listings...</ThemedText>
            ) : userListings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={48} color={theme.colors.secondary} />
                <ThemedText style={styles.emptyText}>No available items to swap</ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  List some items to start making swap offers
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={userListings}
                renderItem={renderListingItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                style={styles.listingsList}
              />
            )}
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.colors.surface }]}
            onPress={onClose}
            activeOpacity={Interactions.buttonOpacity}
          >
            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: selectedItems.length > 0 ? theme.colors.accent : theme.colors.border,
              },
            ]}
            onPress={handleSubmit}
            disabled={selectedItems.length === 0}
            activeOpacity={Interactions.buttonOpacity}
          >
            <Ionicons name="send" size={18} color={theme.colors.surface} />
            <ThemedText style={styles.submitText}>
              Send {offerType === 'swap' ? 'Swap' : 'Hybrid'} Offer
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

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
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  offerTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  offerTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  offerTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cashInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    color: '#6B7280',
  },
  cashInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    borderRadius: 12,
  },
  loadingText: {
    textAlign: 'center',
    opacity: 0.6,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
    textAlign: 'center',
  },
  listingsList: {
    marginTop: 8,
  },
  listingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemCondition: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: 'capitalize',
  },
  checkboxContainer: {
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
