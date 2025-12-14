export type ReviewStatus = "idle" | "loading" | "success" | "error";

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Review {
  id: string;
  reviewer_id: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
  reviewee_id: string;
  reviewee_name?: string;
  reviewee_avatar?: string;
  order_id?: string;
  listing_id?: string;
  listing_title?: string;
  listing_image?: string;
  rating: Rating;
  title?: string;
  comment: string;
  is_verified: boolean;
  is_public: boolean;
  helpful_count: number;
  response?: {
    comment: string;
    responded_at: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ReviewStateType {
  reviews: Review[];
  currentReview: Review | null;
  myReviews: Review[];
  receivedReviews: Review[];
  listingReviews: Review[];
  status: ReviewStatus;
  error: string | null;
  createStatus: ReviewStatus;
  createError: string | null;
  updateStatus: ReviewStatus;
  updateError: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: {
    rating?: Rating;
    reviewer_id?: string;
    reviewee_id?: string;
    order_id?: string;
    listing_id?: string;
    is_verified?: boolean;
    is_public?: boolean;
    minRating?: Rating;
    maxRating?: Rating;
    sortBy?: "created_at" | "rating" | "helpful_count";
    sortOrder?: "asc" | "desc";
  };
}

export interface CreateReviewPayload {
  reviewee_id: string;
  order_id?: string;
  listing_id?: string;
  rating: Rating;
  title?: string;
  comment: string;
  is_public?: boolean;
}

export interface UpdateReviewPayload {
  rating?: Rating;
  title?: string;
  comment?: string;
  is_public?: boolean;
}

export interface RespondToReviewPayload {
  review_id: string;
  comment: string;
}

export interface ReviewSearchParams {
  rating?: Rating;
  reviewer_id?: string;
  reviewee_id?: string;
  order_id?: string;
  listing_id?: string;
  is_verified?: boolean;
  is_public?: boolean;
  minRating?: Rating;
  maxRating?: Rating;
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "rating" | "helpful_count";
  sortOrder?: "asc" | "desc";
}

export interface ReviewResponse {
  review: Review;
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<Rating, number>;
  verifiedReviews: number;
  publicReviews: number;
  totalHelpfulVotes: number;
  reviewsWithResponse: number;
  averageResponseTime?: number; // in hours
}

export interface UserReviewStats {
  asReviewer: {
    totalGiven: number;
    averageRatingGiven: number;
    ratingDistributionGiven: Record<Rating, number>;
  };
  asReviewee: {
    totalReceived: number;
    averageRatingReceived: number;
    ratingDistributionReceived: Record<Rating, number>;
    totalHelpfulVotes: number;
    responseRate: number;
    averageResponseTime?: number;
  };
}

export interface ListingReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<Rating, number>;
  recentReviews: Review[];
  topReviews: Review[];
}
