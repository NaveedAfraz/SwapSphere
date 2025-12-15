import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserState, UserProfile, UserStats, UserResponse } from './types/user';

const initialState: UserState = {
  profile: null,
  stats: null,
  status: 'idle',
  error: null,
  updateStatus: 'idle',
  updateError: null,
  fetchedUser: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state: UserState) => {
      state.error = null;
    },
    clearUpdateError: (state: UserState) => {
      state.updateError = null;
    },
    resetUpdateStatus: (state: UserState) => {
      state.updateStatus = 'idle';
      state.updateError = null;
    },
    updateProfileLocal: (state: UserState, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    clearUserState: (state: UserState) => {
      state.profile = null;
      state.stats = null;
      state.status = 'idle';
      state.error = null;
      state.updateStatus = 'idle';
      state.updateError = null;
    },
  },
  extraReducers: (builder: any) => {
    // Handle get profile thunk
    builder
      .addCase('user/getProfile/pending', (state: UserState) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('user/getProfile/fulfilled', (state: UserState, action: PayloadAction<{ user: UserProfile; stats?: UserStats }>) => {
        state.status = 'success';
        state.profile = action.payload.user;
        if (action.payload.stats) {
          state.stats = action.payload.stats;
        }
        state.error = null;
      })
      .addCase('user/getProfile/rejected', (state: UserState, action: PayloadAction<string>) => {
        state.status = 'error';
        state.error = action.payload;
      })

      // Handle get user by ID thunk
      .addCase('user/getById/pending', (state: UserState) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('user/getById/fulfilled', (state: UserState, action: PayloadAction<UserResponse>) => {
        state.status = 'success';
        state.fetchedUser = action.payload.user;
        state.error = null;
      })
      .addCase('user/getById/rejected', (state: UserState, action: PayloadAction<string>) => {
        state.status = 'error';
        state.error = action.payload;
      })

    // Handle update profile thunk
    builder
      .addCase('user/updateProfile/pending', (state: UserState) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase('user/updateProfile/fulfilled', (state: UserState, action: PayloadAction<{ user: UserProfile }>) => {
        state.updateStatus = 'success';
        state.profile = action.payload.user;
        state.updateError = null;
      })
      .addCase('user/updateProfile/rejected', (state: UserState, action: any) => {
        state.updateStatus = 'error';
        state.updateError = action.payload as string || 'Failed to update profile';
      });

    // Handle toggle seller mode thunk
    builder
      .addCase('user/toggleSellerMode/pending', (state: UserState) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase('user/toggleSellerMode/fulfilled', (state: UserState, action: PayloadAction<{ seller_mode: boolean }>) => {
        state.updateStatus = 'success';
        if (state.profile) {
          state.profile.seller_mode = action.payload.seller_mode;
        }
        state.updateError = null;
      })
      .addCase('user/toggleSellerMode/rejected', (state: UserState, action: any) => {
        state.updateStatus = 'error';
        state.updateError = action.payload as string || 'Failed to toggle seller mode';
      });

    // Handle get stats thunk
    builder
      .addCase('user/getStats/pending', (state: UserState) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('user/getStats/fulfilled', (state: UserState, action: PayloadAction<UserStats>) => {
        state.status = 'success';
        state.stats = action.payload;
        state.error = null;
      })
      .addCase('user/getStats/rejected', (state: UserState, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch stats';
      });

    // Handle upload avatar thunk
    builder
      .addCase('user/uploadAvatar/pending', (state: UserState) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase('user/uploadAvatar/fulfilled', (state: UserState, action: PayloadAction<{ avatar_url: string }>) => {
        state.updateStatus = 'success';
        if (state.profile) {
          state.profile.avatar = action.payload.avatar_url;
        }
        state.updateError = null;
      })
      .addCase('user/uploadAvatar/rejected', (state: UserState, action: any) => {
        state.updateStatus = 'error';
        state.updateError = action.payload as string || 'Failed to upload avatar';
      });

    // Handle deactivate account thunk
    builder
      .addCase('user/deactivateAccount/pending', (state: UserState) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('user/deactivateAccount/fulfilled', (state: UserState) => {
        state.status = 'success';
        // Clear user state after successful deactivation
        state.profile = null;
        state.stats = null;
        state.error = null;
      })
      .addCase('user/deactivateAccount/rejected', (state: UserState, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to deactivate account';
      });
  },
});

export const { 
  clearError, 
  clearUpdateError, 
  resetUpdateStatus, 
  updateProfileLocal, 
  clearUserState 
} = userSlice.actions;

export default userSlice.reducer;
