import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createAuction, fetchAuction, placeBid, endAuction, cancelAuction } from './auctionThunks';

// Types
export interface AuctionBid {
  id: string;
  auction_id: string;
  bidder_id: string;
  bidder_name: string;
  bidder_avatar?: string;
  amount: number;
  placed_at: string;
  is_highest: boolean;
}

export interface AuctionParticipant {
  user_id: string;
  name: string;
  avatar?: string;
  last_offer_amount?: number;
  commitment_score?: number;
  is_invited: boolean;
  has_joined: boolean;
}

export interface Auction {
  id: string;
  deal_room_id: string;
  listing_id: string;
  seller_id: string;
  start_price: number;
  minimum_increment: number;
  current_highest_bid: number;
  highest_bidder_id?: string;
  end_at: string;
  state: 'setup' | 'active' | 'ended' | 'cancelled';
  participants: AuctionParticipant[];
  bids: AuctionBid[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
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
  isLoading: false,
  isCreating: false,
  isPlacingBid: false,
  error: null,
  timeRemaining: 0,
};

// Slice
const auctionSlice = createSlice({
  name: 'auction',
  initialState,
  reducers: {
    setAuction: (state, action: PayloadAction<Auction>) => {
      state.currentAuction = action.payload;
      state.bids = action.payload.bids || [];
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
      const maxAmount = Math.max(...state.bids.map(b => b.amount));
      state.bids.forEach(b => {
        b.is_highest = b.amount === maxAmount;
      });
    },
    setAuctionState: (state, action: PayloadAction<{ state: Auction['state']; metadata?: Record<string, any> }>) => {
      if (state.currentAuction) {
        state.currentAuction.state = action.payload.state;
        if (action.payload.metadata) {
          state.currentAuction.metadata = { ...state.currentAuction.metadata, ...action.payload.metadata };
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
    handleAuctionStarted: (state, action: PayloadAction<Auction>) => {
      state.currentAuction = action.payload;
      state.bids = action.payload.bids || [];
      state.error = null;
    },
    handleBidUpdate: (state, action: PayloadAction<AuctionBid>) => {
      const bid = action.payload;
      
      // Check if bid already exists
      const existingIndex = state.bids.findIndex(b => b.id === bid.id);
      if (existingIndex >= 0) {
        state.bids[existingIndex] = bid;
      } else {
        state.bids.push(bid);
      }
      
      // Update current auction
      if (state.currentAuction) {
        const bidIndex = state.currentAuction.bids.findIndex(b => b.id === bid.id);
        if (bidIndex >= 0) {
          state.currentAuction.bids[bidIndex] = bid;
        } else {
          state.currentAuction.bids.push(bid);
        }
        
        // Update highest bid
        if (bid.amount > state.currentAuction.current_highest_bid) {
          state.currentAuction.current_highest_bid = bid.amount;
          state.currentAuction.highest_bidder_id = bid.bidder_id;
        }
      }
      
      // Mark highest bid
      const maxAmount = Math.max(...state.bids.map(b => b.amount));
      state.bids.forEach(b => {
        b.is_highest = b.amount === maxAmount;
      });
    },
    handleAuctionClosed: (state, action: PayloadAction<{ auction_id: string; winner_id?: string; final_amount: number }>) => {
      if (state.currentAuction && state.currentAuction.id === action.payload.auction_id) {
        state.currentAuction.state = 'ended';
        state.currentAuction.metadata = {
          ...state.currentAuction.metadata,
          winner_id: action.payload.winner_id,
          final_amount: action.payload.final_amount,
        };
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
        state.currentAuction = action.payload.data;
        state.bids = action.payload.data.bids || [];
      })
      .addCase(createAuction.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.error.message || 'Failed to create auction';
      });

    // Fetch auction
    builder
      .addCase(fetchAuction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAuction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAuction = action.payload.data;
        state.bids = action.payload.data.bids || [];
      })
      .addCase(fetchAuction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch auction';
      });

    // Place bid
    builder
      .addCase(placeBid.pending, (state) => {
        state.isPlacingBid = true;
        state.error = null;
      })
      .addCase(placeBid.fulfilled, (state, action) => {
        state.isPlacingBid = false;
        const bid = action.payload.data;
        
        // Add bid to state
        state.bids.push(bid);
        
        // Update current auction
        if (state.currentAuction) {
          state.currentAuction.bids.push(bid);
          
          // Update highest bid
          if (bid.amount > state.currentAuction.current_highest_bid) {
            state.currentAuction.current_highest_bid = bid.amount;
            state.currentAuction.highest_bidder_id = bid.bidder_id;
          }
        }
        
        // Mark highest bid
        const maxAmount = Math.max(...state.bids.map(b => b.amount));
        state.bids.forEach(b => {
          b.is_highest = b.amount === maxAmount;
        });
      })
      .addCase(placeBid.rejected, (state, action) => {
        state.isPlacingBid = false;
        state.error = action.error.message || 'Failed to place bid';
      });

    // End auction
    builder
      .addCase(endAuction.fulfilled, (state, action) => {
        if (state.currentAuction && state.currentAuction.id === action.payload.data.id) {
          state.currentAuction.state = 'ended';
          state.currentAuction.metadata = action.payload.data.metadata;
        }
      })
      .addCase(endAuction.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to end auction';
      });

    // Cancel auction
    builder
      .addCase(cancelAuction.fulfilled, (state, action) => {
        if (state.currentAuction && state.currentAuction.id === action.payload.data.id) {
          state.currentAuction.state = 'cancelled';
        }
      })
      .addCase(cancelAuction.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to cancel auction';
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
