import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ListingState, Listing, SearchParams, SingleListingResponse } from './types/listing';

const initialState: ListingState = {
  listings: [],
  currentListing: null,
  favorites: [],
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

const listingSlice = createSlice({
  name: 'listing',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state: ListingState) => {
      state.error = null;
    },
    clearCreateError: (state: ListingState) => {
      state.createError = null;
    },
    clearUpdateError: (state: ListingState) => {
      state.updateError = null;
    },
    resetCreateStatus: (state: ListingState) => {
      state.createStatus = 'idle';
      state.createError = null;
    },
    resetUpdateStatus: (state: ListingState) => {
      state.updateStatus = 'idle';
      state.updateError = null;
    },
    setCurrentListing: (state: ListingState, action: PayloadAction<Listing | null>) => {
      state.currentListing = action.payload;
    },
    updateFilters: (state: ListingState, action: PayloadAction<Partial<SearchParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state: ListingState) => {
      state.filters = {
        sortBy: 'created_at',
        sortOrder: 'desc',
      };
    },
    clearListings: (state: ListingState) => {
      state.listings = [];
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
      };
    },
    updateListingLocal: (state: ListingState, action: PayloadAction<{ id: string; updates: Partial<Listing> }>) => {
      const { id, updates } = action.payload;
      const index = state.listings.findIndex(listing => listing.id === id);
      if (index !== -1) {
        state.listings[index] = { ...state.listings[index], ...updates };
      }
      if (state.currentListing?.id === id) {
        state.currentListing = { ...state.currentListing, ...updates };
      }
    },
    removeListingLocal: (state: ListingState, action: PayloadAction<string>) => {
      const listingId = action.payload;
      state.listings = state.listings.filter(listing => listing.id !== listingId);
      if (state.currentListing?.id === listingId) {
        state.currentListing = null;
      }
    },
    toggleFavoriteLocal: (state: ListingState, action: PayloadAction<string>) => {
      const listingId = action.payload;
      const index = state.listings.findIndex(listing => listing.id === listingId);
      if (index !== -1) {
        state.listings[index].is_favorite = !state.listings[index].is_favorite;
      }
      if (state.currentListing?.id === listingId) {
        state.currentListing.is_favorite = !state.currentListing.is_favorite;
      }
    },
  },
  extraReducers: (builder: any) => {
    // Handle fetch listings thunk
    builder
      .addCase('listing/fetchListings/pending', (state: ListingState) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('listing/fetchListings/fulfilled', (state: ListingState, action: PayloadAction<{ listings: Listing[]; pagination: any }>) => {
        state.status = 'success';
        state.listings = action.payload.listings;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('listing/fetchListings/rejected', (state: ListingState, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch listings';
      });

  
    builder
      .addCase('listing/fetchListingById/pending', (state: ListingState) => {
     
        state.status = 'loading';
        state.error = null;
      })
      .addCase('listing/fetchListingById/fulfilled', (state: ListingState, action: PayloadAction<Listing>) => {
        
        state.status = 'success';
        state.currentListing = action.payload;  
        
        state.error = null;
      })
      .addCase('listing/fetchListingById/rejected', (state: ListingState, action: any) => {
       
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch listing';
      });

    // Handle create listing thunk
    builder
      .addCase('listing/createListing/pending', (state: ListingState) => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase('listing/createListing/fulfilled', (state: ListingState, action: PayloadAction<{ listing: Listing }>) => {
        state.createStatus = 'success';
        state.listings.unshift(action.payload.listing);
        state.createError = null;
      })
      .addCase('listing/createListing/rejected', (state: ListingState, action: any) => {
        state.createStatus = 'error';
        state.createError = action.payload as string || 'Failed to create listing';
      });

    // Handle update listing thunk
    builder
      .addCase('listing/updateListing/pending', (state: ListingState) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase('listing/updateListing/fulfilled', (state: ListingState, action: PayloadAction<{ listing: Listing }>) => {
        state.updateStatus = 'success';
        const index = state.listings.findIndex(listing => listing.id === action.payload.listing.id);
        if (index !== -1) {
          state.listings[index] = action.payload.listing;
        }
        if (state.currentListing?.id === action.payload.listing.id) {
          state.currentListing = action.payload.listing;
        }
        state.updateError = null;
      })
      .addCase('listing/updateListing/rejected', (state: ListingState, action: any) => {
        state.updateStatus = 'error';
        state.updateError = action.payload as string || 'Failed to update listing';
      });

    // Handle delete listing thunk
    builder
      .addCase('listing/deleteListing/fulfilled', (state: ListingState, action: PayloadAction<string>) => {
        state.listings = state.listings.filter(listing => listing.id !== action.payload);
        if (state.currentListing?.id === action.payload) {
          state.currentListing = null;
        }
      });

    // Handle toggle favorite thunk
    builder
      .addCase('listing/toggleFavorite/fulfilled', (state: ListingState, action: PayloadAction<{ is_favorite: boolean }>) => {
        // This will be handled in the thunk with proper listing ID
      });

    // Handle fetch favorites thunk
    builder
      .addCase('listing/fetchFavorites/pending', (state: ListingState) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('listing/fetchFavorites/fulfilled', (state: ListingState, action: PayloadAction<{ listings: Listing[]; pagination: any }>) => {
        state.status = 'success';
        state.favorites = action.payload.listings;
        state.error = null;
      })
      .addCase('listing/fetchFavorites/rejected', (state: ListingState, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch favorites';
      });

    // Handle fetch my listings thunk
    builder
      .addCase('listing/fetchMyListings/pending', (state: ListingState) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('listing/fetchMyListings/fulfilled', (state: ListingState, action: PayloadAction<{ listings: Listing[]; pagination: any }>) => {
        state.status = 'success';
        state.listings = action.payload.listings;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('listing/fetchMyListings/rejected', (state: ListingState, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch my listings';
      });

    // Handle upload images thunk
    builder
      .addCase('listing/uploadImages/pending', (state: ListingState) => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase('listing/uploadImages/fulfilled', (state: ListingState, action: PayloadAction<any[]>) => {
        state.createStatus = 'success';
        state.createError = null;
      })
      .addCase('listing/uploadImages/rejected', (state: ListingState, action: any) => {
        state.createStatus = 'error';
        state.createError = action.payload as string || 'Failed to upload images';
      });

    // Handle increment view count thunk
    builder
      .addCase('listing/incrementViewCount/fulfilled', (state: ListingState, action: PayloadAction<string>) => {
        const listingId = action.payload;
        const index = state.listings.findIndex(listing => listing.id === listingId);
        if (index !== -1) {
          state.listings[index].view_count += 1;
        }
        if (state.currentListing?.id === listingId) {
          state.currentListing.view_count += 1;
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
  setCurrentListing,
  updateFilters,
  resetFilters,
  clearListings,
  updateListingLocal,
  removeListingLocal,
  toggleFavoriteLocal,
} = listingSlice.actions;

export default listingSlice.reducer;
