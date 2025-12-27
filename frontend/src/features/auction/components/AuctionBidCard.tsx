import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { ThemedText } from '@/src/components/ThemedView';
import { AuctionBid } from '../auctionSlice';
import DefaultAvatar from '../../dealRooms/components/DefaultAvatar';
import { Ionicons } from '@expo/vector-icons';

interface AuctionBidCardProps {
  bid: AuctionBid;
  isHighest?: boolean;
  isOwnBid?: boolean;
  showWinnerBadge?: boolean;
  onPress?: () => void;
}

const AuctionBidCard: React.FC<AuctionBidCardProps> = ({
  bid,
  isHighest = false,
  isOwnBid = false,
  showWinnerBadge = false,
  onPress,
}) => {
  const { theme } = useTheme();

  const getCardStyle = () => {
    if (showWinnerBadge) {
      return {
        backgroundColor: '#10B98120',
        borderColor: '#10B981',
        borderWidth: 2,
      };
    }
    if (isHighest) {
      return {
        backgroundColor: `${theme.colors.accent}15`,
        borderColor: theme.colors.accent,
        borderWidth: 1,
      };
    }
    return {
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border,
      borderWidth: 1,
    };
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  // Handle both created_at and placed_at timestamps
  const timestamp = bid.placed_at || bid.created_at;

  return (
    <TouchableOpacity
      style={[styles.container, getCardStyle()]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Left side - Avatar and bidder info */}
      <View style={styles.bidderInfo}>
        {bid.bidder_avatar ? (
          <Image source={{ uri: bid.bidder_avatar }} style={styles.avatar} />
        ) : (
          <DefaultAvatar size={40} name={bid.bidder_name} />
        )}
        <View style={styles.bidderDetails}>
          <View style={styles.nameRow}>
            <ThemedText style={styles.bidderName}>
              {bid.bidder_name}
            </ThemedText>
            {isOwnBid && (
              <View style={[styles.ownBadge, { backgroundColor: theme.colors.accent }]}>
                <ThemedText style={styles.ownBadgeText}>You</ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={styles.bidTime}>
            {formatTime(timestamp)}
          </ThemedText>
        </View>
      </View>

      {/* Right side - Bid amount and badges */}
      <View style={styles.bidInfo}>
        <View style={styles.amountRow}>
          <ThemedText style={[styles.bidAmount, { color: isHighest ? theme.colors.accent : theme.colors.primary }]}>
            ${bid.amount.toLocaleString()}
          </ThemedText>
          {isHighest && !showWinnerBadge && (
            <Ionicons name="trending-up" size={16} color={theme.colors.accent} />
          )}
          {showWinnerBadge && (
            <Ionicons name="trophy" size={16} color="#10B981" />
          )}
        </View>
        {showWinnerBadge && (
          <View style={[styles.winnerBadge, { backgroundColor: '#10B981' }]}>
            <ThemedText style={styles.winnerBadgeText}>Winner</ThemedText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  bidderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  bidderDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  bidderName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  ownBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ownBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bidTime: {
    fontSize: 12,
  },
  bidInfo: {
    alignItems: 'flex-end',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bidAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 6,
  },
  winnerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  winnerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AuctionBidCard;
