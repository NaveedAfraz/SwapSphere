import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ReviewStateType, Review, Rating } from './types/review';

const initialState: ReviewStateType = {
  reviews: [],
  currentReview: null,
  myReviews: [],
  receivedReviews: [],
  listingReviews: [],
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

const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state: ReviewStateType) => {
      state.error = null;
    },
    clearCreateError: (state: ReviewStateType) => {
      state.createError = null;
    },
    clearUpdateError: (state: ReviewStateType) => {
      state.updateError = null;
    },
    resetCreateStatus: (state: ReviewStateType) => {
      state.createStatus = 'idle';
      state.createError = null;
    },
    resetUpdateStatus: (state: ReviewStateType) => {
      state.updateStatus = 'idle';
      state.updateError = null;
    },
    setCurrentReview: (state: ReviewStateType, action: PayloadAction<Review | null>) => {
      state.currentReview = action.payload;
    },
    updateFilters: (state: ReviewStateType, action: PayloadAction<any>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state: ReviewStateType) => {
      state.filters = {
        sortBy: 'created_at',
        sortOrder: 'desc',
      };
    },
    clearReviews: (state: ReviewStateType) => {
      state.reviews = [];
      state.myReviews = [];
      state.receivedReviews = [];
      state.listingReviews = [];
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
      };
    },
    updateReviewLocal: (state: ReviewStateType, action: PayloadAction<{ id: string; updates: Partial<Review> }>) => {
      const { id, updates } = action.payload;
      
      // Update in main reviews array
      const index = state.reviews.findIndex(review => review.id === id);
      if (index !== -1) {
        state.reviews[index] = { ...state.reviews[index], ...updates };
      }
      
      // Update in my reviews
      const myIndex = state.myReviews.findIndex(review => review.id === id);
      if (myIndex !== -1) {
        state.myReviews[myIndex] = { ...state.myReviews[myIndex], ...updates };
      }
      
      // Update in received reviews
      const receivedIndex = state.receivedReviews.findIndex(review => review.id === id);
      if (receivedIndex !== -1) {
        state.receivedReviews[receivedIndex] = { ...state.receivedReviews[receivedIndex], ...updates };
      }
      
      // Update in listing reviews
      const listingIndex = state.listingReviews.findIndex(review => review.id === id);
      if (listingIndex !== -1) {
        state.listingReviews[listingIndex] = { ...state.listingReviews[listingIndex], ...updates };
      }
      
      // Update current review
      if (state.currentReview?.id === id) {
        state.currentReview = { ...state.currentReview, ...updates };
      }
    },
    removeReviewLocal: (state: ReviewStateType, action: PayloadAction<string>) => {
      const reviewId = action.payload;
      state.reviews = state.reviews.filter(review => review.id !== reviewId);
      state.myReviews = state.myReviews.filter(review => review.id !== reviewId);
      state.receivedReviews = state.receivedReviews.filter(review => review.id !== reviewId);
      state.listingReviews = state.listingReviews.filter(review => review.id !== reviewId);
      if (state.currentReview?.id === reviewId) {
        state.currentReview = null;
      }
    },
    addReview: (state: ReviewStateType, action: PayloadAction<Review>) => {
      state.reviews.unshift(action.payload);
      state.myReviews.unshift(action.payload);
    },
    incrementHelpfulCount: (state: ReviewStateType, action: PayloadAction<string>) => {
      const reviewId = action.payload;
      const updateInArray = (array: Review[]) => {
        const index = array.findIndex(review => review.id === reviewId);
        if (index !== -1) {
          array[index].helpful_count += 1;
        }
      };
      
      updateInArray(state.reviews);
      updateInArray(state.myReviews);
      updateInArray(state.receivedReviews);
      updateInArray(state.listingReviews);
      
      if (state.currentReview?.id === reviewId) {
        state.currentReview.helpful_count += 1;
      }
    },
    decrementHelpfulCount: (state: ReviewStateType, action: PayloadAction<string>) => {
      const reviewId = action.payload;
      const updateInArray = (array: Review[]) => {
        const index = array.findIndex(review => review.id === reviewId);
        if (index !== -1 && array[index].helpful_count > 0) {
          array[index].helpful_count -= 1;
        }
      };
      
      updateInArray(state.reviews);
      updateInArray(state.myReviews);
      updateInArray(state.receivedReviews);
      updateInArray(state.listingReviews);
      
      if (state.currentReview?.id === reviewId && state.currentReview.helpful_count > 0) {
        state.currentReview.helpful_count -= 1;
      }
    },
  },
  extraReducers: (builder: any) => {
    // Handle fetch reviews thunk
    builder
      .addCase('review/fetchReviews/pending', (state: ReviewStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('review/fetchReviews/fulfilled', (state: ReviewStateType, action: PayloadAction<{ reviews: Review[]; pagination: any }>) => {
        state.status = 'success';
        state.reviews = action.payload.reviews;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('review/fetchReviews/rejected', (state: ReviewStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch reviews';
      });

    // Handle fetch review by ID thunk
    builder
      .addCase('review/fetchReviewById/pending', (state: ReviewStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('review/fetchReviewById/fulfilled', (state: ReviewStateType, action: PayloadAction<{ review: Review }>) => {
        state.status = 'success';
        state.currentReview = action.payload.review;
        state.error = null;
      })
      .addCase('review/fetchReviewById/rejected', (state: ReviewStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch review';
      });

    // Handle create review thunk
    builder
      .addCase('review/createReview/pending', (state: ReviewStateType) => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase('review/createReview/fulfilled', (state: ReviewStateType, action: PayloadAction<{ review: Review }>) => {
        state.createStatus = 'success';
        state.reviews.unshift(action.payload.review);
        state.myReviews.unshift(action.payload.review);
        state.createError = null;
      })
      .addCase('review/createReview/rejected', (state: ReviewStateType, action: any) => {
        state.createStatus = 'error';
        state.createError = action.payload as string || 'Failed to create review';
      });

    // Handle update review thunk
    builder
      .addCase('review/updateReview/pending', (state: ReviewStateType) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase('review/updateReview/fulfilled', (state: ReviewStateType, action: PayloadAction<{ review: Review }>) => {
        state.updateStatus = 'success';
        const updatedReview = action.payload.review;
        
        // Update in all arrays
        const updateInArray = (array: Review[]) => {
          const index = array.findIndex(review => review.id === updatedReview.id);
          if (index !== -1) {
            array[index] = updatedReview;
          }
        };
        
        updateInArray(state.reviews);
        updateInArray(state.myReviews);
        updateInArray(state.receivedReviews);
        updateInArray(state.listingReviews);
        
        if (state.currentReview?.id === updatedReview.id) {
          state.currentReview = updatedReview;
        }
        
        state.updateError = null;
      })
      .addCase('review/updateReview/rejected', (state: ReviewStateType, action: any) => {
        state.updateStatus = 'error';
        state.updateError = action.payload as string || 'Failed to update review';
      });

    // Handle delete review thunk
    builder
      .addCase('review/deleteReview/fulfilled', (state: ReviewStateType, action: PayloadAction<string>) => {
        const reviewId = action.payload;
        state.reviews = state.reviews.filter(review => review.id !== reviewId);
        state.myReviews = state.myReviews.filter(review => review.id !== reviewId);
        state.receivedReviews = state.receivedReviews.filter(review => review.id !== reviewId);
        state.listingReviews = state.listingReviews.filter(review => review.id !== reviewId);
        if (state.currentReview?.id === reviewId) {
          state.currentReview = null;
        }
      });

    // Handle respond to review thunk
    builder
      .addCase('review/respondToReview/fulfilled', (state: ReviewStateType, action: PayloadAction<{ review: Review }>) => {
        const updatedReview = action.payload.review;
        const updateInArray = (array: Review[]) => {
          const index = array.findIndex(review => review.id === updatedReview.id);
          if (index !== -1) {
            array[index] = updatedReview;
          }
        };
        
        updateInArray(state.reviews);
        updateInArray(state.myReviews);
        updateInArray(state.receivedReviews);
        updateInArray(state.listingReviews);
        
        if (state.currentReview?.id === updatedReview.id) {
          state.currentReview = updatedReview;
        }
      });

    // Handle mark review helpful thunk
    builder
      .addCase('review/markReviewHelpful/fulfilled', (state: ReviewStateType, action: PayloadAction<{ review: Review }>) => {
        const updatedReview = action.payload.review;
        const updateInArray = (array: Review[]) => {
          const index = array.findIndex(review => review.id === updatedReview.id);
          if (index !== -1) {
            array[index].helpful_count = updatedReview.helpful_count;
          }
        };
        
        updateInArray(state.reviews);
        updateInArray(state.myReviews);
        updateInArray(state.receivedReviews);
        updateInArray(state.listingReviews);
        
        if (state.currentReview?.id === updatedReview.id) {
          state.currentReview.helpful_count = updatedReview.helpful_count;
        }
      });

    // Handle unmark review helpful thunk
    builder
      .addCase('review/unmarkReviewHelpful/fulfilled', (state: ReviewStateType, action: PayloadAction<{ review: Review }>) => {
        const updatedReview = action.payload.review;
        const updateInArray = (array: Review[]) => {
          const index = array.findIndex(review => review.id === updatedReview.id);
          if (index !== -1) {
            array[index].helpful_count = updatedReview.helpful_count;
          }
        };
        
        updateInArray(state.reviews);
        updateInArray(state.myReviews);
        updateInArray(state.receivedReviews);
        updateInArray(state.listingReviews);
        
        if (state.currentReview?.id === updatedReview.id) {
          state.currentReview.helpful_count = updatedReview.helpful_count;
        }
      });

    // Handle fetch my reviews thunk
    builder
      .addCase('review/fetchMyReviews/pending', (state: ReviewStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('review/fetchMyReviews/fulfilled', (state: ReviewStateType, action: PayloadAction<{ reviews: Review[]; pagination: any }>) => {
        state.status = 'success';
        state.myReviews = action.payload.reviews;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('review/fetchMyReviews/rejected', (state: ReviewStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch my reviews';
      });

    // Handle fetch received reviews thunk
    builder
      .addCase('review/fetchReceivedReviews/pending', (state: ReviewStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('review/fetchReceivedReviews/fulfilled', (state: ReviewStateType, action: PayloadAction<{ reviews: Review[]; pagination: any }>) => {
        state.status = 'success';
        state.receivedReviews = action.payload.reviews;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('review/fetchReceivedReviews/rejected', (state: ReviewStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch received reviews';
      });

    // Handle fetch reviews by listing thunk
    builder
      .addCase('review/fetchReviewsByListing/pending', (state: ReviewStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('review/fetchReviewsByListing/fulfilled', (state: ReviewStateType, action: PayloadAction<{ reviews: Review[]; pagination: any }>) => {
        state.status = 'success';
        state.listingReviews = action.payload.reviews;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('review/fetchReviewsByListing/rejected', (state: ReviewStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch reviews for listing';
      });
  },
});

export const {
  clearError,
  clearCreateError,
  clearUpdateError,
  resetCreateStatus,
  resetUpdateStatus,
  setCurrentReview,
  updateFilters,
  resetFilters,
  clearReviews,
  updateReviewLocal,
  removeReviewLocal,
  addReview,
  incrementHelpfulCount,
  decrementHelpfulCount,
} = reviewSlice.actions;

export default reviewSlice.reducer;
