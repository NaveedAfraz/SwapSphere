import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/src/hooks/redux';
import { useTheme } from '@/src/contexts/ThemeContext';
import { ThemedText } from '@/src/components/ThemedView';
import { useAuth } from '@/src/hooks/useAuth';
import { fetchAuction, placeBid } from '@/src/features/auction/auctionThunks';
import { handleBidUpdate, updateTimeRemaining } from '@/src/features/auction/auctionSlice';
import { selectCurrentAuction, selectAuctionBids, selectAuctionLoading, selectAuctionPlacingBid, selectHighestBid, selectMinimumNextBid, selectAuctionTimeRemaining } from '@/src/features/auction/auctionSelectors';
import AuctionBidCard from '@/src/features/auction/components/AuctionBidCard';
import { Ionicons } from '@expo/vector-icons';
import DefaultAvatar from '@/src/features/dealRooms/components/DefaultAvatar';
import AuctionEndStateView from '@/src/features/auction/components/AuctionEndStateView';
import { joinAuctionRoom, leaveAuctionRoom, onAuctionUpdate } from '@/src/services/auctionSocket';

const AuctionDealRoomScreen = () => {
  const { id: dealRoomId } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { theme } = useTheme();
  const { user: activeUser } = useAuth();

  const currentAuction = useAppSelector(selectCurrentAuction);
  const bids = useAppSelector(selectAuctionBids);
  const isLoading = useAppSelector(selectAuctionLoading);
  const isPlacingBid = useAppSelector(selectAuctionPlacingBid);
  const highestBid = useAppSelector(selectHighestBid);
  const minimumNextBid = useAppSelector(selectMinimumNextBid);
  const timeRemaining = useAppSelector(selectAuctionTimeRemaining);

  const [bidAmount, setBidAmount] = useState('');

  useEffect(() => {
    if (currentAuction?.id) {
      joinAuctionRoom(currentAuction.id);
      onAuctionUpdate(); // Register listeners

      return () => {
        leaveAuctionRoom(currentAuction.id);
      };
    }
  }, [currentAuction?.id]);

  
  useEffect(() => {
    // Timer logic
    if (currentAuction?.state === 'active' && currentAuction.end_at) {
      const interval = setInterval(() => {
        const end = new Date(currentAuction.end_at).getTime();
        const now = new Date().getTime();
        const distance = end - now;

        if (distance < 0) {
          clearInterval(interval);
          dispatch(updateTimeRemaining(0));
          // TODO: Handle auction end
        } else {
          dispatch(updateTimeRemaining(Math.floor(distance / 1000)));
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentAuction?.state, currentAuction?.end_at, dispatch]);

  const handlePlaceBid = () => {
    if (!currentAuction) return;

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Bid', 'Please enter a valid bid amount.');
      return;
    }

    if (amount <= currentAuction.current_highest_bid) {
      Alert.alert('Bid Too Low', 'Your bid must be higher than the current highest bid.');
      return;
    }

    if (amount < currentAuction.start_price) {
        Alert.alert('Bid Too Low', 'Your bid must be higher than the starting price.');
        return;
    }

    dispatch(placeBid({ auction_id: currentAuction.id, amount }))
      .unwrap()
      .then(() => {
        setBidAmount('');
      })
      .catch((err) => {
        Alert.alert('Bid Failed', err.message || 'There was an error placing your bid.');
      });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isParticipant = currentAuction?.participants.some(p => p.user_id === activeUser?.id && p.is_invited);
  const isSeller = currentAuction?.seller_id === activeUser?.id;

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
            <ThemedText style={styles.headerTitle}>Auction</ThemedText>
            <ThemedText style={styles.headerSubtitle}>#{currentAuction?.id.substring(0, 8)}</ThemedText>
        </View>
        <View style={styles.timerContainer}>
            <Ionicons name="timer-outline" size={20} color={theme.colors.primary} />
            <ThemedText style={styles.timerText}>{formatTime(timeRemaining)}</ThemedText>
        </View>
    </View>
  );

  const renderHighestBid = () => (
      <View style={styles.highestBidContainer}>
          <ThemedText style={styles.highestBidLabel}>Highest Bid</ThemedText>
          <ThemedText style={styles.highestBidAmount}>${currentAuction?.current_highest_bid.toLocaleString() || '0'}</ThemedText>
      </View>
  );

  const renderBidStream = () => (
    <ScrollView style={styles.bidStream}>
      {bids.slice().sort((a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime()).map(bid => (
        <AuctionBidCard 
            key={bid.id} 
            bid={bid} 
            isHighest={bid.is_highest}
            isOwnBid={bid.bidder_id === activeUser?.id}
        />
      ))}
    </ScrollView>
  );

  const renderBidInput = () => {
    if (isSeller) {
        return <View style={styles.spectatorView}><ThemedText>You are the seller.</ThemedText></View>;
    }
    if (!isParticipant) {
        return <View style={styles.spectatorView}><ThemedText>Spectating only.</ThemedText></View>;
    }
    if (currentAuction?.state !== 'active') {
        return <View style={styles.spectatorView}><ThemedText>Auction has ended.</ThemedText></View>;
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.bidInputContainer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.primary, borderColor: theme.colors.border }]}
                    placeholder={`Min bid: $${(currentAuction?.current_highest_bid || currentAuction?.start_price || 0) + (currentAuction?.minimum_increment || 0)}`}
                    placeholderTextColor={theme.colors.secondary}
                    keyboardType="numeric"
                    value={bidAmount}
                    onChangeText={setBidAmount}
                />
                <TouchableOpacity 
                    style={[styles.bidButton, { backgroundColor: isPlacingBid ? theme.colors.border : theme.colors.accent }]} 
                    onPress={handlePlaceBid} 
                    disabled={isPlacingBid}
                >
                    <ThemedText style={styles.bidButtonText}>{isPlacingBid ? 'Placing...' : 'Place Bid'}</ThemedText>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
  }

  if (!currentAuction) {
    return <View style={styles.container}><Text>Loading auction...</Text></View>;
  }

  if (currentAuction.state === 'ended') {
    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {renderHeader()}
            <AuctionEndStateView auction={currentAuction} />
        </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      {renderHighestBid()}
      {renderBidStream()}
      {renderBidInput()}
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
      padding: 4,
  },
  headerInfo: {
      alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
      fontSize: 12,
      color: '#6B7280',
  },
  timerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
  },
  timerText: {
      marginLeft: 4,
      fontWeight: '600',
  },
  highestBidContainer: {
      padding: 16,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderColor: '#E5E7EB',
  },
  highestBidLabel: {
      fontSize: 14,
      color: '#6B7280',
  },
  highestBidAmount: {
      fontSize: 28,
      fontWeight: '700',
      marginTop: 4,
  },
  bidStream: {
    flex: 1,
    paddingHorizontal: 16,
  },
  bidInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
  },
  bidButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  bidButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  spectatorView: {
      padding: 24,
      alignItems: 'center',
      backgroundColor: '#F3F4F6',
  }
});

export default AuctionDealRoomScreen;
