import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Image,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/src/hooks/redux";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/ThemedView";
import { useAuth } from "@/src/hooks/useAuth";
import {
  joinAuctionRoom,
  leaveAuctionRoom,
  onAuctionUpdate,
} from "@/src/services/auctionSocket";
import {
  connectSocket,
  isSocketConnected,
  joinChatRoom,
} from "@/src/services/socketService";
import {
  handleBidUpdate,
  updateTimeRemaining,
  handleAuctionClosed,
} from "@/src/features/auction/auctionSlice";
import {
  selectCurrentAuction,
  selectAuctionBids,
  selectAuctionLoading,
  selectAuctionPlacingBid,
  selectHighestBid,
  selectMinimumNextBid,
  selectAuctionTimeRemaining,
  selectAuctionParticipants,
} from "@/src/features/auction/auctionSelectors";
import AuctionBidCard from "@/src/features/auction/components/AuctionBidCard";
import { ParticipantsModal } from "@/src/features/auction/components/ParticipantsModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DefaultAvatar from "@/src/features/dealRooms/components/DefaultAvatar";
import AuctionEndStateView from "@/src/features/auction/components/AuctionEndStateView";
import {
  fetchAuction,
  fetchAuctionByDealRoom,
  placeBid,
} from "@/src/features/auction/auctionThunks";
import { Ionicons } from "@expo/vector-icons";

const AuctionDealRoomScreen = () => {
  const { id: routeId } = useLocalSearchParams();
  // Extract actual deal room ID by removing -auction suffix
  const dealRoomId =
    typeof routeId === "string" ? routeId.replace("-auction", "") : routeId;

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { theme } = useTheme();
  const { user: activeUser } = useAuth();
  const insets = useSafeAreaInsets();
  const currentAuction = useAppSelector(selectCurrentAuction);
  const bids = useAppSelector(selectAuctionBids);
  const isLoading = useAppSelector(selectAuctionLoading);
  const isPlacingBid = useAppSelector(selectAuctionPlacingBid);
  const highestBid = useAppSelector(selectHighestBid);
  const minimumNextBid = useAppSelector(selectMinimumNextBid);
  const timeRemaining = useAppSelector(selectAuctionTimeRemaining);
  const participants = useAppSelector(selectAuctionParticipants);

  const [bidAmount, setBidAmount] = useState("");
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentAuction?.id && !isLoading) {
      
      // Initialize socket connection if not connected
      const initializeSocket = async () => {
        if (!isSocketConnected()) {
          await connectSocket();
        }
        
        // Join auction room (deal room based) and set up listeners
        joinAuctionRoom(currentAuction.deal_room_id);
        // Also join the deal room to receive socket events
        joinChatRoom(currentAuction.deal_room_id);
        onAuctionUpdate(); // Register listeners
      };
      
      initializeSocket();

      return () => {
        leaveAuctionRoom(currentAuction.deal_room_id);
      };
    } else {
    }
  }, [currentAuction?.id, currentAuction, isLoading]);

  // Fetch auction data directly using deal room ID
  useEffect(() => {
    // Extract deal room ID from the route
    const dealRoomIdForAuction =
      typeof dealRoomId === "string" ? dealRoomId : dealRoomId[0];

    if (dealRoomIdForAuction) {
      // Fetch the auction data using the new endpoint
      dispatch(fetchAuctionByDealRoom(dealRoomIdForAuction))
        .unwrap()
        .then((result) => {
        })
        .catch((error) => {
        });
    }
  }, [dealRoomId, dispatch]);

  // Keyboard listeners for bottom padding
  useEffect(() => {
    const keyboardDidShow = (e: any) => {
      setKeyboardHeight(e.endCoordinates.height);
    };
    const keyboardDidHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
    const hideSubscription = Keyboard.addListener('keyboardDidHide', keyboardDidHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const [timeLeft, setTimeLeft] = useState(0);

  // Timer logic for both setup and active states
  useEffect(() => {
    if (
      (currentAuction?.state === "active" ||
        currentAuction?.state === "setup") &&
      currentAuction?.end_at
    ) {
      const interval = setInterval(() => {
        const end = new Date(currentAuction.end_at).getTime();
        const now = new Date().getTime();
        const distance = end - now;

        if (distance < 0) {
          clearInterval(interval);
          setTimeLeft(distance)
          dispatch(updateTimeRemaining(0));
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentAuction?.state, currentAuction?.end_at]);

  const openParticipantsModal = () => {
    setShowParticipantsModal(true);
  };

  const closeParticipantsModal = () => {
    setShowParticipantsModal(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Re-fetch auction data
      const dealRoomIdForAuction = typeof dealRoomId === "string" ? dealRoomId : dealRoomId[0];
      if (dealRoomIdForAuction) {
        await dispatch(fetchAuctionByDealRoom(dealRoomIdForAuction)).unwrap();
      }
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  };

  const handlePlaceBid = () => {

    if (!currentAuction) {
      return;
    }

    const amount = parseFloat(bidAmount);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Bid", "Please enter a valid bid amount.");
      return;
    }

    const currentHighestBid = currentAuction.current_highest_bid || 0;
    const startPrice = currentAuction.start_price || 0;
    const minIncrement = currentAuction.min_increment || 0;
    const minRequiredBid =
      Math.max(currentHighestBid, startPrice) + minIncrement;

    if (amount <= currentHighestBid) {
      Alert.alert(
        "Bid Too Low",
        "Your bid must be higher than the current highest bid."
      );
      return;
    }

    if (amount < startPrice) {
      Alert.alert(
        "Bid Too Low",
        "Your bid must be higher than the starting price."
      );
      return;
    }

    dispatch(placeBid({ auctionId: currentAuction.id, amount }))
      .unwrap()
      .then((result) => {
        setBidAmount("");
      })
      .catch((err) => {
        Alert.alert(
          "Bid Failed",
          err.message || "There was an error placing your bid."
        );
      });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isSeller = currentAuction?.seller_user_id === activeUser?.id;
  const isParticipant = activeUser
    ? participants.some(
        (p) => p.userId === activeUser?.id && p.role !== "seller"
      )
    : false;

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
      <View style={styles.headerInfo}>
        <ThemedText style={styles.headerTitle}>Auction</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          #{currentAuction?.id.substring(0, 8)}
        </ThemedText>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity
          onPress={openParticipantsModal}
          style={[
            styles.participantsButton,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Ionicons name="people" size={20} color={theme.colors.primary} />
          <ThemedText
            style={[
              styles.participantsButtonText,
              { color: theme.colors.primary },
            ]}
          >
            {participants?.length || 0}
          </ThemedText>
        </TouchableOpacity>
        <View style={styles.timerContainer}>
          <Ionicons
            name="timer-outline"
            size={20}
            color={theme.colors.primary}
          />
          <ThemedText style={styles.timerText}>
            {formatTime(timeRemaining || timeLeft)}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderHighestBid = () => (
    <View style={styles.highestBidContainer}>
      <ThemedText style={styles.highestBidLabel}>Highest Bid</ThemedText>
      <ThemedText style={styles.highestBidAmount}>
        ${((currentAuction?.current_highest_bid && Number(currentAuction.current_highest_bid) > 0) 
          ? Number(currentAuction.current_highest_bid) 
          : Number(currentAuction?.start_price || 0)).toLocaleString()}
      </ThemedText>
    </View>
  );

  const renderBidStream = () => (
    <ScrollView 
      style={styles.bidStream}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      {bids
        .slice()
        .sort(
          (a, b) =>
            new Date((b.placed_at || b.created_at) || '').getTime() - new Date((a.placed_at || a.created_at) || '').getTime()
        )
        .map((bid) => (
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
    if (!activeUser) {
      return (
        <View
          style={[
            styles.spectatorView,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <Ionicons
            name="lock-closed"
            size={24}
            color={theme.colors.secondary}
          />
          <ThemedText
            style={[
              styles.spectatorText,
              { color: theme.colors.secondary, marginTop: 8 },
            ]}
          >
            Please log in to participate in this auction
          </ThemedText>
        </View>
      );
    }

    if (isSeller) {
      return (
        <View
          style={[
            styles.spectatorView,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <Ionicons name="storefront" size={24} color={theme.colors.accent} />
          <ThemedText
            style={[
              styles.spectatorText,
              { color: theme.colors.primary, marginTop: 8 },
            ]}
          >
            You are the seller of this auction
          </ThemedText>
          <ThemedText
            style={[
              styles.spectatorSubtext,
              { color: theme.colors.secondary, marginTop: 4 },
            ]}
          >
            Monitor bids from participants
          </ThemedText>
        </View>
      );
    }

    if (!isParticipant) {
      return (
        <View
          style={[
            styles.spectatorView,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <Ionicons name="eye" size={24} color={theme.colors.secondary} />
          <ThemedText
            style={[
              styles.spectatorText,
              { color: theme.colors.secondary, marginTop: 8 },
            ]}
          >
            Spectating only
          </ThemedText>
          <ThemedText
            style={[
              styles.spectatorSubtext,
              { color: theme.colors.secondary, marginTop: 4 },
            ]}
          >
            You need to be invited to participate in this auction
          </ThemedText>
        </View>
      );
    }

    if (currentAuction?.state === "ended") {
      const endedMessage = "Auction has ended.";
      return (
        <View
          style={[
            styles.spectatorView,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={theme.colors.secondary}
          />
          <ThemedText
            style={[
              styles.spectatorText,
              { color: theme.colors.secondary, marginTop: 8 },
            ]}
          >
            {endedMessage}
          </ThemedText>
        </View>
      );
    }

    const startPrice = Number(currentAuction?.start_price) || 0;
    const highestBidAmount = Number(currentAuction?.current_highest_bid) || 0;
    const minIncrement = Number(currentAuction?.min_increment) || 0;
    const biddingBaseline = Math.max(highestBidAmount, startPrice);
    const minBid = biddingBaseline + minIncrement;
    const isValidBid = bidAmount && Number(bidAmount) >= minBid;

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[
            styles.bidInputContainer,
            {
              borderTopColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              paddingBottom: keyboardHeight > 0 ? "15%" : insets.bottom || 12,
              marginBottom: keyboardHeight,
            },
          ]}
        >
          <View style={styles.bidMetaRow}>
            <View style={styles.metaPill}>
              <Ionicons
                name="cash-outline"
                size={16}
                color={theme.colors.primary}
              />
              <ThemedText color="secondary" style={styles.metaLabel}>
                Baseline
              </ThemedText>
              <ThemedText color="primary" style={styles.metaValue}>
                ${biddingBaseline.toLocaleString()}
              </ThemedText>
            </View>
            <View style={styles.metaPill}>
              <Ionicons
                name="trending-up-outline"
                size={16}
                color={theme.colors.accent}
              />
              <ThemedText
                color="secondary"
                style={styles.metaLabel}
              >
                Min Increment
              </ThemedText>
              <ThemedText
                color="accent"
                style={styles.metaValue}
              >
                +${minIncrement.toLocaleString()}
              </ThemedText>
            </View>
          </View>

          <View style={styles.bidInputRow}>
            <View style={styles.inputContainer}>
              <ThemedText
                style={[styles.inputLabel, { color: theme.colors.secondary }]}
              >
                Enter your bid
              </ThemedText>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: isValidBid
                      ? theme.colors.accent
                      : theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.currencySymbol,
                    { color: theme.colors.primary },
                  ]}
                >
                  $
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.background,
                      color: theme.colors.primary,
                    },
                  ]}
                  placeholder={minBid.toLocaleString()}
                  placeholderTextColor={theme.colors.secondary}
                  keyboardType="numeric"
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  editable={!isPlacingBid}
                />
                <TouchableOpacity
                  style={[
                    styles.quickFillButton,
                    { backgroundColor: theme.colors.background },
                  ]}
                  onPress={() => setBidAmount(String(minBid))}
                  disabled={isPlacingBid}
                >
                  <Ionicons
                    name="sparkles"
                    size={16}
                    color={theme.colors.accent}
                  />
                  <ThemedText
                    style={[
                      styles.quickFillText,
                      { color: theme.colors.accent },
                    ]}
                  >
                    Min
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <ThemedText
                style={[styles.minBidText, { color: theme.colors.secondary }]}
              >
                Your offer must be at least ${minBid.toLocaleString()}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[
                styles.bidButton,
                {
                  backgroundColor: isValidBid
                    ? theme.colors.accent
                    : theme.colors.border,
                  opacity: isValidBid && !isPlacingBid ? 1 : 0.6,
                },
              ]}
              onPress={() => {
                handlePlaceBid();
              }}
              disabled={isPlacingBid || !isValidBid}
            >
              <Ionicons
                name={isPlacingBid ? "hourglass" : "trending-up"}
                size={20}
                color="white"
                style={styles.bidButtonIcon}
              />
              <ThemedText style={styles.bidButtonText}>
                {isPlacingBid ? "Placing..." : "Place Bid"}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {bidAmount && !isValidBid && (
            <View style={styles.validationMessage}>
              <Ionicons
                name="warning"
                size={16}
                color={theme.colors.error || "#DC2626"}
              />
              <ThemedText
                style={[
                  styles.validationText,
                  { color: theme.colors.error || "#DC2626" },
                ]}
              >
                Bid must be at least ${minBid.toLocaleString()}
              </ThemedText>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  };

  if (!currentAuction) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            justifyContent: "center",
            alignItems: "center",
            paddingTop: insets.top,
          },
        ]}
      >
        <Text style={{ color: theme.colors.primary, fontSize: 16 }}>
          Loading auction...
        </Text>
        <Text
          style={{ color: theme.colors.secondary, fontSize: 12, marginTop: 8 }}
        >
          Deal Room: {dealRoomId}
        </Text>
      </View>
    );
  }

  if (currentAuction.state === "ended") {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background, paddingTop: insets.top },
        ]}
      >
        {renderHeader()}
        {renderHighestBid()}
        <AuctionEndStateView auction={currentAuction} />
        <ParticipantsModal
          visible={showParticipantsModal}
          onClose={closeParticipantsModal}
          participants={participants}
          activeUserId={activeUser?.id}
        />
      </View>
    );
  }

  // Show full auction interface for setup and active states
  if (currentAuction.state === "setup" || currentAuction.state === "active") {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background, paddingTop: insets.top },
        ]}
      >
        {renderHeader()}
        {renderHighestBid()}
        {renderBidStream()}
        {renderBidInput()}
        <ParticipantsModal
          visible={showParticipantsModal}
          onClose={closeParticipantsModal}
          participants={participants}
          activeUserId={activeUser?.id}
        />
      </View>
    );
  }

  // Error fallback
  if (!dealRoomId) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            justifyContent: "center",
            alignItems: "center",
            paddingTop: insets.top,
          },
        ]}
      >
        <Text style={{ color: theme.colors.primary }}>
          Error: Invalid deal room ID
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerText: {
    marginLeft: 4,
    fontWeight: "600",
    color: "#111827",
  },
  highestBidContainer: {
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  highestBidLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  highestBidAmount: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 4,
  },
  bidStream: {
    flex: 1,
    paddingHorizontal: 16,
  },
  bidInputContainer: {
    flexDirection: "column",
    padding: 20,
    borderTopWidth: 1,
    gap: 16,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "600",
  },
  bidButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bidButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  spectatorView: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderTopWidth: 1,
  },
  spectatorText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  spectatorSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  bidInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  bidMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  metaPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 12,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
    marginRight: 8,
  },
  quickFillButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickFillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  minBidText: {
    fontSize: 12,
    marginTop: 6,
  },
  bidButtonIcon: {
    marginRight: 8,
  },
  validationMessage: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 4,
  },
  validationText: {
    fontSize: 12,
    marginLeft: 6,
  },
  participantsContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  participantsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  participantsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  participantGroup: {
    marginBottom: 16,
  },
  participantGroupTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    marginLeft: 4,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "600",
  },
  participantRole: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  // Header actions
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  participantsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  participantsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  participantsModal: {
    width: 300,
    height: "100%",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
});

export default AuctionDealRoomScreen;
