import type { RootState } from '../../store';
import type { OfferStateType, Offer, OfferState } from './types/offer';

// Basic selectors
export const selectOfferState = (state: RootState): OfferStateType => state.offer;

export const selectOffers = (state: RootState): Offer[] => state.offer.offers;

export const selectCurrentOffer = (state: RootState): Offer | null => state.offer.currentOffer;

export const selectSentOffers = (state: RootState): Offer[] => state.offer.sentOffers;

export const selectReceivedOffers = (state: RootState): Offer[] => state.offer.receivedOffers;

export const selectOfferStatus = (state: RootState): OfferStateType['status'] => state.offer.status;

export const selectOfferError = (state: RootState): string | null => state.offer.error ?? null;

export const selectCreateStatus = (state: RootState): OfferStateType['createStatus'] => state.offer.createStatus;

export const selectCreateError = (state: RootState): string | null => state.offer.createError ?? null;

export const selectUpdateStatus = (state: RootState): OfferStateType['updateStatus'] => state.offer.updateStatus;

export const selectUpdateError = (state: RootState): string | null => state.offer.updateError ?? null;

export const selectPagination = (state: RootState) => state.offer.pagination;

export const selectFilters = (state: RootState) => state.offer.filters;

// Derived selectors
export const selectIsOfferLoading = (state: RootState): boolean => state.offer.status === 'loading';

export const selectIsOfferError = (state: RootState): boolean => state.offer.status === 'error';

export const selectIsOfferSuccess = (state: RootState): boolean => state.offer.status === 'success';

export const selectIsOfferIdle = (state: RootState): boolean => state.offer.status === 'idle';

export const selectIsCreating = (state: RootState): boolean => state.offer.createStatus === 'loading';

export const selectIsCreateError = (state: RootState): boolean => state.offer.createStatus === 'error';

export const selectIsCreateSuccess = (state: RootState): boolean => state.offer.createStatus === 'success';

export const selectIsUpdating = (state: RootState): boolean => state.offer.updateStatus === 'loading';

export const selectIsUpdateError = (state: RootState): boolean => state.offer.updateStatus === 'error';

export const selectIsUpdateSuccess = (state: RootState): boolean => state.offer.updateStatus === 'success';

export const selectHasMoreOffers = (state: RootState): boolean => state.offer.pagination.hasMore;

export const selectTotalOffers = (state: RootState): number => state.offer.pagination.total;

// Offer-specific selectors
export const selectOfferById = (state: RootState, offerId: string): Offer | null => {
  return state.offer.offers.find(offer => offer.id === offerId) || null;
};

export const selectSentOfferById = (state: RootState, offerId: string): Offer | null => {
  return state.offer.sentOffers.find(offer => offer.id === offerId) || null;
};

export const selectReceivedOfferById = (state: RootState, offerId: string): Offer | null => {
  return state.offer.receivedOffers.find(offer => offer.id === offerId) || null;
};

// Status-based selectors
export const selectOffersByStatus = (state: RootState, status: OfferState): Offer[] => {
  return state.offer.offers.filter(offer => offer.status === status);
};

export const selectSentOffersByStatus = (state: RootState, status: OfferState): Offer[] => {
  return state.offer.sentOffers.filter(offer => offer.status === status);
};

export const selectReceivedOffersByStatus = (state: RootState, status: OfferState): Offer[] => {
  return state.offer.receivedOffers.filter(offer => offer.status === status);
};

export const selectPendingOffers = (state: RootState): Offer[] => {
  return state.offer.offers.filter(offer => offer.status === 'pending');
};

export const selectPendingSentOffers = (state: RootState): Offer[] => {
  return state.offer.sentOffers.filter(offer => offer.status === 'pending');
};

export const selectPendingReceivedOffers = (state: RootState): Offer[] => {
  return state.offer.receivedOffers.filter(offer => offer.status === 'pending');
};

export const selectAcceptedOffers = (state: RootState): Offer[] => {
  return state.offer.offers.filter(offer => offer.status === 'accepted');
};

export const selectRejectedOffers = (state: RootState): Offer[] => {
  return state.offer.offers.filter(offer => offer.status === 'rejected');
};

export const selectCounteredOffers = (state: RootState): Offer[] => {
  return state.offer.offers.filter(offer => offer.status === 'countered');
};

export const selectWithdrawnOffers = (state: RootState): Offer[] => {
  return state.offer.offers.filter(offer => offer.status === 'withdrawn');
};

export const selectExpiredOffers = (state: RootState): Offer[] => {
  return state.offer.offers.filter(offer => offer.status === 'expired');
};

// Listing-based selectors
export const selectOffersByListing = (state: RootState, listingId: string): Offer[] => {
  return state.offer.offers.filter(offer => offer.listing_id === listingId);
};

export const selectSentOffersByListing = (state: RootState, listingId: string): Offer[] => {
  return state.offer.sentOffers.filter(offer => offer.listing_id === listingId);
};

export const selectReceivedOffersByListing = (state: RootState, listingId: string): Offer[] => {
  return state.offer.receivedOffers.filter(offer => offer.listing_id === listingId);
};

// Amount-based selectors
export const selectOffersByAmountRange = (state: RootState, minAmount: number, maxAmount: number): Offer[] => {
  return state.offer.offers.filter(offer => 
    offer.amount >= minAmount && offer.amount <= maxAmount
  );
};

export const selectHighestOffer = (state: RootState): Offer | null => {
  if (state.offer.offers.length === 0) return null;
  return state.offer.offers.reduce((highest, offer) => 
    offer.amount > highest.amount ? offer : highest
  );
};

export const selectLowestOffer = (state: RootState): Offer | null => {
  if (state.offer.offers.length === 0) return null;
  return state.offer.offers.reduce((lowest, offer) => 
    offer.amount < lowest.amount ? offer : lowest
  );
};

export const selectHighestOfferForListing = (state: RootState, listingId: string): Offer | null => {
  const listingOffers = selectOffersByListing(state, listingId);
  if (listingOffers.length === 0) return null;
  return listingOffers.reduce((highest, offer) => 
    offer.amount > highest.amount ? offer : highest
  );
};

// User-based selectors
export const selectOffersByBuyer = (state: RootState, buyerId: string): Offer[] => {
  return state.offer.offers.filter(offer => offer.buyer_id === buyerId);
};

export const selectOffersBySeller = (state: RootState, sellerId: string): Offer[] => {
  return state.offer.offers.filter(offer => offer.seller_id === sellerId);
};

// Time-based selectors
export const selectRecentOffers = (state: RootState, hours: number = 24): Offer[] => {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  return state.offer.offers.filter(offer => 
    new Date(offer.created_at) >= cutoffTime
  );
};

export const selectExpiredOffersToday = (state: RootState): Offer[] => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return state.offer.offers.filter(offer => 
    offer.expires_at && new Date(offer.expires_at) <= today
  );
};

// Complex selectors
export const selectOfferInfo = (state: RootState) => ({
  offers: selectOffers(state),
  currentOffer: selectCurrentOffer(state),
  sentOffers: selectSentOffers(state),
  receivedOffers: selectReceivedOffers(state),
  status: selectOfferStatus(state),
  createStatus: selectCreateStatus(state),
  updateStatus: selectUpdateStatus(state),
  error: selectOfferError(state),
  createError: selectCreateError(state),
  updateError: selectUpdateError(state),
  pagination: selectPagination(state),
  filters: selectFilters(state),
});

export const selectOfferStats = (state: RootState) => {
  const offers = selectOffers(state);
  const sentOffers = selectSentOffers(state);
  const receivedOffers = selectReceivedOffers(state);
  
  return {
    total: offers.length,
    totalSent: sentOffers.length,
    totalReceived: receivedOffers.length,
    pending: offers.filter(o => o.status === 'pending').length,
    pendingSent: sentOffers.filter(o => o.status === 'pending').length,
    pendingReceived: receivedOffers.filter(o => o.status === 'pending').length,
    accepted: offers.filter(o => o.status === 'accepted').length,
    acceptedSent: sentOffers.filter(o => o.status === 'accepted').length,
    acceptedReceived: receivedOffers.filter(o => o.status === 'accepted').length,
    rejected: offers.filter(o => o.status === 'rejected').length,
    rejectedSent: sentOffers.filter(o => o.status === 'rejected').length,
    rejectedReceived: receivedOffers.filter(o => o.status === 'rejected').length,
    countered: offers.filter(o => o.status === 'countered').length,
    withdrawn: offers.filter(o => o.status === 'withdrawn').length,
    expired: offers.filter(o => o.status === 'expired').length,
    totalValue: offers.reduce((sum, offer) => sum + offer.amount, 0),
    totalValueSent: sentOffers.reduce((sum, offer) => sum + offer.amount, 0),
    totalValueReceived: receivedOffers.reduce((sum, offer) => sum + offer.amount, 0),
    averageAmount: offers.length > 0 ? offers.reduce((sum, offer) => sum + offer.amount, 0) / offers.length : 0,
    highestAmount: offers.length > 0 ? Math.max(...offers.map(o => o.amount)) : 0,
    lowestAmount: offers.length > 0 ? Math.min(...offers.map(o => o.amount)) : 0,
  };
};

export const selectOfferNegotiationStats = (state: RootState, listingId: string) => {
  const listingOffers = selectOffersByListing(state, listingId);
  
  return {
    totalOffers: listingOffers.length,
    highestOffer: selectHighestOfferForListing(state, listingId),
    lowestOffer: listingOffers.length > 0 ? listingOffers.reduce((lowest, offer) => 
      offer.amount < lowest.amount ? offer : lowest
    ) : null,
    averageOffer: listingOffers.length > 0 ? 
      listingOffers.reduce((sum, offer) => sum + offer.amount, 0) / listingOffers.length : 0,
    pendingOffers: listingOffers.filter(o => o.status === 'pending').length,
    acceptedOffers: listingOffers.filter(o => o.status === 'accepted').length,
    rejectedOffers: listingOffers.filter(o => o.status === 'rejected').length,
  };
};
