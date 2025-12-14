import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type { 
  CreateOfferPayload, 
  UpdateOfferPayload, 
  CounterOfferPayload,
  OfferSearchParams,
  OfferResponse, 
  OffersResponse 
} from "./types/offer";

const API_BASE = "http://192.168.0.104:5000/api/offer";

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

export const fetchOffersThunk = createAsyncThunk<
  OffersResponse,
  OfferSearchParams,
  { rejectValue: string }
>(
  "offer/fetchOffers",
  async (searchParams: OfferSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<OffersResponse>("/", { params: searchParams });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch offers";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchOfferByIdThunk = createAsyncThunk<
  OfferResponse,
  string,
  { rejectValue: string }
>(
  "offer/fetchOfferById",
  async (offerId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<OfferResponse>(`/${offerId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch offer";
      return rejectWithValue(errorMessage);
    }
  }
);

export const createOfferThunk = createAsyncThunk<
  OfferResponse,
  CreateOfferPayload,
  { rejectValue: string }
>(
  "offer/createOffer",
  async (offerData: CreateOfferPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<OfferResponse>("/", offerData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to create offer";
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateOfferThunk = createAsyncThunk<
  OfferResponse,
  { id: string; data: UpdateOfferPayload },
  { rejectValue: string }
>(
  "offer/updateOffer",
  async ({ id, data }: { id: string; data: UpdateOfferPayload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<OfferResponse>(`/${id}`, data);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to update offer";
      return rejectWithValue(errorMessage);
    }
  }
);

export const acceptOfferThunk = createAsyncThunk<
  OfferResponse,
  string,
  { rejectValue: string }
>(
  "offer/acceptOffer",
  async (offerId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<OfferResponse>(`/${offerId}/accept`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to accept offer";
      return rejectWithValue(errorMessage);
    }
  }
);

export const rejectOfferThunk = createAsyncThunk<
  OfferResponse,
  string,
  { rejectValue: string }
>(
  "offer/rejectOffer",
  async (offerId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<OfferResponse>(`/${offerId}/reject`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to reject offer";
      return rejectWithValue(errorMessage);
    }
  }
);

export const counterOfferThunk = createAsyncThunk<
  OfferResponse,
  CounterOfferPayload,
  { rejectValue: string }
>(
  "offer/counterOffer",
  async (counterData: CounterOfferPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<OfferResponse>(`/${counterData.offer_id}/counter`, {
        counter_amount: counterData.counter_amount,
        counter_message: counterData.counter_message,
        expires_at: counterData.expires_at,
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to counter offer";
      return rejectWithValue(errorMessage);
    }
  }
);

export const withdrawOfferThunk = createAsyncThunk<
  OfferResponse,
  string,
  { rejectValue: string }
>(
  "offer/withdrawOffer",
  async (offerId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<OfferResponse>(`/${offerId}/withdraw`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to withdraw offer";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchSentOffersThunk = createAsyncThunk<
  OffersResponse,
  OfferSearchParams,
  { rejectValue: string }
>(
  "offer/fetchSentOffers",
  async (searchParams: OfferSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<OffersResponse>("/sent", { params: searchParams });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch sent offers";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchReceivedOffersThunk = createAsyncThunk<
  OffersResponse,
  OfferSearchParams,
  { rejectValue: string }
>(
  "offer/fetchReceivedOffers",
  async (searchParams: OfferSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<OffersResponse>("/received", { params: searchParams });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch received offers";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchOffersByListingThunk = createAsyncThunk<
  OffersResponse,
  { listingId: string; params?: OfferSearchParams },
  { rejectValue: string }
>(
  "offer/fetchOffersByListing",
  async ({ listingId, params = {} }: { listingId: string; params?: OfferSearchParams }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<OffersResponse>(`/listing/${listingId}`, { params });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch offers for listing";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchOfferStatsThunk = createAsyncThunk<
  any,
  void,
  { rejectValue: string }
>(
  "offer/fetchOfferStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<any>("/stats");
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch offer stats";
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteOfferThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  "offer/deleteOffer",
  async (offerId: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/${offerId}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to delete offer";
      return rejectWithValue(errorMessage);
    }
  }
);
