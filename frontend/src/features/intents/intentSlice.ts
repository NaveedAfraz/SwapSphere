import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Intent, IntentListResponse } from './types/intent';
import {
  createIntentThunk,
  getIntentsThunk,
  getIntentThunk,
  updateIntentThunk,
  deleteIntentThunk,
  searchIntentsThunk,
} from './intentThunks';

interface IntentState {
  intents: Intent[];
  currentIntent: Intent | null;
  searchResults: Intent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  searchPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  createStatus: 'idle' | 'creating' | 'succeeded' | 'failed';
  updateStatus: 'idle' | 'updating' | 'succeeded' | 'failed';
  deleteStatus: 'idle' | 'deleting' | 'succeeded' | 'failed';
  error: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
}

const initialState: IntentState = {
  intents: [],
  currentIntent: null,
  searchResults: [],
  pagination: null,
  searchPagination: null,
  status: 'idle',
  createStatus: 'idle',
  updateStatus: 'idle',
  deleteStatus: 'idle',
  error: null,
  createError: null,
  updateError: null,
  deleteError: null,
};

const intentSlice = createSlice({
  name: 'intents',
  initialState,
  reducers: {
    clearCurrentIntent: (state) => {
      state.currentIntent = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchPagination = null;
    },
    clearErrors: (state) => {
      state.error = null;
      state.createError = null;
      state.updateError = null;
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    // Create Intent
    builder
      .addCase(createIntentThunk.pending, (state) => {
        state.createStatus = 'creating';
        state.createError = null;
      })
      .addCase(createIntentThunk.fulfilled, (state, action: PayloadAction<Intent>) => {
        state.createStatus = 'succeeded';
        state.intents.unshift(action.payload);
      })
      .addCase(createIntentThunk.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.createError = action.payload || 'Failed to create intent';
      });

    // Get Intents
    builder
      .addCase(getIntentsThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getIntentsThunk.fulfilled, (state, action: PayloadAction<IntentListResponse>) => {
        state.status = 'succeeded';
        state.intents = action.payload.intents;
        state.pagination = action.payload.pagination;
      })
      .addCase(getIntentsThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch intents';
      });

    // Get Single Intent
    builder
      .addCase(getIntentThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getIntentThunk.fulfilled, (state, action: PayloadAction<Intent>) => {
        state.status = 'succeeded';
        state.currentIntent = action.payload;
      })
      .addCase(getIntentThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch intent';
      });

    // Update Intent
    builder
      .addCase(updateIntentThunk.pending, (state) => {
        state.updateStatus = 'updating';
        state.updateError = null;
      })
      .addCase(updateIntentThunk.fulfilled, (state, action: PayloadAction<Intent>) => {
        state.updateStatus = 'succeeded';
        const index = state.intents.findIndex(intent => intent.id === action.payload.id);
        if (index !== -1) {
          state.intents[index] = action.payload;
        }
        if (state.currentIntent?.id === action.payload.id) {
          state.currentIntent = action.payload;
        }
      })
      .addCase(updateIntentThunk.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.updateError = action.payload || 'Failed to update intent';
      });

    // Delete Intent
    builder
      .addCase(deleteIntentThunk.pending, (state) => {
        state.deleteStatus = 'deleting';
        state.deleteError = null;
      })
      .addCase(deleteIntentThunk.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded';
        state.intents = state.intents.filter(intent => intent.id !== action.payload.intent.id);
        if (state.currentIntent?.id === action.payload.intent.id) {
          state.currentIntent = null;
        }
      })
      .addCase(deleteIntentThunk.rejected, (state, action) => {
        state.deleteStatus = 'failed';
        state.deleteError = action.payload || 'Failed to delete intent';
      });

    // Search Intents
    builder
      .addCase(searchIntentsThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(searchIntentsThunk.fulfilled, (state, action: PayloadAction<IntentListResponse>) => {
        state.status = 'succeeded';
        state.searchResults = action.payload.intents;
        state.searchPagination = action.payload.pagination;
      })
      .addCase(searchIntentsThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to search intents';
      });
  },
});

export const { clearCurrentIntent, clearSearchResults, clearErrors } = intentSlice.actions;

// Minimal selectors
export const selectIntents = (state: { intents: IntentState }) => state.intents.intents;
export const selectCurrentIntent = (state: { intents: IntentState }) => state.intents.currentIntent;
export const selectSearchResults = (state: { intents: IntentState }) => state.intents.searchResults;
export const selectIntentPagination = (state: { intents: IntentState }) => state.intents.pagination;
export const selectIntentStatus = (state: { intents: IntentState }) => state.intents.status;
export const selectCreateStatus = (state: { intents: IntentState }) => state.intents.createStatus;
export const selectUpdateStatus = (state: { intents: IntentState }) => state.intents.updateStatus;
export const selectDeleteStatus = (state: { intents: IntentState }) => state.intents.deleteStatus;
export const selectIntentError = (state: { intents: IntentState }) => state.intents.error;
export const selectCreateError = (state: { intents: IntentState }) => state.intents.createError;
export const selectUpdateError = (state: { intents: IntentState }) => state.intents.updateError;
export const selectDeleteError = (state: { intents: IntentState }) => state.intents.deleteError;

export const isCreating = (state: { intents: IntentState }) => state.intents.createStatus === 'creating';
export const isUpdating = (state: { intents: IntentState }) => state.intents.updateStatus === 'updating';
export const isDeleting = (state: { intents: IntentState }) => state.intents.deleteStatus === 'deleting';
export const isCreateSuccess = (state: { intents: IntentState }) => state.intents.createStatus === 'succeeded';

export default intentSlice.reducer;
