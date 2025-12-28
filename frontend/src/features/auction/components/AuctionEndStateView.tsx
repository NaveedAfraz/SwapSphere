import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { ThemedText } from '@/src/components/ThemedView';
import { Auction } from '../auctionSlice';
import { useAuth } from '@/src/hooks/useAuth';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import PayNowButton from "@/src/features/payment/components/PayNowButton";
import { getOrderPaymentsThunk } from "@/src/features/payment/paymentThunks";
import { AppDispatch } from "@/src/store";
interface AuctionEndStateViewProps {
  auction: Auction;
}

const AuctionEndStateView: React.FC<AuctionEndStateViewProps> = ({ auction }) => {
  const { theme } = useTheme();
  const { user: activeUser } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentStatusChecked, setPaymentStatusChecked] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Check payment status when auction data loads
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (auction.order_id) {
        setCheckingPayment(true);
        try {
          const result = await dispatch(getOrderPaymentsThunk(auction.order_id));
          if (getOrderPaymentsThunk.fulfilled.match(result)) {
            const payments = result.payload;
            if (payments && payments.length > 0) {
              const latestPayment = payments[0];
              const isCompleted = 
                latestPayment.status === "escrowed" ||
                latestPayment.status === "completed" ||
                latestPayment.status === "captured";
              setPaymentCompleted(isCompleted);
            } else {
              setPaymentCompleted(false);
            }
          }
        } catch (error) {
          console.error('[AuctionEndStateView] Error checking payment status:', error);
          setPaymentCompleted(false);
        } finally {
          setCheckingPayment(false);
          setPaymentStatusChecked(true);
        }
      } else {
        setPaymentStatusChecked(true);
      }
    };

    checkPaymentStatus();
  }, [auction.order_id, dispatch]);

  console.log('[AuctionEndStateView] Rendered with:', {
    activeUserId: activeUser?.id,
    auctionId: auction.id,
    winnerId: auction.metadata.winner_id,
    sellerId: auction.seller_id,
    participants: auction.participants,
    metadata: auction.metadata,
    order_id: auction.order_id,
    paymentCompleted,
    paymentStatusChecked
  });

  const winner = auction.participants.find(p => p.userId === auction.metadata.winner_id);
  const isWinner = activeUser?.id === auction.metadata.winner_id;
  const isSeller = activeUser?.id === auction.seller_id;

  console.log('[AuctionEndStateView] State:', {
    isWinner,
    isSeller,
    winnerId: winner?.userId || 'No winner found',
    activeUserId: activeUser?.id || 'No active user'
  });

const renderWinnerView = () => {
  // Use the actual order ID from the backend if available, otherwise generate a temporary one
  const orderId = auction.order_id || `auction-${auction.id}-${Date.now()}`;
  const amount = parseFloat(auction.metadata.final_amount || auction.current_highest_bid || "0");

  return (
    <View style={[styles.container, { backgroundColor: '#10B981' }]}>
      <Ionicons name="trophy" size={48} color="#FFFFFF" />
      <ThemedText style={styles.title}>You won the auction!</ThemedText>
      <ThemedText style={styles.subtitle}>Congratulations! You had the highest bid of ${amount.toFixed(2)}</ThemedText>
      
      {checkingPayment ? (
        <View style={[styles.paymentStatusContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
          <Ionicons name="time" size={24} color="#FFFFFF" />
          <ThemedText style={styles.paymentStatusText}>Checking payment status...</ThemedText>
        </View>
      ) : paymentCompleted ? (
        <View style={[styles.paymentStatusContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
          <ThemedText style={styles.paymentStatusText}>Payment Completed</ThemedText>
        </View>
      ) : (
        <PayNowButton
          orderId={orderId}
          amount={amount}
          onPaymentSuccess={() => {
            // Handle successful payment
            console.log('Payment successful for auction:', auction.id);
            setPaymentCompleted(true); // Update local state
            Alert.alert('Payment Successful', 'Your payment has been processed successfully!');
          }}
          onPaymentError={(error) => {
            console.error('Payment error:', error);
            Alert.alert('Payment Error', error || 'Failed to process payment. Please try again.');
          }}
        />
      )}
    </View>
  );
};

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
  paymentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  paymentStatusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
