import type { RootState } from '../../store';
import type { UserState, UserProfile, UserStats } from './types/user';

// Basic selectors
export const selectUserState = (state: RootState): UserState => state.user;

export const selectUserProfile = (state: RootState): UserProfile | null => state.user.profile;

export const selectUserStats = (state: RootState): UserStats | null => state.user.stats;

export const selectUserStatus = (state: RootState): UserState['status'] => state.user.status;

export const selectUserError = (state: RootState): string | null => state.user.error ?? null;

export const selectUserUpdateStatus = (state: RootState): UserState['updateStatus'] => state.user.updateStatus;

export const selectUserUpdateError = (state: RootState): string | null => state.user.updateError ?? null;

// Derived selectors
export const selectIsUserLoading = (state: RootState): boolean => state.user.status === 'loading';

export const selectIsUserError = (state: RootState): boolean => state.user.status === 'error';

export const selectIsUserSuccess = (state: RootState): boolean => state.user.status === 'success';

export const selectIsUserIdle = (state: RootState): boolean => state.user.status === 'idle';

export const selectIsUserUpdating = (state: RootState): boolean => state.user.updateStatus === 'loading';

export const selectIsUserUpdateError = (state: RootState): boolean => state.user.updateStatus === 'error';

export const selectIsUserUpdateSuccess = (state: RootState): boolean => state.user.updateStatus === 'success';

// Profile-specific selectors
export const selectUserId = (state: RootState): string | null => state.user.profile?.id ?? null;

export const selectUserName = (state: RootState): string | null => state.user.profile?.name ?? null;

export const selectUserBio = (state: RootState): string | null => state.user.profile?.bio ?? null;

export const selectUserAvatar = (state: RootState): string | null => state.user.profile?.avatar ?? null;

export const selectUserLocation = (state: RootState) => state.user.profile?.location ?? null;

export const selectIsSellerMode = (state: RootState): boolean => state.user.profile?.seller_mode ?? false;

export const selectUserRating = (state: RootState): number | null => state.user.profile?.rating ?? null;

export const selectUserReviewCount = (state: RootState): number | null => state.user.profile?.review_count ?? null;

export const selectUserResponseRate = (state: RootState): number | null => state.user.profile?.response_rate ?? null;

export const selectUserAvgResponseTime = (state: RootState): number | null => state.user.profile?.avg_response_time ?? null;

export const selectUserVerificationStatus = (state: RootState): string | null => state.user.profile?.verification_status ?? null;

// Stats-specific selectors
export const selectTotalListings = (state: RootState): number => state.user.stats?.total_listings ?? 0;

export const selectActiveListings = (state: RootState): number => state.user.stats?.active_listings ?? 0;

export const selectSoldItems = (state: RootState): number => state.user.stats?.sold_items ?? 0;

export const selectPurchasedItems = (state: RootState): number => state.user.stats?.purchased_items ?? 0;

export const selectTotalRevenue = (state: RootState): number => state.user.stats?.total_revenue ?? 0;

export const selectAvgRating = (state: RootState): number => state.user.stats?.avg_rating ?? 0;

export const selectMemberSince = (state: RootState): string | null => state.user.stats?.member_since ?? null;

// Complex selectors
export const selectUserInfo = (state: RootState) => ({
  profile: selectUserProfile(state),
  stats: selectUserStats(state),
  status: selectUserStatus(state),
  updateStatus: selectUserUpdateStatus(state),
  error: selectUserError(state),
  updateError: selectUserUpdateError(state),
});

export const selectSellerInfo = (state: RootState) => {
  const profile = selectUserProfile(state);
  const stats = selectUserStats(state);
  
  if (!profile || !profile.seller_mode) return null;
  
  return {
    name: profile.name,
    avatar: profile.avatar,
    rating: profile.rating,
    reviewCount: profile.review_count,
    responseRate: profile.response_rate,
    avgResponseTime: profile.avg_response_time,
    verificationStatus: profile.verification_status,
    totalListings: stats?.total_listings ?? 0,
    activeListings: stats?.active_listings ?? 0,
    soldItems: stats?.sold_items ?? 0,
    totalRevenue: stats?.total_revenue ?? 0,
    memberSince: stats?.member_since ?? null,
  };
};

export const selectProfileCompletion = (state: RootState): number => {
  const profile = selectUserProfile(state);
  if (!profile) return 0;
  
  let completedFields = 0;
  const totalFields = 6; // name, bio, avatar, location, verification_status, seller_mode
  
  if (profile.name) completedFields++;
  if (profile.bio) completedFields++;
  if (profile.avatar) completedFields++;
  if (profile.location && (profile.location.city || profile.location.state)) completedFields++;
  if (profile.verification_status) completedFields++;
  if (profile.seller_mode !== undefined) completedFields++;
  
  return Math.round((completedFields / totalFields) * 100);
};
