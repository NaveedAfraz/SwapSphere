import type { RootState } from '../../store/index';
import type { ReviewStateType, Review, Rating } from './types/review';

// Basic selectors
export const selectReviewState = (state: RootState): ReviewStateType => state.review;

export const selectReviews = (state: RootState): Review[] => selectReviewState(state).reviews;

export const selectCurrentReview = (state: RootState): Review | null => 
  selectReviewState(state).currentReview;

export const selectMyReviews = (state: RootState): Review[] => 
  selectReviewState(state).myReviews;

export const selectReceivedReviews = (state: RootState): Review[] => 
  selectReviewState(state).receivedReviews;

export const selectListingReviews = (state: RootState): Review[] => 
  selectReviewState(state).listingReviews;

export const selectReviewStatus = (state: RootState): string => 
  selectReviewState(state).status;

export const selectReviewError = (state: RootState): string | null => 
  selectReviewState(state).error;

export const selectCreateStatus = (state: RootState): string => 
  selectReviewState(state).createStatus;

export const selectCreateError = (state: RootState): string | null => 
  selectReviewState(state).createError;

export const selectUpdateStatus = (state: RootState): string => 
  selectReviewState(state).updateStatus;

export const selectUpdateError = (state: RootState): string | null => 
  selectReviewState(state).updateError;

export const selectReviewPagination = (state: RootState) => 
  selectReviewState(state).pagination;

export const selectReviewFilters = (state: RootState) => 
  selectReviewState(state).filters;

// Derived selectors
export const selectIsReviewLoading = (state: RootState): boolean => 
  selectReviewStatus(state) === 'loading';

export const selectIsReviewError = (state: RootState): boolean => 
  selectReviewStatus(state) === 'error';

export const selectIsReviewSuccess = (state: RootState): boolean => 
  selectReviewStatus(state) === 'success';

export const selectIsCreateReviewLoading = (state: RootState): boolean => 
  selectCreateStatus(state) === 'loading';

export const selectIsCreateReviewError = (state: RootState): boolean => 
  selectCreateStatus(state) === 'error';

export const selectIsCreateReviewSuccess = (state: RootState): boolean => 
  selectCreateStatus(state) === 'success';

export const selectIsUpdateReviewLoading = (state: RootState): boolean => 
  selectUpdateStatus(state) === 'loading';

export const selectIsUpdateReviewError = (state: RootState): boolean => 
  selectUpdateStatus(state) === 'error';

export const selectIsUpdateReviewSuccess = (state: RootState): boolean => 
  selectUpdateStatus(state) === 'success';

export const selectHasMoreReviews = (state: RootState): boolean => 
  selectReviewPagination(state).hasMore;

export const selectTotalReviews = (state: RootState): number => 
  selectReviewPagination(state).total;

// Review-specific selectors
export const selectReviewById = (state: RootState, reviewId: string): Review | undefined => 
  selectReviews(state).find(review => review.id === reviewId);

export const selectMyReviewById = (state: RootState, reviewId: string): Review | undefined => 
  selectMyReviews(state).find(review => review.id === reviewId);

export const selectReceivedReviewById = (state: RootState, reviewId: string): Review | undefined => 
  selectReceivedReviews(state).find(review => review.id === reviewId);

export const selectListingReviewById = (state: RootState, reviewId: string): Review | undefined => 
  selectListingReviews(state).find(review => review.id === reviewId);

export const selectReviewsByRating = (state: RootState, rating: Rating): Review[] => 
  selectReviews(state).filter(review => review.rating === rating);

export const selectMyReviewsByRating = (state: RootState, rating: Rating): Review[] => 
  selectMyReviews(state).filter(review => review.rating === rating);

export const selectReceivedReviewsByRating = (state: RootState, rating: Rating): Review[] => 
  selectReceivedReviews(state).filter(review => review.rating === rating);

export const selectListingReviewsByRating = (state: RootState, rating: Rating): Review[] => 
  selectListingReviews(state).filter(review => review.rating === rating);

export const selectReviewsByReviewer = (state: RootState, reviewerId: string): Review[] => 
  selectReviews(state).filter(review => review.reviewer_id === reviewerId);

export const selectReviewsByReviewee = (state: RootState, revieweeId: string): Review[] => 
  selectReviews(state).filter(review => review.reviewee_id === revieweeId);

export const selectReviewsByOrder = (state: RootState, orderId: string): Review[] => 
  selectReviews(state).filter(review => review.order_id === orderId);

export const selectReviewsByListing = (state: RootState, listingId: string): Review[] => 
  selectReviews(state).filter(review => review.listing_id === listingId);

export const selectVerifiedReviews = (state: RootState): Review[] => 
  selectReviews(state).filter(review => review.is_verified);

export const selectPublicReviews = (state: RootState): Review[] => 
  selectReviews(state).filter(review => review.is_public);

export const selectReviewsWithResponse = (state: RootState): Review[] => 
  selectReviews(state).filter(review => review.response);

export const selectReviewsWithoutResponse = (state: RootState): Review[] => 
  selectReviews(state).filter(review => !review.response);

// Rating-based selectors
export const selectAverageRating = (state: RootState): number => {
  const reviews = selectReviews(state);
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return total / reviews.length;
};

export const selectMyAverageRating = (state: RootState): number => {
  const reviews = selectMyReviews(state);
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return total / reviews.length;
};

export const selectReceivedAverageRating = (state: RootState): number => {
  const reviews = selectReceivedReviews(state);
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return total / reviews.length;
};

export const selectListingAverageRating = (state: RootState): number => {
  const reviews = selectListingReviews(state);
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return total / reviews.length;
};

export const selectRatingDistribution = (state: RootState): Record<Rating, number> => {
  const reviews = selectReviews(state);
  const distribution: Record<Rating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    distribution[review.rating]++;
  });
  return distribution;
};

export const selectMyRatingDistribution = (state: RootState): Record<Rating, number> => {
  const reviews = selectMyReviews(state);
  const distribution: Record<Rating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    distribution[review.rating]++;
  });
  return distribution;
};

export const selectReceivedRatingDistribution = (state: RootState): Record<Rating, number> => {
  const reviews = selectReceivedReviews(state);
  const distribution: Record<Rating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    distribution[review.rating]++;
  });
  return distribution;
};

export const selectListingRatingDistribution = (state: RootState): Record<Rating, number> => {
  const reviews = selectListingReviews(state);
  const distribution: Record<Rating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    distribution[review.rating]++;
  });
  return distribution;
};

// Time-based selectors
export const selectRecentReviews = (state: RootState, days: number = 7): Review[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return selectReviews(state).filter(review => 
    new Date(review.created_at) >= cutoffDate
  );
};

export const selectMyRecentReviews = (state: RootState, days: number = 7): Review[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return selectMyReviews(state).filter(review => 
    new Date(review.created_at) >= cutoffDate
  );
};

export const selectReceivedRecentReviews = (state: RootState, days: number = 7): Review[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return selectReceivedReviews(state).filter(review => 
    new Date(review.created_at) >= cutoffDate
  );
};

export const selectListingRecentReviews = (state: RootState, days: number = 7): Review[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return selectListingReviews(state).filter(review => 
    new Date(review.created_at) >= cutoffDate
  );
};

// Complex selectors
export const selectTopReviews = (state: RootState, limit: number = 10): Review[] => {
  return [...selectReviews(state)]
    .sort((a, b) => b.helpful_count - a.helpful_count)
    .slice(0, limit);
};

export const selectMyTopReviews = (state: RootState, limit: number = 10): Review[] => {
  return [...selectMyReviews(state)]
    .sort((a, b) => b.helpful_count - a.helpful_count)
    .slice(0, limit);
};

export const selectReceivedTopReviews = (state: RootState, limit: number = 10): Review[] => {
  return [...selectReceivedReviews(state)]
    .sort((a, b) => b.helpful_count - a.helpful_count)
    .slice(0, limit);
};

export const selectListingTopReviews = (state: RootState, limit: number = 10): Review[] => {
  return [...selectListingReviews(state)]
    .sort((a, b) => b.helpful_count - a.helpful_count)
    .slice(0, limit);
};

export const selectReviewsNeedingResponse = (state: RootState): Review[] => {
  return selectReceivedReviews(state).filter(review => 
    !review.response && review.is_public
  );
};

export const selectMyReviewsNeedingResponse = (state: RootState): Review[] => {
  return selectMyReviews(state).filter(review => 
    !review.response && review.is_public
  );
};

export const selectReviewStats = (state: RootState) => {
  const reviews = selectReviews(state);
  const verifiedReviews = reviews.filter(review => review.is_verified);
  const publicReviews = reviews.filter(review => review.is_public);
  const reviewsWithResponse = reviews.filter(review => review.response);
  
  return {
    totalReviews: reviews.length,
    averageRating: selectAverageRating(state),
    ratingDistribution: selectRatingDistribution(state),
    verifiedReviews: verifiedReviews.length,
    publicReviews: publicReviews.length,
    totalHelpfulVotes: reviews.reduce((sum, review) => sum + review.helpful_count, 0),
    reviewsWithResponse: reviewsWithResponse.length,
  };
};

export const selectMyReviewStats = (state: RootState) => {
  const reviews = selectMyReviews(state);
  const verifiedReviews = reviews.filter(review => review.is_verified);
  const publicReviews = reviews.filter(review => review.is_public);
  const reviewsWithResponse = reviews.filter(review => review.response);
  
  return {
    totalGiven: reviews.length,
    averageRatingGiven: selectMyAverageRating(state),
    ratingDistributionGiven: selectMyRatingDistribution(state),
    verifiedReviews: verifiedReviews.length,
    publicReviews: publicReviews.length,
    totalHelpfulVotes: reviews.reduce((sum, review) => sum + review.helpful_count, 0),
    reviewsWithResponse: reviewsWithResponse.length,
  };
};

export const selectReceivedReviewStats = (state: RootState) => {
  const reviews = selectReceivedReviews(state);
  const verifiedReviews = reviews.filter(review => review.is_verified);
  const publicReviews = reviews.filter(review => review.is_public);
  const reviewsWithResponse = reviews.filter(review => review.response);
  const reviewsNeedingResponse = reviews.filter(review => !review.response && review.is_public);
  
  return {
    totalReceived: reviews.length,
    averageRatingReceived: selectReceivedAverageRating(state),
    ratingDistributionReceived: selectReceivedRatingDistribution(state),
    verifiedReviews: verifiedReviews.length,
    publicReviews: publicReviews.length,
    totalHelpfulVotes: reviews.reduce((sum, review) => sum + review.helpful_count, 0),
    reviewsWithResponse: reviewsWithResponse.length,
    reviewsNeedingResponse: reviewsNeedingResponse.length,
    responseRate: reviews.length > 0 ? (reviewsWithResponse.length / reviews.length) * 100 : 0,
  };
};

export const selectListingReviewStats = (state: RootState) => {
  const reviews = selectListingReviews(state);
  const verifiedReviews = reviews.filter(review => review.is_verified);
  const publicReviews = reviews.filter(review => review.is_public);
  const recentReviews = selectListingRecentReviews(state, 30);
  
  return {
    totalReviews: reviews.length,
    averageRating: selectListingAverageRating(state),
    ratingDistribution: selectListingRatingDistribution(state),
    verifiedReviews: verifiedReviews.length,
    publicReviews: publicReviews.length,
    totalHelpfulVotes: reviews.reduce((sum, review) => sum + review.helpful_count, 0),
    recentReviews: recentReviews.length,
    topReviews: selectListingTopReviews(state, 5),
  };
};
