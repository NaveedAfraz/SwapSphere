import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { AuctionState, Auction, AuctionBid } from './auctionSlice';

// Basic selectors
export const selectAuctionState = (state: RootState): AuctionState => state.auction;

export const selectCurrentAuction = createSelector(
  [selectAuctionState],
  (auctionState): Auction | null => auctionState.currentAuction
);

export const selectAuctionBids = createSelector(
  [selectAuctionState],
  (auctionState): AuctionBid[] => auctionState.bids
);

export const selectAuctionLoading = createSelector(
  [selectAuctionState],
  (auctionState): boolean => auctionState.isLoading
);

export const selectAuctionCreating = createSelector(
  [selectAuctionState],
  (auctionState): boolean => auctionState.isCreating
);

export const selectAuctionPlacingBid = createSelector(
  [selectAuctionState],
  (auctionState): boolean => auctionState.isPlacingBid
);

export const selectAuctionError = createSelector(
  [selectAuctionState],
  (auctionState): string | null => auctionState.error
);

export const selectAuctionTimeRemaining = createSelector(
  [selectAuctionState],
  (auctionState): number => auctionState.timeRemaining
);

// Computed selectors
export const selectHighestBid = createSelector(
  [selectAuctionBids],
  (bids): AuctionBid | null => {
    if (bids.length === 0) return null;
    return bids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
  }
);

export const selectHighestBidAmount = createSelector(
  [selectCurrentAuction, selectHighestBid],
  (auction, highestBid): number => {
    return highestBid?.amount || auction?.current_highest_bid || 0;
  }
);

export const selectMinimumNextBid = createSelector(
  [selectHighestBidAmount, selectCurrentAuction],
  (highestAmount, auction): number => {
    const minimumIncrement = auction?.minimum_increment || 0;
    return highestAmount + minimumIncrement;
  }
);

export const selectAuctionParticipants = createSelector(
  [selectCurrentAuction],
  (auction): Auction['participants'] => auction?.participants || []
);

export const selectIsAuctionActive = createSelector(
  [selectCurrentAuction],
  (auction): boolean => auction?.state === 'active'
);

export const selectIsAuctionEnded = createSelector(
  [selectCurrentAuction],
  (auction): boolean => auction?.state === 'ended'
);

export const selectIsAuctionCancelled = createSelector(
  [selectCurrentAuction],
  (auction): boolean => auction?.state === 'cancelled'
);

export const selectAuctionWinner = createSelector(
  [selectCurrentAuction],
  (auction): string | null => {
    if (auction?.state !== 'ended') return null;
    return auction.metadata?.winner_id || auction.highest_bidder_id || null;
  }
);

export const selectUserBidHistory = createSelector(
  [selectAuctionBids, (state: RootState, userId: string) => userId],
  (bids, userId): AuctionBid[] => {
    return bids.filter(bid => bid.bidder_id === userId);
  }
);

export const selectUserHighestBid = createSelector(
  [selectUserBidHistory],
  (userBids): AuctionBid | null => {
    if (userBids.length === 0) return null;
    return userBids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
  }
);

export const selectCanUserPlaceBid = createSelector(
  [selectCurrentAuction, selectUserHighestBid, selectMinimumNextBid, (state: RootState, userId: string, userBalance: number) => ({ userId, userBalance })],
  (auction, userHighestBid, minimumNextBid, { userId, userBalance }): boolean => {
    if (!auction || auction.state !== 'active') return false;
    
    // Check if user is seller (sellers can't bid)
    if (auction.seller_id === userId) return false;
    
    // Check if user has enough balance
    if (userBalance < minimumNextBid) return false;
    
    // Check if user's last bid is already the highest
    if (userHighestBid && userHighestBid.amount >= minimumNextBid) return false;
    
    return true;
  }
);
