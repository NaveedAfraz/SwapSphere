import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { ThemedText } from '@/src/components/ThemedView';
import { Auction } from '../auctionSlice';
import { useAuth } from '@/src/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

interface AuctionEndStateViewProps {
  auction: Auction;
}

const AuctionEndStateView: React.FC<AuctionEndStateViewProps> = ({ auction }) => {
  const { theme } = useTheme();
  const { user: activeUser } = useAuth();

  const winner = auction.participants.find(p => p.user_id === auction.metadata.winner_id);
  const isWinner = activeUser?.id === auction.metadata.winner_id;
  const isSeller = activeUser?.id === auction.seller_id;

  const renderWinnerView = () => (
    <View style={[styles.container, { backgroundColor: '#10B981' }]}>
        <Ionicons name="trophy" size={48} color="#FFFFFF" />
        <ThemedText style={styles.title}>You won the auction!</ThemedText>
        <ThemedText style={styles.subtitle}>Congratulations! You had the highest bid.</ThemedText>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.surface }]}>
            <ThemedText style={[styles.buttonText, { color: '#10B981' }]}>Pay Now</ThemedText>
        </TouchableOpacity>
    </View>
  );

  const renderLoserView = () => (
    <View style={[styles.container, { backgroundColor: '#EF4444' }]}>
        <Ionicons name="close-circle" size={48} color="#FFFFFF" />
        <ThemedText style={styles.title}>Auction Ended</ThemedText>
        <ThemedText style={styles.subtitle}>Unfortunately, you were outbid.</ThemedText>
    </View>
  );

  const renderSellerView = () => (
    <View style={[styles.container, { backgroundColor: theme.colors.accent }]}>
        <Ionicons name="checkmark-circle" size={48} color="#FFFFFF" />
        <ThemedText style={styles.title}>Auction Completed</ThemedText>
        <ThemedText style={styles.subtitle}>
            Winner: {winner?.name || 'N/A'} with a bid of ${auction.metadata.final_amount?.toLocaleString()}
        </ThemedText>
    </View>
  );

  if (isWinner) {
    return renderWinnerView();
  }
  if (isSeller) {
    return renderSellerView();
  }
  return renderLoserView();
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    margin: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'center',
  },
  button: {
      marginTop: 20,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 8,
  },
  buttonText: {
      fontSize: 16,
      fontWeight: '600',
  }
});

export default AuctionEndStateView;
