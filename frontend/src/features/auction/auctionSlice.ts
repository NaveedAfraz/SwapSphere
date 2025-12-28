import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  createAuction,
  fetchAuction,
  fetchAuctionByDealRoom,
  placeBid,
  cancelAuction,
} from "./auctionThunks";

// Types
export interface AuctionBid {
  id: string;
  auction_id: string;
  bidder_id: string;
  bidder_name?: string;
  bidder_avatar?: string;
  amount: number;
  placed_at?: string;
  created_at?: string;
  is_highest: boolean;
}

export interface AuctionParticipant {
  userId: string;
  name: string;
  role: "seller" | "buyer";
  avatarUrl?: string;
  last_offer_amount?: number;
  commitment_score?: number;
  is_invited: boolean;
  has_joined: boolean;
}

export interface Auction {
  id: string;
  deal_room_id: string;
  listing_id: string;
  listingTitle?: string;
  seller_id: string;
  seller_user_id: string;
  start_price: number;
  min_increment: number;
  current_highest_bid: number;
  highest_bidder_id?: string;
  end_at: string;
  state: "setup" | "active" | "closed" | "cancelled";
  participants: AuctionParticipant[];
  bids: AuctionBid[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  remainingSeconds?: number; // Added from backend API
   winner_id?: string;  // Make it optional with ?
  final_amount?: number | string;  // Make it optional with ?
  hasWinner?: boolean;  // Make it optional with ?
  order_id?: string; // Order ID for payment processing
}

export interface CreateAuctionPayload {
  deal_room_id: string;
  start_price: number;
  minimum_increment: number;
  duration_minutes: number;
  participant_ids: string[];
}

export interface PlaceBidPayload {
  auction_id: string;
  amount: number;
}

export interface AuctionState {
  currentAuction: Auction | null;
  bids: AuctionBid[];
  participants: AuctionParticipant[];
  isLoading: boolean;
  isCreating: boolean;
  isPlacingBid: boolean;
  error: string | null;
  timeRemaining: number; // in seconds
}

// Async thunks are imported from auctionThunks.ts

// Initial state
const initialState: AuctionState = {
  currentAuction: null,
  bids: [],
  participants: [],
  isLoading: false,
  isCreating: false,
  isPlacingBid: false,
  error: null,
  timeRemaining: 0,
};

// Slice
const auctionSlice = createSlice({
  name: "auction",
  initialState,
  reducers: {
    setAuction: (state, action: PayloadAction<Auction>) => {
      // Preserve existing bids if they exist to avoid duplicates
      const existingBids = state.currentAuction?.bids || [];
      const newBids = action.payload.bids || [];

      // Merge bids, preferring newer data but avoiding duplicates
      const mergedBids = [...newBids];
      existingBids.forEach((existingBid) => {
        if (!mergedBids.find((b) => b.id === existingBid.id)) {
          mergedBids.push(existingBid);
        }
      });

      state.currentAuction = {
        ...action.payload,
        bids: mergedBids,
      };
      state.bids = mergedBids;
      state.error = null;
    },
    clearAuction: (state) => {
      state.currentAuction = null;
      state.bids = [];
      state.timeRemaining = 0;
      state.error = null;
    },
    addBid: (state, action: PayloadAction<AuctionBid>) => {
      const bid = action.payload;

      // Add to bids array
      state.bids.push(bid);

      // Update current auction if exists
      if (state.currentAuction) {
        state.currentAuction.bids.push(bid);

        // Update highest bid if this is higher
        if (bid.amount > state.currentAuction.current_highest_bid) {
          state.currentAuction.current_highest_bid = bid.amount;
          state.currentAuction.highest_bidder_id = bid.bidder_id;
        }
      }

      // Mark all bids as not highest except the new highest
      const maxAmount = Math.max(...state.bids.map((b) => b.amount));
      state.bids.forEach((b) => {
        b.is_highest = b.amount === maxAmount;
      });
    },
    setAuctionState: (
      state,
      action: PayloadAction<{
        state: Auction["state"];
        metadata?: Record<string, any>;
      }>
    ) => {
      if (state.currentAuction) {
        state.currentAuction.state = action.payload.state;
        if (action.payload.metadata) {
          state.currentAuction.metadata = {
            ...state.currentAuction.metadata,
            ...action.payload.metadata,
          };
        }
      }
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Socket event handlers
    handleAuctionStarted: (
      state,
      action: PayloadAction<{
        auctionId: string;
        dealRoomId: string;
        startPrice: number;
        minIncrement: number;
        endAt: string;
      }>
    ) => {
      // This is just a notification - we'll fetch the full auction data separately
    },
    handleBidUpdate: (state, action: PayloadAction<AuctionBid>) => {
      const bid = {
        ...action.payload,
        amount: Number(action.payload.amount),
      };

      // Check if bid already exists
      const existingIndex = state.bids.findIndex((b) => b.id === bid.id);
      if (existingIndex >= 0) {
        state.bids[existingIndex] = bid;
      } else {
        state.bids.push(bid);
      }

      // Update current auction
      if (state.currentAuction) {
        const bidIndex = state.currentAuction.bids.findIndex(
          (b) => b.id === bid.id
        );
        if (bidIndex >= 0) {
          state.currentAuction.bids[bidIndex] = bid;
        } else {
          state.currentAuction.bids.push(bid);
        }

        // Update highest bid
        const currentHighest = Number(
          state.currentAuction.current_highest_bid || 0
        );
        if (bid.amount > currentHighest) {
          state.currentAuction.current_highest_bid = bid.amount;
          state.currentAuction.highest_bidder_id = bid.bidder_id;
        }
      }
    },
    handleAuctionClosed: (
      state,
      action: PayloadAction<{
        auctionId: string;
        dealRoomId: string;
        winnerId?: string;
        finalAmount: number;
        hasWinner: boolean;
      }>
    ) => {
      console.log("[REDUX] handleAuctionClosed called with:", action.payload);
      if (
        state.currentAuction &&
        state.currentAuction.id === action.payload.auctionId
      ) {
        console.log(
          "[REDUX] Updating auction state to closed with winner:",
          action.payload.winnerId
        );
        state.currentAuction.state = "closed";

        // Ensure metadata exists and update it
        state.currentAuction.metadata = {
          ...(state.currentAuction.metadata || {}), // Preserve existing metadata
          winner_id: action.payload.winnerId,
          final_amount: action.payload.finalAmount,
          hasWinner: action.payload.hasWinner,
          closedAt: new Date().toISOString(), // Add timestamp for debugging
        };

        // Also update the highest bidder ID if we have a winner
        if (action.payload.winnerId) {
          state.currentAuction.highest_bidder_id = action.payload.winnerId;
          state.currentAuction.current_highest_bid = action.payload.finalAmount;
        }
      } else {
        console.log(
          "[REDUX] No matching auction found for ID:",
          action.payload.auctionId
        );
      }
    },
  },
  extraReducers: (builder) => {
    // Create auction
    builder
      .addCase(createAuction.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createAuction.fulfilled, (state, action) => {
        state.isCreating = false;
        // Note: createAuction now returns { auctionRoomId, auctionId }
        // We'll need to fetch the full auction details separately
      })
      .addCase(createAuction.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.error.message || "Failed to create auction";
      });

    // Fetch auction
    builder
      .addCase(fetchAuction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAuction.fulfilled, (state, action) => {
        state.isLoading = false;
        const { auction, highestBid, participants } = action.payload;
        state.currentAuction = auction;
        state.bids = auction.bids || [];
        state.participants = participants || [];

        // Update time remaining from API response
        if (auction.remainingSeconds !== undefined) {
          state.timeRemaining = auction.remainingSeconds;
        }
      })
      .addCase(fetchAuction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch auction";
      });

    // Fetch auction by deal room
    builder
      .addCase(fetchAuctionByDealRoom.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
  .addCase(fetchAuctionByDealRoom.fulfilled, (state, action) => {
  state.isLoading = false;
  const { auction, highestBid, participants } = action.payload;
  
  // Create metadata object with winner information if it exists
  const metadata = {
    ...auction.metadata,
    ...(auction.winner_id && {
      winner_id: auction.winner_id,
      final_amount: auction.final_amount || auction.winning_amount,
      hasWinner: true
    })
  };

  state.currentAuction = {
    id: auction.id,
    deal_room_id: auction.dealRoomId,
    listing_id: auction.listingId,
    listingTitle: auction.listingTitle,
    seller_id: auction.sellerId,
    seller_user_id: auction.seller_user_id,
    start_price: auction.startPrice,
    min_increment: auction.minIncrement,
    current_highest_bid: auction.currentHighestBid,
    highest_bidder_id: highestBid?.bidderId,
    end_at: auction.endAt,
    state: auction.state,
    participants: participants || [],
    bids: auction.bids || [],
    metadata, // Include the metadata with winner info
    created_at: auction.startAt,
    updated_at: auction.endAt,
    remainingSeconds: auction.remainingSeconds,
    winner_id: auction.winner_id,
    final_amount: auction.final_amount || auction.winning_amount,
    hasWinner: !!auction.winner_id,
    order_id: auction.order_id, // Include order ID from backend
  };
  
  state.bids = auction.bids || [];
  state.participants = participants || [];

  if (auction.remainingSeconds !== undefined) {
    state.timeRemaining = auction.remainingSeconds;
  }
})
      .addCase(fetchAuctionByDealRoom.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch auction";
      });

    // Place bid
    builder
      .addCase(placeBid.pending, (state) => {
        state.isPlacingBid = true;
        state.error = null;
      })
      .addCase(placeBid.fulfilled, (state, action) => {
        state.isPlacingBid = false;
        const { bid, highestBid } = action.payload;
        const participants = state.participants || [];
        const matchingParticipant = participants.find(
          (participant) => participant.userId === bid.bidder_id
        );

        const normalizedBid: AuctionBid = {
          ...bid,
          amount: Number(bid.amount),
          bidder_name: bid.bidder_name || matchingParticipant?.name || "Bidder",
          bidder_avatar:
            bid.bidder_avatar || matchingParticipant?.avatarUrl || undefined,
        };

        // Add bid to state
        state.bids.push(normalizedBid);

        // Update current auction
        if (state.currentAuction) {
          state.currentAuction.bids.push(normalizedBid);

          // Update highest bid
          if (normalizedBid.amount > state.currentAuction.current_highest_bid) {
            state.currentAuction.current_highest_bid = normalizedBid.amount;
            state.currentAuction.highest_bidder_id = normalizedBid.bidder_id;
          }
        }

        // Mark highest bid
        const maxAmount = Math.max(...state.bids.map((b) => b.amount));
        state.bids.forEach((b) => {
          b.is_highest = b.amount === maxAmount;
        });
      })
      .addCase(placeBid.rejected, (state, action) => {
        state.isPlacingBid = false;
        state.error = action.error.message || "Failed to place bid";
      });

    // Cancel auction
    builder
      .addCase(cancelAuction.fulfilled, (state, action) => {
        if (state.currentAuction) {
          state.currentAuction.state = "cancelled";
        }
      })
      .addCase(cancelAuction.rejected, (state, action) => {
        state.error = action.error.message || "Failed to cancel auction";
      });
  },
});

export const {
  setAuction,
  clearAuction,
  addBid,
  setAuctionState,
  updateTimeRemaining,
  clearError,
  handleAuctionStarted,
  handleBidUpdate,
  handleAuctionClosed,
} = auctionSlice.actions;

export default auctionSlice.reducer;
