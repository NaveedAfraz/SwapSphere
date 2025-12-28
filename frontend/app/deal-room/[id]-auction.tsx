import React, { useState, useEffect, useRef, memo } from "react";
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
import { ThemedView, ThemedText } from "@/src/components/ThemedView";
import { PullToRefresh } from "@/src/components/PullToRefresh";
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
  handleAuctionClosed,
} from "@/src/features/auction/auctionSlice";
import {
  selectCurrentAuction,
  selectAuctionBids,
  selectAuctionLoading,
  selectAuctionPlacingBid,
  selectHighestBid,
  selectMinimumNextBid,
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
import { theme } from "@/src/theme";

const formatTime = (seconds: number) => {
  if (seconds <= 0) return "00:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

type AuctionCountdownProps = {
  endAt?: string | null;
  auctionState?: string | null;
};

const AuctionCountdown = memo(
  ({ endAt, auctionState }: AuctionCountdownProps) => {
    const { theme, classes } = useTheme();
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
      if (endAt) {
        const end = new Date(endAt).getTime();
        const now = Date.now();
        const secondsRemaining = Math.max(0, Math.floor((end - now) / 1000));
        setTimeLeft(secondsRemaining);
      } else {
        setTimeLeft(0);
      }
    }, [endAt]);

    useEffect(() => {
      if ((auctionState === "active" || auctionState === "setup") && endAt) {
        const interval = setInterval(() => {
          const end = new Date(endAt).getTime();
          const now = Date.now();
          const distance = end - now;

          if (distance <= 0) {
            clearInterval(interval);
            setTimeLeft(0);
          } else {
            const secondsRemaining = Math.floor(distance / 1000);
            setTimeLeft(secondsRemaining);
          }
        }, 1000);

        return () => clearInterval(interval);
      }
    }, [auctionState, endAt]);

    return (
      <View
        style={[
          classes.card,
          styles.timerContainer,
          { borderColor: theme.colors.border },
        ]}
      >
        <Ionicons name="timer-outline" size={20} color={theme.colors.accent} />
        <ThemedText color="accent" style={styles.timerText}>
          {formatTime(timeLeft)}
        </ThemedText>
      </View>
    );
  }
);

AuctionCountdown.displayName = "AuctionCountdown";

const AuctionDealRoomScreen = () => {
  const { id: routeId } = useLocalSearchParams();
  // Extract actual deal room ID by removing -auction suffix
  const dealRoomId =
    typeof routeId === "string" ? routeId.replace("-auction", "") : routeId;

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { theme, classes } = useTheme();
  const { user: activeUser } = useAuth();
  const insets = useSafeAreaInsets();
  const currentAuction = useAppSelector(selectCurrentAuction);
  const bids = useAppSelector(selectAuctionBids);
  const isLoading = useAppSelector(selectAuctionLoading);
  const isPlacingBid = useAppSelector(selectAuctionPlacingBid);
  const highestBid = useAppSelector(selectHighestBid);
  const minimumNextBid = useAppSelector(selectMinimumNextBid);
  const participants = useAppSelector(selectAuctionParticipants);
  console.log(currentAuction);
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
        .then((result) => {})
        .catch((error) => {});
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

    const showSubscription = Keyboard.addListener(
      "keyboardDidShow",
      keyboardDidShow
    );
    const hideSubscription = Keyboard.addListener(
      "keyboardDidHide",
      keyboardDidHide
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const closeParticipantsModal = () => {
    setShowParticipantsModal(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Force refresh auction data
      const dealRoomIdForAuction =
        typeof dealRoomId === "string" ? dealRoomId : dealRoomId[0];
      if (dealRoomIdForAuction) {
        await dispatch(fetchAuctionByDealRoom(dealRoomIdForAuction)).unwrap();
      }
    } catch (error) {
      console.error("Error refreshing auction:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const openParticipantsModal = () => {
    setShowParticipantsModal(true);
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
    if (seconds <= 0) return "00:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
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
        {/* <ThemedText style={styles.headerSubtitle}>
          #{currentAuction?.id.substring(0, 8)}
        </ThemedText> */}
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity
          onPress={openParticipantsModal}
          style={[classes.card, styles.participantsButton]}
        >
          <Ionicons name="people" size={20} color={theme.colors.secondary} />
          <ThemedText style={[classes.caption, styles.participantsButtonText]}>
            {participants?.length || 0}
          </ThemedText>
        </TouchableOpacity>
        <AuctionCountdown
          endAt={currentAuction?.end_at}
          auctionState={currentAuction?.state}
        />
      </View>
    </View>
  );

  const renderHighestBid = () => (
    <View style={styles.highestBidContainer}>
      <ThemedText style={styles.highestBidLabel}>Highest Bid</ThemedText>
      <ThemedText style={styles.highestBidAmount}>
        $
        {(currentAuction?.current_highest_bid &&
        Number(currentAuction.current_highest_bid) > 0
          ? Number(currentAuction.current_highest_bid)
          : Number(currentAuction?.start_price || 0)
        ).toLocaleString()}
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
            new Date(b.placed_at || b.created_at || "").getTime() -
            new Date(a.placed_at || a.created_at || "").getTime()
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

    if (currentAuction?.state === "closed") {
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

    // Check if auction time has expired (with 2-second buffer for safety)
    const now = Date.now();
    const endTime = currentAuction?.end_at
      ? new Date(currentAuction.end_at).getTime()
      : 0;
    const isTimeExpired = currentAuction?.end_at && endTime <= now + 2000;

    // Debug logging (remove in production)
    console.log("Time check:", {
      now,
      endTime,
      timeLeft: endTime - now,
      isTimeExpired,
    });

    if (isTimeExpired) {
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
            Auction time has expired
          </ThemedText>
        </View>
      );
    }

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
            <View
              style={[
                classes.card,
                styles.metaPill,
                { borderColor: theme.colors.border },
              ]}
            >
              <Ionicons
                name="cash-outline"
                size={16}
                color={theme.colors.accent}
              />
              <ThemedText color="accent" style={styles.metaLabel}>
                Baseline
              </ThemedText>
              <ThemedText color="accent" style={styles.metaValue}>
                ${biddingBaseline.toLocaleString()}
              </ThemedText>
            </View>
            <View
              style={[
                classes.card,
                styles.metaPill,
                { borderColor: theme.colors.border },
              ]}
            >
              <Ionicons
                name="trending-up-outline"
                size={16}
                color={theme.colors.accent}
              />
              <ThemedText color="accent" style={styles.metaLabel}>
                Min Increment
              </ThemedText>
              <ThemedText color="accent" style={styles.metaValue}>
                +${minIncrement.toLocaleString()}
              </ThemedText>
            </View>
          </View>

          <View style={styles.bidInputRow}>
            <View style={styles.inputContainer}>
              <ThemedText
                color="accent"
                style={[
                  styles.inputLabel,
                  { fontWeight: "600", marginBottom: 8 },
                ]}
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
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.currencySymbol,
                    {
                      color: theme.colors.accent,
                      borderRightWidth: 1,
                      borderRightColor: theme.colors.border,
                      paddingRight: 8,
                    },
                  ]}
                >
                  $
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.accent,
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
                    classes.card,
                    { borderColor: theme.colors.border },
                  ]}
                  onPress={() => setBidAmount(String(minBid))}
                  disabled={isPlacingBid}
                >
                  <Ionicons
                    name="sparkles"
                    size={16}
                    color={theme.colors.accent}
                  />
                  <ThemedText color="accent" style={styles.quickFillText}>
                    Min
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <ThemedText color="accent" style={styles.minBidText}>
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
              <Text style={[styles.bidButtonText, { color: "white" }]}>
                {isPlacingBid ? "Placing..." : "Place Bid"}
              </Text>
            </TouchableOpacity>
          </View>

          {bidAmount && !isValidBid && (
            <View style={styles.validationMessage}>
              <Ionicons
                name="warning"
                size={16}
                color={theme.colors.error || "#DC2626"}
              />
              <Text
                style={[
                  styles.validationText,
                  { color: theme.colors.error || "#DC2626" },
                ]}
              >
                Bid must be at least ${minBid.toLocaleString()}
              </Text>
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

  if (currentAuction.state === "closed") {
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
      <PullToRefresh refreshing={refreshing} onRefresh={onRefresh}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.background,
              paddingTop: insets.top,
            },
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
      </PullToRefresh>
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerText: {
    marginLeft: 4,
    fontWeight: "600",
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
    borderColor: theme.colors.border,
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
    borderColor: theme.colors.border,
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
    borderColor: theme.colors.border,
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
    borderColor: theme.colors.border,
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
    backgroundColor: theme.colors.primary,
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
    backgroundColor: theme.colors.background,
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
    borderColor: theme.colors.border,
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
