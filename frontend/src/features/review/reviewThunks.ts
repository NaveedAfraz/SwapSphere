import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type { 
  CreateReviewPayload, 
  UpdateReviewPayload, 
  RespondToReviewPayload,
  ReviewSearchParams,
  ReviewResponse, 
  ReviewsResponse 
} from "./types/review";

const API_BASE = "http://192.168.0.104:5000/api/review";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchReviewsThunk = createAsyncThunk<
  ReviewsResponse,
  ReviewSearchParams,
  { rejectValue: string }
>(
  "review/fetchReviews",
  async (searchParams: ReviewSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ReviewsResponse>("/", { params: searchParams });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch reviews";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchReviewByIdThunk = createAsyncThunk<
  ReviewResponse,
  string,
  { rejectValue: string }
>(
  "review/fetchReviewById",
  async (reviewId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ReviewResponse>(`/${reviewId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch review";
      return rejectWithValue(errorMessage);
    }
  }
);

export const createReviewThunk = createAsyncThunk<
  ReviewResponse,
  CreateReviewPayload,
  { rejectValue: string }
>(
  "review/createReview",
  async (reviewData: CreateReviewPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<ReviewResponse>("/", reviewData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to create review";
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateReviewThunk = createAsyncThunk<
  ReviewResponse,
  { id: string; data: UpdateReviewPayload },
  { rejectValue: string }
>(
  "review/updateReview",
  async ({ id, data }: { id: string; data: UpdateReviewPayload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<ReviewResponse>(`/${id}`, data);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to update review";
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteReviewThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  "review/deleteReview",
  async (reviewId: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/${reviewId}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to delete review";
      return rejectWithValue(errorMessage);
    }
  }
);

export const respondToReviewThunk = createAsyncThunk<
  ReviewResponse,
  RespondToReviewPayload,
  { rejectValue: string }
>(
  "review/respondToReview",
  async (responseData: RespondToReviewPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<ReviewResponse>(`/${responseData.review_id}/respond`, {
        comment: responseData.comment,
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to respond to review";
      return rejectWithValue(errorMessage);
    }
  }
);

export const markReviewHelpfulThunk = createAsyncThunk<
  ReviewResponse,
  string,
  { rejectValue: string }
>(
  "review/markReviewHelpful",
  async (reviewId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<ReviewResponse>(`/${reviewId}/helpful`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to mark review as helpful";
      return rejectWithValue(errorMessage);
    }
  }
);

export const unmarkReviewHelpfulThunk = createAsyncThunk<
  ReviewResponse,
  string,
  { rejectValue: string }
>(
  "review/unmarkReviewHelpful",
  async (reviewId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<ReviewResponse>(`/${reviewId}/unhelpful`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to unmark review as helpful";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchMyReviewsThunk = createAsyncThunk<
  ReviewsResponse,
  ReviewSearchParams,
  { rejectValue: string }
>(
  "review/fetchMyReviews",
  async (searchParams: ReviewSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ReviewsResponse>("/my", { params: searchParams });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch my reviews";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchReceivedReviewsThunk = createAsyncThunk<
  ReviewsResponse,
  ReviewSearchParams,
  { rejectValue: string }
>(
  "review/fetchReceivedReviews",
  async (searchParams: ReviewSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ReviewsResponse>("/received", { params: searchParams });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch received reviews";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchReviewsByListingThunk = createAsyncThunk<
  ReviewsResponse,
  { listingId: string; params?: ReviewSearchParams },
  { rejectValue: string }
>(
  "review/fetchReviewsByListing",
  async ({ listingId, params = {} }: { listingId: string; params?: ReviewSearchParams }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ReviewsResponse>(`/listing/${listingId}`, { params });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch reviews for listing";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchReviewsByUserThunk = createAsyncThunk<
  ReviewsResponse,
  { userId: string; params?: ReviewSearchParams },
  { rejectValue: string }
>(
  "review/fetchReviewsByUser",
  async ({ userId, params = {} }: { userId: string; params?: ReviewSearchParams }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ReviewsResponse>(`/user/${userId}`, { params });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch reviews for user";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchReviewStatsThunk = createAsyncThunk<
  any,
  { type: "global" | "user" | "listing"; id?: string },
  { rejectValue: string }
>(
  "review/fetchReviewStats",
  async ({ type, id }: { type: "global" | "user" | "listing"; id?: string }, { rejectWithValue }) => {
    try {
      let url = "/stats";
      if (type === "user" && id) {
        url = `/stats/user/${id}`;
      } else if (type === "listing" && id) {
        url = `/stats/listing/${id}`;
      }
      
      const response = await apiClient.get<any>(url);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch review stats";
      return rejectWithValue(errorMessage);
    }
  }
);

export const reportReviewThunk = createAsyncThunk<
  void,
  { reviewId: string; reason: string; description?: string },
  { rejectValue: string }
>(
  "review/reportReview",
  async ({ reviewId, reason, description }: { reviewId: string; reason: string; description?: string }, { rejectWithValue }) => {
    try {
      await apiClient.post(`/${reviewId}/report`, {
        reason,
        description,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to report review";
      return rejectWithValue(errorMessage);
    }
  }
);
