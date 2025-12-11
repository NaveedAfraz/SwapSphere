import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, AuthUser } from './types/auth';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state: AuthState) => {
      state.error = null;
    },
    logout: (state: AuthState) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.status = 'idle';
      state.error = null;
    },
    setCredentials: (state: AuthState, action: PayloadAction<{ user: AuthUser; token: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.token;
      state.status = 'authenticated';
      state.error = null;
    },
    updateUser: (state: AuthState, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder: any) => {
    // Handle login thunk
    builder
      .addCase('auth/login/pending', (state: AuthState) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('auth/login/fulfilled', (state: AuthState, action: PayloadAction<AuthUser & { token: string }>) => {
        state.status = 'authenticated';
        state.user = {
          id: action.payload.id,
          email: action.payload.email,
          phone: action.payload.phone,
          token: action.payload.token,
          sellerMode: action.payload.sellerMode,
          profileCompleted: action.payload.profileCompleted,
        };
        state.accessToken = action.payload.token;
        state.error = null;
      })
      .addCase('auth/login/rejected', (state: AuthState, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Login failed';
      });

    // Handle register thunk
    builder
      .addCase('auth/register/pending', (state: AuthState) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('auth/register/fulfilled', (state: AuthState, action: PayloadAction<AuthUser & { token: string }>) => {
        state.status = 'authenticated';
        state.user = {
          id: action.payload.id,
          email: action.payload.email,
          phone: action.payload.phone,
          token: action.payload.token,
          sellerMode: action.payload.sellerMode,
          profileCompleted: action.payload.profileCompleted,
        };
        state.accessToken = action.payload.token;
        state.error = null;
      })
      .addCase('auth/register/rejected', (state: AuthState, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Registration failed';
      });

    // Handle Google auth thunk
    builder
      .addCase('auth/google/pending', (state: AuthState) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('auth/google/fulfilled', (state: AuthState, action: PayloadAction<AuthUser & { token: string }>) => {
        state.status = 'authenticated';
        state.user = {
          id: action.payload.id,
          email: action.payload.email,
          phone: action.payload.phone,
          token: action.payload.token,
          sellerMode: action.payload.sellerMode,
          profileCompleted: action.payload.profileCompleted,
        };
        state.accessToken = action.payload.token;
        state.error = null;
      })
      .addCase('auth/google/rejected', (state: AuthState, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Google auth failed';
      });

    // Handle profile setup thunk
    builder
      .addCase('auth/updateProfile/pending', (state: AuthState) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('auth/updateProfile/fulfilled', (state: AuthState, action: any) => {
        state.status = 'authenticated';
        // Update user with profile data and tokens
        if (action.payload.user) {
          state.user = {
            id: action.payload.user.id,
            email: action.payload.user.email,
            phone: action.payload.user.phone,
            token: action.payload.token,
            sellerMode: action.payload.user.profile?.seller_mode || false,
            profileCompleted: true,
          };
        }
        state.accessToken = action.payload.token;
        state.refreshToken = action.payload.refreshToken || null;
        state.error = null;
      })
      .addCase('auth/updateProfile/rejected', (state: AuthState, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Profile setup failed';
      });
  },
});

export const { clearError, logout, setCredentials, updateUser } = authSlice.actions;
export default authSlice.reducer;