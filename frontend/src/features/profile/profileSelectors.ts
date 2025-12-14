import type { RootState } from '../../store';
import type { ProfileStateType, Profile, VerificationStatus, ProfileVisibility } from './types/profile';

// Basic selectors
export const selectProfileState = (state: RootState): ProfileStateType => state.profile;

export const selectCurrentProfile = (state: RootState): Profile | null => 
  selectProfileState(state).currentProfile;

export const selectPublicProfile = (state: RootState): Profile | null => 
  selectProfileState(state).publicProfile;

export const selectProfileStatus = (state: RootState): string => 
  selectProfileState(state).status;

export const selectProfileError = (state: RootState): string | null => 
  selectProfileState(state).error;

export const selectUpdateStatus = (state: RootState): string => 
  selectProfileState(state).updateStatus;

export const selectUpdateError = (state: RootState): string | null => 
  selectProfileState(state).updateError;

export const selectVerificationStatus = (state: RootState): string => 
  selectProfileState(state).verificationStatus;

export const selectVerificationError = (state: RootState): string | null => 
  selectProfileState(state).verificationError;

export const selectUploadStatus = (state: RootState): string => 
  selectProfileState(state).uploadStatus;

export const selectUploadError = (state: RootState): string | null => 
  selectProfileState(state).uploadError;

// Derived selectors
export const selectIsProfileLoading = (state: RootState): boolean => 
  selectProfileStatus(state) === 'loading';

export const selectIsProfileError = (state: RootState): boolean => 
  selectProfileStatus(state) === 'error';

export const selectIsProfileSuccess = (state: RootState): boolean => 
  selectProfileStatus(state) === 'success';

export const selectIsUpdateLoading = (state: RootState): boolean => 
  selectUpdateStatus(state) === 'loading';

export const selectIsUpdateError = (state: RootState): boolean => 
  selectUpdateStatus(state) === 'error';

export const selectIsUpdateSuccess = (state: RootState): boolean => 
  selectUpdateStatus(state) === 'success';

export const selectIsVerificationLoading = (state: RootState): boolean => 
  selectVerificationStatus(state) === 'loading';

export const selectIsVerificationError = (state: RootState): boolean => 
  selectVerificationStatus(state) === 'error';

export const selectIsVerificationSuccess = (state: RootState): boolean => 
  selectVerificationStatus(state) === 'success';

export const selectIsUploadLoading = (state: RootState): boolean => 
  selectUploadStatus(state) === 'loading';

export const selectIsUploadError = (state: RootState): boolean => 
  selectUploadStatus(state) === 'error';

export const selectIsUploadSuccess = (state: RootState): boolean => 
  selectUploadStatus(state) === 'success';

// Profile-specific selectors
export const selectProfileUsername = (state: RootState): string | undefined => 
  selectCurrentProfile(state)?.username;

export const selectProfileDisplayName = (state: RootState): string | undefined => 
  selectCurrentProfile(state)?.display_name;

export const selectProfileBio = (state: RootState): string | undefined => 
  selectCurrentProfile(state)?.bio;

export const selectProfileAvatar = (state: RootState): string | undefined => 
  selectCurrentProfile(state)?.profile_picture_url || selectCurrentProfile(state)?.avatar_url;

export const selectProfileCoverImage = (state: RootState): string | undefined => 
  selectCurrentProfile(state)?.cover_image_url;

export const selectProfileLocation = (state: RootState): string | undefined => 
  selectCurrentProfile(state)?.location;

export const selectProfileWebsite = (state: RootState): string | undefined => 
  selectCurrentProfile(state)?.website;

export const selectProfileSocialLinks = (state: RootState) => 
  selectCurrentProfile(state)?.social_links;

export const selectProfileVerificationStatus = (state: RootState): VerificationStatus | undefined => 
  selectCurrentProfile(state)?.verification_status;

export const selectProfileIsVerified = (state: RootState): boolean => 
  selectCurrentProfile(state)?.verification_status === 'verified';

export const selectProfileIsSeller = (state: RootState): boolean => 
  selectCurrentProfile(state)?.is_seller || false;

export const selectProfileSellerInfo = (state: RootState) => 
  selectCurrentProfile(state)?.seller_info;

export const selectProfilePreferences = (state: RootState) => 
  selectCurrentProfile(state)?.preferences;

export const selectProfileStats = (state: RootState) => 
  selectCurrentProfile(state)?.stats;

export const selectProfileVisibility = (state: RootState): ProfileVisibility | undefined => 
  selectCurrentProfile(state)?.preferences?.visibility;

export const selectProfileAllowMessages = (state: RootState): boolean => 
  selectCurrentProfile(state)?.preferences?.allow_messages ?? true;

export const selectProfileAllowOffers = (state: RootState): boolean => 
  selectCurrentProfile(state)?.preferences?.allow_offers ?? true;

// Seller-specific selectors
export const selectSellerBusinessName = (state: RootState): string | undefined => 
  selectCurrentProfile(state)?.seller_info?.business_name;

export const selectSellerBusinessDescription = (state: RootState): string | undefined => 
  selectCurrentProfile(state)?.seller_info?.business_description;

export const selectSellerBusinessHours = (state: RootState): string | undefined => 
  selectCurrentProfile(state)?.seller_info?.business_hours;

export const selectSellerResponseRate = (state: RootState): number | undefined => 
  selectCurrentProfile(state)?.seller_info?.response_rate;

export const selectSellerResponseTime = (state: RootState): string | undefined => 
  selectCurrentProfile(state)?.seller_info?.response_time;

export const selectSellerTotalSales = (state: RootState): number | undefined => 
  selectCurrentProfile(state)?.seller_info?.total_sales;

export const selectSellerAverageRating = (state: RootState): number | undefined => 
  selectCurrentProfile(state)?.seller_info?.average_rating;

export const selectSellerTotalReviews = (state: RootState): number | undefined => 
  selectCurrentProfile(state)?.seller_info?.total_reviews;

// Stats selectors
export const selectProfileTotalListings = (state: RootState): number => 
  selectCurrentProfile(state)?.stats?.total_listings || 0;

export const selectProfileActiveListings = (state: RootState): number => 
  selectCurrentProfile(state)?.stats?.active_listings || 0;

export const selectProfileSoldItems = (state: RootState): number => 
  selectCurrentProfile(state)?.stats?.sold_items || 0;

export const selectProfileTotalReviews = (state: RootState): number => 
  selectCurrentProfile(state)?.stats?.total_reviews || 0;

export const selectProfileAverageRating = (state: RootState): number => 
  selectCurrentProfile(state)?.stats?.average_rating || 0;

export const selectProfileMemberSince = (state: RootState): string | undefined => 
  selectCurrentProfile(state)?.stats?.member_since;

export const selectProfileLastActive = (state: RootState): string | undefined => 
  selectCurrentProfile(state)?.stats?.last_active;

// Public profile selectors
export const selectPublicProfileUsername = (state: RootState): string | undefined => 
  selectPublicProfile(state)?.username;

export const selectPublicProfileDisplayName = (state: RootState): string | undefined => 
  selectPublicProfile(state)?.display_name;

export const selectPublicProfileBio = (state: RootState): string | undefined => 
  selectPublicProfile(state)?.bio;

export const selectPublicProfileAvatar = (state: RootState): string | undefined => 
  selectPublicProfile(state)?.avatar_url;

export const selectPublicProfileIsVerified = (state: RootState): boolean => 
  selectPublicProfile(state)?.verification_status === 'verified';

export const selectPublicProfileIsSeller = (state: RootState): boolean => 
  selectPublicProfile(state)?.is_seller || false;

export const selectPublicProfileStats = (state: RootState) => 
  selectPublicProfile(state)?.stats;

// Complex selectors
export const selectProfileCompletion = (state: RootState): number => {
  const profile = selectCurrentProfile(state);
  if (!profile) return 0;

  let completion = 0;
  const totalFields = 10;

  if (profile.display_name) completion += 1;
  if (profile.bio) completion += 1;
  if (profile.avatar_url) completion += 1;
  if (profile.location) completion += 1;
  if (profile.website) completion += 1;
  if (profile.social_links && Object.keys(profile.social_links).some(key => profile.social_links![key as keyof typeof profile.social_links])) completion += 1;
  if (profile.is_seller && profile.seller_info) {
    if (profile.seller_info.business_name) completion += 1;
    if (profile.seller_info.business_description) completion += 1;
  } else if (!profile.is_seller) {
    completion += 2; // Give points for not being a seller
  }
  if (profile.verification_status === 'verified') completion += 1;
  if (profile.preferences) completion += 1;

  return Math.round((completion / totalFields) * 100);
};

export const selectProfileHasUnreadNotifications = (state: RootState): boolean => {
  const lastActive = selectProfileLastActive(state);
  if (!lastActive) return false;
  
  // This would typically check against notification state
  // For now, return false as a placeholder
  return false;
};

export const selectProfileIsComplete = (state: RootState): boolean => 
  selectProfileCompletion(state) >= 80;

export const selectProfileNeedsVerification = (state: RootState): boolean => 
  selectCurrentProfile(state)?.verification_status === 'not_verified' && 
  !!selectCurrentProfile(state)?.is_seller;

export const selectProfileCanSell = (state: RootState): boolean => 
  !!selectCurrentProfile(state)?.is_seller && 
  (selectCurrentProfile(state)?.verification_status === 'verified' || !selectCurrentProfile(state)?.is_seller);

export const selectProfileRatingStars = (state: RootState): number[] => {
  const rating = selectProfileAverageRating(state);
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const stars = Array(5).fill(0).map((_, i) => {
    if (i < fullStars) return 1;
    if (i === fullStars && hasHalfStar) return 0.5;
    return 0;
  });
  return stars;
};

export const selectProfileSellerRank = (state: RootState): string => {
  const totalSales = selectSellerTotalSales(state) || 0;
  const averageRating = selectSellerAverageRating(state) || 0;
  
  if (totalSales >= 1000 && averageRating >= 4.8) return 'Platinum';
  if (totalSales >= 500 && averageRating >= 4.5) return 'Gold';
  if (totalSales >= 100 && averageRating >= 4.0) return 'Silver';
  if (totalSales >= 10 && averageRating >= 3.5) return 'Bronze';
  return 'New Seller';
};

export const selectProfileActivityLevel = (state: RootState): 'high' | 'medium' | 'low' | 'inactive' => {
  const lastActive = selectProfileLastActive(state);
  if (!lastActive) return 'inactive';
  
  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  const daysSinceActive = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceActive <= 1) return 'high';
  if (daysSinceActive <= 7) return 'medium';
  if (daysSinceActive <= 30) return 'low';
  return 'inactive';
};
