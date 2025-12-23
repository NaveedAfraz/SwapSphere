import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "@/src/services/api";
import type { 
  CreateOfferPayload, 
  UpdateOfferPayload, 
  CounterOfferPayload,
  OfferSearchParams,
  OfferResponse, 
  OffersResponse 
} from "./types/offer";

export const fetchOffersThunk = createAsyncThunk<
  OffersResponse,
  OfferSearchParams,
  { rejectValue: string }
>(
  "offer/fetchOffers",
  async (searchParams: OfferSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<OffersResponse>("/offer", { params: searchParams });
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
      const response = await apiClient.get<OfferResponse>(`/offer/${offerId}`);
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
      console.log('[OFFER] Creating new offer:', offerData);
      // Map frontend payload to backend expected format
      const backendPayload = {
        listing_id: offerData.listing_id,
        offered_price: offerData.amount,
        offered_quantity: 1, // Default quantity
        expires_at: offerData.expires_at,
        buyer_id: offerData.buyer_id, // Explicitly pass buyer_id
        // Include intent_id if present (for seller counter-offers to intents)
        ...(offerData.intent_id && { intent_id: offerData.intent_id }),
      };
      
      const response = await apiClient.post<OfferResponse>("/offer", backendPayload);
      console.log('[OFFER] Offer created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[OFFER] Failed to create offer:', error);
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
      const response = await apiClient.put<OfferResponse>(`/offer/${id}`, data);
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
      console.log('[OFFER] Accepting offer:', offerId);
      const response = await apiClient.post<OfferResponse>(`/offer/${offerId}/accept`);
      console.log('[OFFER] Offer accepted successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[OFFER] Failed to accept offer:', error);
      console.error('[OFFER] Error response:', error.response?.data);
      console.error('[OFFER] Error status:', error.response?.status);
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
      console.log('[OFFER] Rejecting offer:', offerId);
      const response = await apiClient.post<OfferResponse>(`/offer/${offerId}/decline`);
      console.log('[OFFER] Offer rejected successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[OFFER] Failed to reject offer:', error);
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
      console.log('[OFFER] Creating counter offer:', counterData);
      // Map frontend payload to backend expected format
      const backendPayload = {
        offered_price: counterData.counter_amount,
        offered_quantity: 1, // Default quantity
        expires_at: counterData.expires_at,
      };
      
      const response = await apiClient.post<OfferResponse>(`/offer/${counterData.offer_id}/counter`, backendPayload);
      console.log('[OFFER] Counter offer created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[OFFER] Failed to create counter offer:', error);
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
      console.log('[OFFER] Withdrawing offer:', offerId);
      const response = await apiClient.post<OfferResponse>(`/offer/${offerId}/cancel`);
      console.log('[OFFER] Offer withdrawn successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[OFFER] Failed to withdraw offer:', error);
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
      const response = await apiClient.get<OffersResponse>("/offer/buyer", { params: searchParams });
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
      const response = await apiClient.get<OffersResponse>("/offer/seller", { params: searchParams });
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
      const response = await apiClient.get<OffersResponse>(`/offer/listing/${listingId}`, { params });
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
      const response = await apiClient.get<any>("/offer/stats");
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
      await apiClient.delete(`/offer/${offerId}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to delete offer";
      return rejectWithValue(errorMessage);
    }
  }
);
