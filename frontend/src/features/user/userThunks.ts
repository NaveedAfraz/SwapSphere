import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type {
  UpdateProfilePayload,
  ToggleSellerModePayload,
  UserProfile,
  UserResponse,
  UserByIdResponse,
  UserStats,
} from "./types/user";

const API_BASE = "http://192.168.0.104:5000/api/user";

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

export const getUserProfileThunk = createAsyncThunk<
  UserResponse,
  void,
  { rejectValue: string }
>("user/getProfile", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<UserResponse>("/profile");
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to fetch user profile";
    return rejectWithValue(errorMessage);
  }
});

export const getUserByIdThunk = createAsyncThunk<
  UserResponse,
  string,
  { rejectValue: string }
>("user/getById", async (userId: string, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<UserByIdResponse>(`/${userId}`);

    // Transform the API response to match UserProfile interface
    const userProfile: UserProfile = {
      id: response.data.id,
      name: response.data.profile?.name || "",
      bio: response.data.profile?.bio || "",
      avatar: response.data.profile?.profile_picture_url || "",
      location: response.data.profile?.location
        ? {
            city: response.data.profile.location.city,
            state: undefined,
            country: undefined,
            coordinates: undefined,
          }
        : undefined,
      seller_mode: response.data.profile?.seller_mode || false,
      rating: response.data.profile?.rating_avg
        ? parseFloat(response.data.profile.rating_avg)
        : 0,
      review_count: response.data.profile?.rating_count || 0,
      response_rate: undefined,
      avg_response_time: undefined,
      verification_status: undefined,
      created_at: response.data.created_at,
      updated_at: response.data.created_at,
    };

    return { user: userProfile };
  } catch (error: any) {
    console.log(error);
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to fetch user details";
    return rejectWithValue(errorMessage);
  }
});

export const updateProfileThunk = createAsyncThunk<
  UserResponse,
  UpdateProfilePayload,
  { rejectValue: string }
>(
  "user/updateProfile",
  async (profileData: UpdateProfilePayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<UserResponse>(
        "/profile",
        profileData
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to update profile";
      return rejectWithValue(errorMessage);
    }
  }
);

export const toggleSellerModeThunk = createAsyncThunk<
  { seller_mode: boolean },
  ToggleSellerModePayload,
  { rejectValue: string }
>(
  "user/toggleSellerMode",
  async (sellerData: ToggleSellerModePayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<{ seller_mode: boolean }>(
        "/seller-mode",
        sellerData
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to toggle seller mode";
      return rejectWithValue(errorMessage);
    }
  }
);

export const getUserStatsThunk = createAsyncThunk<
  UserStats,
  void,
  { rejectValue: string }
>("user/getStats", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<UserStats>("/stats");
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to fetch user stats";
    return rejectWithValue(errorMessage);
  }
});

export const uploadAvatarThunk = createAsyncThunk<
  { avatar_url: string },
  { uri: string; type: string },
  { rejectValue: string }
>(
  "user/uploadAvatar",
  async (imageData: { uri: string; type: string }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("avatar", {
        uri: imageData.uri,
        type: imageData.type,
        name: "avatar.jpg",
      } as any);

      const response = await apiClient.post<{ avatar_url: string }>(
        "/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to upload avatar";
      return rejectWithValue(errorMessage);
    }
  }
);

export const deactivateAccountThunk = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("user/deactivateAccount", async (_, { rejectWithValue }) => {
  try {
    await apiClient.post("/deactivate");
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to deactivate account";
    return rejectWithValue(errorMessage);
  }
});
