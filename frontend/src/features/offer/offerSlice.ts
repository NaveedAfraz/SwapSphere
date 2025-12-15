import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { OfferStateType, Offer, OfferState } from './types/offer';

const initialState: OfferStateType = {
  offers: [],
  currentOffer: null,
  sentOffers: [],
  receivedOffers: [],
  status: 'idle',
  error: null,
  createStatus: 'idle',
  createError: null,
  updateStatus: 'idle',
  updateError: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  },
  filters: {
    sortBy: 'created_at',
    sortOrder: 'desc',
  },
};

const offerSlice = createSlice({
  name: 'offer',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state: OfferStateType) => {
      state.error = null;
    },
    clearCreateError: (state: OfferStateType) => {
      state.createError = null;
    },
    clearUpdateError: (state: OfferStateType) => {
      state.updateError = null;
    },
    resetCreateStatus: (state: OfferStateType) => {
      state.createStatus = 'idle';
      state.createError = null;
    },
    resetUpdateStatus: (state: OfferStateType) => {
      state.updateStatus = 'idle';
      state.updateError = null;
    },
    setCurrentOffer: (state: OfferStateType, action: PayloadAction<Offer | null>) => {
      state.currentOffer = action.payload;
    },
    updateFilters: (state: OfferStateType, action: PayloadAction<any>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state: OfferStateType) => {
      state.filters = {
        sortBy: 'created_at',
        sortOrder: 'desc',
      };
    },
    clearOffers: (state: OfferStateType) => {
      state.offers = [];
      state.sentOffers = [];
      state.receivedOffers = [];
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
      };
    },
    updateOfferLocal: (state: OfferStateType, action: PayloadAction<{ id: string; updates: Partial<Offer> }>) => {
      const { id, updates } = action.payload;
      
      // Update in main offers array
      const index = state.offers.findIndex(offer => offer.id === id);
      if (index !== -1) {
        state.offers[index] = { ...state.offers[index], ...updates };
      }
      
      // Update in sent offers
      const sentIndex = state.sentOffers.findIndex(offer => offer.id === id);
      if (sentIndex !== -1) {
        state.sentOffers[sentIndex] = { ...state.sentOffers[sentIndex], ...updates };
      }
      
      // Update in received offers
      const receivedIndex = state.receivedOffers.findIndex(offer => offer.id === id);
      if (receivedIndex !== -1) {
        state.receivedOffers[receivedIndex] = { ...state.receivedOffers[receivedIndex], ...updates };
      }
      
      // Update current offer
      if (state.currentOffer?.id === id) {
        state.currentOffer = { ...state.currentOffer, ...updates };
      }
    },
    removeOfferLocal: (state: OfferStateType, action: PayloadAction<string>) => {
      const offerId = action.payload;
      state.offers = state.offers.filter(offer => offer.id !== offerId);
      state.sentOffers = state.sentOffers.filter(offer => offer.id !== offerId);
      state.receivedOffers = state.receivedOffers.filter(offer => offer.id !== offerId);
      if (state.currentOffer?.id === offerId) {
        state.currentOffer = null;
      }
    },
    addOffer: (state: OfferStateType, action: PayloadAction<Offer>) => {
      state.offers.unshift(action.payload);
      
      // Add to appropriate array based on user role
      // This would need auth state to determine current user
      state.sentOffers.unshift(action.payload);
    },
  },
  extraReducers: (builder: any) => {
    // Handle fetch offers thunk
    builder
      .addCase('offer/fetchOffers/pending', (state: OfferStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('offer/fetchOffers/fulfilled', (state: OfferStateType, action: PayloadAction<{ offers: Offer[]; pagination: any }>) => {
        state.status = 'success';
        state.offers = action.payload.offers;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('offer/fetchOffers/rejected', (state: OfferStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch offers';
      });

    // Handle fetch offer by ID thunk
    builder
      .addCase('offer/fetchOfferById/pending', (state: OfferStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('offer/fetchOfferById/fulfilled', (state: OfferStateType, action: PayloadAction<{ offer: Offer }>) => {
        state.status = 'success';
        state.currentOffer = action.payload.offer;
        state.error = null;
      })
      .addCase('offer/fetchOfferById/rejected', (state: OfferStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch offer';
      });

    // Handle create offer thunk
    builder
      .addCase('offer/createOffer/pending', (state: OfferStateType) => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase('offer/createOffer/fulfilled', (state: OfferStateType, action: PayloadAction<{ offer: Offer }>) => {
        state.createStatus = 'success';
        state.offers.unshift(action.payload.offer);
        state.sentOffers.unshift(action.payload.offer);
        state.createError = null;
      })
      .addCase('offer/createOffer/rejected', (state: OfferStateType, action: any) => {
        state.createStatus = 'error';
        state.createError = action.payload as string || 'Failed to create offer';
      });

    // Handle update offer thunk
    builder
      .addCase('offer/updateOffer/pending', (state: OfferStateType) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase('offer/updateOffer/fulfilled', (state: OfferStateType, action: PayloadAction<{ offer: Offer }>) => {
        state.updateStatus = 'success';
        const updatedOffer = action.payload.offer;
        
        // Update in all arrays
        const updateInArray = (array: Offer[]) => {
          const index = array.findIndex(offer => offer.id === updatedOffer.id);
          if (index !== -1) {
            array[index] = updatedOffer;
          }
        };
        
        updateInArray(state.offers);
        updateInArray(state.sentOffers);
        updateInArray(state.receivedOffers);
        
        if (state.currentOffer?.id === updatedOffer.id) {
          state.currentOffer = updatedOffer;
        }
        
        state.updateError = null;
      })
      .addCase('offer/updateOffer/rejected', (state: OfferStateType, action: any) => {
        state.updateStatus = 'error';
        state.updateError = action.payload as string || 'Failed to update offer';
      });

    // Handle accept offer thunk
    builder
      .addCase('offer/acceptOffer/fulfilled', (state: OfferStateType, action: PayloadAction<{ offer: Offer }>) => {
        if (action.payload && action.payload.offer) {
          const updatedOffer = action.payload.offer;
          const updateInArray = (array: Offer[]) => {
            const index = array.findIndex(offer => offer.id === updatedOffer.id);
            if (index !== -1) {
              array[index] = updatedOffer;
            }
          };
          
          updateInArray(state.offers);
          updateInArray(state.sentOffers);
          updateInArray(state.receivedOffers);
          
          if (state.currentOffer?.id === updatedOffer.id) {
            state.currentOffer = updatedOffer;
          }
        }
      })
      .addCase('offer/acceptOffer/rejected', (state: OfferStateType, action: any) => {
        state.updateStatus = 'error';
        state.updateError = action.payload as string || 'Failed to accept offer';
      });

    // Handle reject offer thunk
    builder
      .addCase('offer/rejectOffer/fulfilled', (state: OfferStateType, action: PayloadAction<{ offer: Offer }>) => {
        const updatedOffer = action.payload.offer;
        const updateInArray = (array: Offer[]) => {
          const index = array.findIndex(offer => offer.id === updatedOffer.id);
          if (index !== -1) {
            array[index] = updatedOffer;
          }
        };
        
        updateInArray(state.offers);
        updateInArray(state.sentOffers);
        updateInArray(state.receivedOffers);
        
        if (state.currentOffer?.id === updatedOffer.id) {
          state.currentOffer = updatedOffer;
        }
      });

    // Handle counter offer thunk
    builder
      .addCase('offer/counterOffer/fulfilled', (state: OfferStateType, action: PayloadAction<{ offer: Offer }>) => {
        const updatedOffer = action.payload.offer;
        const updateInArray = (array: Offer[]) => {
          const index = array.findIndex(offer => offer.id === updatedOffer.id);
          if (index !== -1) {
            array[index] = updatedOffer;
          }
        };
        
        updateInArray(state.offers);
        updateInArray(state.sentOffers);
        updateInArray(state.receivedOffers);
        
        if (state.currentOffer?.id === updatedOffer.id) {
          state.currentOffer = updatedOffer;
        }
      });

    // Handle withdraw offer thunk
    builder
      .addCase('offer/withdrawOffer/fulfilled', (state: OfferStateType, action: PayloadAction<{ offer: Offer }>) => {
        const updatedOffer = action.payload.offer;
        const updateInArray = (array: Offer[]) => {
          const index = array.findIndex(offer => offer.id === updatedOffer.id);
          if (index !== -1) {
            array[index] = updatedOffer;
          }
        };
        
        updateInArray(state.offers);
        updateInArray(state.sentOffers);
        updateInArray(state.receivedOffers);
        
        if (state.currentOffer?.id === updatedOffer.id) {
          state.currentOffer = updatedOffer;
        }
      });

    // Handle fetch sent offers thunk
    builder
      .addCase('offer/fetchSentOffers/pending', (state: OfferStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('offer/fetchSentOffers/fulfilled', (state: OfferStateType, action: PayloadAction<{ offers: Offer[]; pagination: any }>) => {
        state.status = 'success';
        state.sentOffers = action.payload.offers;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('offer/fetchSentOffers/rejected', (state: OfferStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch sent offers';
      });

    // Handle fetch received offers thunk
    builder
      .addCase('offer/fetchReceivedOffers/pending', (state: OfferStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('offer/fetchReceivedOffers/fulfilled', (state: OfferStateType, action: PayloadAction<{ offers: Offer[]; pagination: any }>) => {
        state.status = 'success';
        state.receivedOffers = action.payload.offers;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('offer/fetchReceivedOffers/rejected', (state: OfferStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch received offers';
      });

    // Handle fetch offers by listing thunk
    builder
      .addCase('offer/fetchOffersByListing/pending', (state: OfferStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('offer/fetchOffersByListing/fulfilled', (state: OfferStateType, action: PayloadAction<{ offers: Offer[]; pagination: any }>) => {
        state.status = 'success';
        state.offers = action.payload.offers;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('offer/fetchOffersByListing/rejected', (state: OfferStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch offers for listing';
      });

    // Handle delete offer thunk
    builder
      .addCase('offer/deleteOffer/fulfilled', (state: OfferStateType, action: PayloadAction<string>) => {
        const offerId = action.payload;
        state.offers = state.offers.filter(offer => offer.id !== offerId);
        state.sentOffers = state.sentOffers.filter(offer => offer.id !== offerId);
        state.receivedOffers = state.receivedOffers.filter(offer => offer.id !== offerId);
        if (state.currentOffer?.id === offerId) {
          state.currentOffer = null;
        }
      });
  },
});

export const {
  clearError,
  clearCreateError,
  clearUpdateError,
  resetCreateStatus,
  resetUpdateStatus,
  setCurrentOffer,
  updateFilters,
  resetFilters,
  clearOffers,
  updateOfferLocal,
  removeOfferLocal,
  addOffer,
} = offerSlice.actions;

export default offerSlice.reducer;
