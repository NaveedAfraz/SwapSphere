import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ProfileStateType, Profile, VerificationStatus } from './types/profile';

const initialState: ProfileStateType = {
  currentProfile: null,
  publicProfile: null,
  status: 'idle',
  error: null,
  updateStatus: 'idle',
  updateError: null,
  verificationStatus: 'idle',
  verificationError: null,
  uploadStatus: 'idle',
  uploadError: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state: ProfileStateType) => {
      state.error = null;
    },
    clearUpdateError: (state: ProfileStateType) => {
      state.updateError = null;
    },
    clearVerificationError: (state: ProfileStateType) => {
      state.verificationError = null;
    },
    clearUploadError: (state: ProfileStateType) => {
      state.uploadError = null;
    },
    resetUpdateStatus: (state: ProfileStateType) => {
      state.updateStatus = 'idle';
      state.updateError = null;
    },
    resetVerificationStatus: (state: ProfileStateType) => {
      state.verificationStatus = 'idle';
      state.verificationError = null;
    },
    resetUploadStatus: (state: ProfileStateType) => {
      state.uploadStatus = 'idle';
      state.uploadError = null;
    },
    setCurrentProfile: (state: ProfileStateType, action: PayloadAction<Profile | null>) => {
      state.currentProfile = action.payload;
    },
    setPublicProfile: (state: ProfileStateType, action: PayloadAction<Profile | null>) => {
      state.publicProfile = action.payload;
    },
    updateProfileLocal: (state: ProfileStateType, action: PayloadAction<Partial<Profile>>) => {
      if (state.currentProfile) {
        state.currentProfile = { ...state.currentProfile, ...action.payload };
      }
    },
    updateSellerInfoLocal: (state: ProfileStateType, action: PayloadAction<Partial<Profile['seller_info']>>) => {
      if (state.currentProfile?.seller_info) {
        state.currentProfile.seller_info = { ...state.currentProfile.seller_info, ...action.payload };
      }
    },
    updatePreferencesLocal: (state: ProfileStateType, action: PayloadAction<Partial<Profile['preferences']>>) => {
      if (state.currentProfile?.preferences) {
        state.currentProfile.preferences = { ...state.currentProfile.preferences, ...action.payload };
      }
    },
    updateStatsLocal: (state: ProfileStateType, action: PayloadAction<Partial<Profile['stats']>>) => {
      if (state.currentProfile?.stats) {
        state.currentProfile.stats = { ...state.currentProfile.stats, ...action.payload };
      }
    },
    clearProfiles: (state: ProfileStateType) => {
      state.currentProfile = null;
      state.publicProfile = null;
    },
  },
  extraReducers: (builder: any) => {
    // Handle fetch my profile thunk
    builder
      .addCase('profile/fetchMyProfile/pending', (state: ProfileStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('profile/fetchMyProfile/fulfilled', (state: ProfileStateType, action: PayloadAction<{ profile: Profile }>) => {
        state.status = 'success';
        state.currentProfile = action.payload.profile;
        state.error = null;
      })
      .addCase('profile/fetchMyProfile/rejected', (state: ProfileStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch profile';
      });

    // Handle fetch public profile thunk
    builder
      .addCase('profile/fetchPublicProfile/pending', (state: ProfileStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('profile/fetchPublicProfile/fulfilled', (state: ProfileStateType, action: PayloadAction<{ profile: Profile }>) => {
        state.status = 'success';
        state.publicProfile = action.payload.profile;
        state.error = null;
      })
      .addCase('profile/fetchPublicProfile/rejected', (state: ProfileStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch public profile';
      });

    // Handle update profile thunk
    builder
      .addCase('profile/updateProfile/pending', (state: ProfileStateType) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase('profile/updateProfile/fulfilled', (state: ProfileStateType, action: PayloadAction<{ profile: Profile }>) => {
        state.updateStatus = 'success';
        state.currentProfile = action.payload.profile;
        state.updateError = null;
      })
      .addCase('profile/updateProfile/rejected', (state: ProfileStateType, action: any) => {
        state.updateStatus = 'error';
        state.updateError = action.payload as string || 'Failed to update profile';
      });

    // Handle update seller info thunk
    builder
      .addCase('profile/updateSellerInfo/pending', (state: ProfileStateType) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase('profile/updateSellerInfo/fulfilled', (state: ProfileStateType, action: PayloadAction<{ profile: Profile }>) => {
        state.updateStatus = 'success';
        state.currentProfile = action.payload.profile;
        state.updateError = null;
      })
      .addCase('profile/updateSellerInfo/rejected', (state: ProfileStateType, action: any) => {
        state.updateStatus = 'error';
        state.updateError = action.payload as string || 'Failed to update seller info';
      });

    // Handle upload avatar thunk
    builder
      .addCase('profile/uploadAvatar/pending', (state: ProfileStateType) => {
        state.uploadStatus = 'loading';
        state.uploadError = null;
      })
      .addCase('profile/uploadAvatar/fulfilled', (state: ProfileStateType, action: PayloadAction<{ profile: Profile }>) => {
        state.uploadStatus = 'success';
        state.currentProfile = action.payload.profile;
        state.uploadError = null;
      })
      .addCase('profile/uploadAvatar/rejected', (state: ProfileStateType, action: any) => {
        state.uploadStatus = 'error';
        state.uploadError = action.payload as string || 'Failed to upload avatar';
      });

    // Handle upload cover image thunk
    builder
      .addCase('profile/uploadCoverImage/pending', (state: ProfileStateType) => {
        state.uploadStatus = 'loading';
        state.uploadError = null;
      })
      .addCase('profile/uploadCoverImage/fulfilled', (state: ProfileStateType, action: PayloadAction<{ profile: Profile }>) => {
        state.uploadStatus = 'success';
        state.currentProfile = action.payload.profile;
        state.uploadError = null;
      })
      .addCase('profile/uploadCoverImage/rejected', (state: ProfileStateType, action: any) => {
        state.uploadStatus = 'error';
        state.uploadError = action.payload as string || 'Failed to upload cover image';
      });

    // Handle submit verification thunk
    builder
      .addCase('profile/submitVerification/pending', (state: ProfileStateType) => {
        state.verificationStatus = 'loading';
        state.verificationError = null;
      })
      .addCase('profile/submitVerification/fulfilled', (state: ProfileStateType, action: PayloadAction<{ status: VerificationStatus; message?: string }>) => {
        state.verificationStatus = 'success';
        if (state.currentProfile) {
          state.currentProfile.verification_status = action.payload.status;
          if (action.payload.status === 'pending') {
            state.currentProfile.verification_documents = [];
          }
        }
        state.verificationError = null;
      })
      .addCase('profile/submitVerification/rejected', (state: ProfileStateType, action: any) => {
        state.verificationStatus = 'error';
        state.verificationError = action.payload as string || 'Failed to submit verification';
      });

    // Handle fetch profile stats thunk
    builder
      .addCase('profile/fetchProfileStats/fulfilled', (state: ProfileStateType, action: PayloadAction<{ stats: any }>) => {
        if (state.currentProfile) {
          state.currentProfile.stats = action.payload.stats;
        }
      });

    // Handle toggle seller mode thunk
    builder
      .addCase('profile/toggleSellerMode/fulfilled', (state: ProfileStateType, action: PayloadAction<{ profile: Profile }>) => {
        state.currentProfile = action.payload.profile;
      });

    // Handle deactivate profile thunk
    builder
      .addCase('profile/deactivateProfile/fulfilled', (state: ProfileStateType, action: PayloadAction<{ profile: Profile }>) => {
        state.currentProfile = action.payload.profile;
      });
  },
});

export const {
  clearError,
  clearUpdateError,
  clearVerificationError,
  clearUploadError,
  resetUpdateStatus,
  resetVerificationStatus,
  resetUploadStatus,
  setCurrentProfile,
  setPublicProfile,
  updateProfileLocal,
  updateSellerInfoLocal,
  updatePreferencesLocal,
  updateStatsLocal,
  clearProfiles,
} = profileSlice.actions;

export default profileSlice.reducer;
