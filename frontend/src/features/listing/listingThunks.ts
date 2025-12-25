import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type {
  CreateListingPayload,
  UpdateListingPayload,
  SearchParams,
  ListingResponse,
  SingleListingResponse,
  ListingImage,
  Listing,
} from "./types/listing";
import { UserListingForSwap } from "../dealRooms/types/swapOffer";

const API_BASE = "http://192.168.0.104:5000/api/listing";

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

export const fetchListingsThunk = createAsyncThunk<
  ListingResponse,
  SearchParams,
  { rejectValue: string }
>(
  "listing/fetchListings",
  async (searchParams: SearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ListingResponse>("/", {
        params: searchParams,
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch listings";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchListingByIdThunk = createAsyncThunk<
  Listing,
  string,
  { rejectValue: string }
>(
  "listing/fetchListingById",
  async (listingId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<Listing>(
        `/${listingId}`
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch listing";
      return rejectWithValue(errorMessage);
    }
  }
);

export const createListingThunk = createAsyncThunk<
  SingleListingResponse,
  CreateListingPayload,
  { rejectValue: string }
>(
  "listing/createListing",
  async (listingData: CreateListingPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<SingleListingResponse>(
        "/",
        listingData
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to create listing";
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateListingThunk = createAsyncThunk<
  SingleListingResponse,
  { id: string; data: UpdateListingPayload },
  { rejectValue: string }
>(
  "listing/updateListing",
  async (
    { id, data }: { id: string; data: UpdateListingPayload },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.put<SingleListingResponse>(
        `/${id}`,
        data
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to update listing";
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteListingThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>("listing/deleteListing", async (listingId: string, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/${listingId}`);
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to delete listing";
    return rejectWithValue(errorMessage);
  }
});

export const toggleFavoriteThunk = createAsyncThunk<
  { is_favorite: boolean },
  string,
  { rejectValue: string }
>("listing/toggleFavorite", async (listingId: string, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<{ is_favorite: boolean }>(
      `/${listingId}/favorite`
    );
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to toggle favorite";
    return rejectWithValue(errorMessage);
  }
});

export const fetchFavoritesThunk = createAsyncThunk<
  ListingResponse,
  SearchParams,
  { rejectValue: string }
>(
  "listing/fetchFavorites",
  async (searchParams: SearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ListingResponse>("/favorites", {
        params: searchParams,
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch favorites";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchMyListingsThunk = createAsyncThunk<
  ListingResponse,
  SearchParams,
  { rejectValue: string }
>(
  "listing/fetchMyListings",
  async (searchParams: SearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ListingResponse>("/my", {
        params: searchParams,
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch my listings";
      return rejectWithValue(errorMessage);
    }
  }
);

export const uploadListingImagesThunk = createAsyncThunk<
  ListingImage[],
  { images: { uri: string; type: string }[] },
  { rejectValue: string }
>(
  "listing/uploadImages",
  async (
    { images }: { images: { uri: string; type: string }[] },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();

      images.forEach((image, index) => {
        formData.append("images", {
          uri: image.uri,
          type: image.type,
          name: `image_${index}.jpg`,
        } as any);
      });

      const response = await apiClient.post<{ images: ListingImage[] }>(
        "/upload-images",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data.images;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to upload images";
      return rejectWithValue(errorMessage);
    }
  }
);

export const incrementViewCountThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  "listing/incrementViewCount",
  async (listingId: string, { rejectWithValue }) => {
    try {
      await apiClient.post(`/${listingId}/view`);
    } catch (error: any) {
      // Failed to increment view count
    }
  }
);

export const fetchUserListingsForSwapThunk = createAsyncThunk<
  UserListingForSwap[],
  { excludeListingId?: string },
  { rejectValue: string }
>(
  "listing/fetchUserListingsForSwap",
  async ({ excludeListingId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ListingResponse>("/my", {
        params: {
          page: 1,
          limit: 50, // Get all user listings
        },
      });

      // Transform listings to swap format and exclude current listing
      const swapListings: UserListingForSwap[] = response.data.listings
        .filter(listing => listing.id !== excludeListingId)
        .map(listing => ({
          id: listing.id,
          title: listing.title,
          primary_image_url: listing.primary_image_url,
          price: listing.price,
          condition: listing.condition,
          category: listing.category,
        }));

      return swapListings;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch user listings for swap";
      return rejectWithValue(errorMessage);
    }
  }
);
