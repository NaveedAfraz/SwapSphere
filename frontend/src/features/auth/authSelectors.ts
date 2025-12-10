import type { RootState } from '@/src/lib/store/index';
import type { AuthState, AuthUser } from './types/auth';

// Basic selectors
export const selectAuthState = (state: RootState): AuthState => state.auth;

export const selectUser = (state: RootState): AuthUser | null => state.auth.user;

export const selectIsAuthenticated = (state: RootState): boolean => 
  state.auth.status === 'authenticated' && state.auth.user !== null;

export const selectAuthStatus = (state: RootState): AuthState['status'] => state.auth.status;

export const selectAuthError = (state: RootState): string | null => state.auth.error ?? null;

export const selectAccessToken = (state: RootState): string | null => state.auth.accessToken;

export const selectRefreshToken = (state: RootState): string | null => state.auth.refreshToken;

// Derived selectors
export const selectIsLoading = (state: RootState): boolean => state.auth.status === 'loading';

export const selectIsError = (state: RootState): boolean => state.auth.status === 'error';

export const selectIsIdle = (state: RootState): boolean => state.auth.status === 'idle';

export const selectUserId = (state: RootState): string | null => state.auth.user?.id ?? null;

export const selectUserEmail = (state: RootState): string | null => state.auth.user?.email ?? null;

export const selectUserPhone = (state: RootState): string | null => state.auth.user?.phone ?? null;

export const selectIsSellerMode = (state: RootState): boolean => 
  state.auth.user?.sellerMode ?? false;

export const selectIsProfileCompleted = (state: RootState): boolean => 
  state.auth.user?.profileCompleted ?? false;

// Complex selectors
export const selectAuthInfo = (state: RootState) => ({
  isAuthenticated: selectIsAuthenticated(state),
  isLoading: selectIsLoading(state),
  error: selectAuthError(state),
  user: selectUser(state),
  status: selectAuthStatus(state),
});

export const selectUserProfile = (state: RootState) => {
  const user = selectUser(state);
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    sellerMode: user.sellerMode,
    profileCompleted: user.profileCompleted,
  };
};