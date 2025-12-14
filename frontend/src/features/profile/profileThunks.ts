import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type { 
  UpdateProfilePayload, 
  UpdateSellerInfoPayload,
  UploadAvatarPayload,
  UploadCoverImagePayload,
  VerificationDocumentPayload,
  ProfileResponse, 
  PublicProfileResponse,
  ProfileStatsResponse,
  VerificationResponse
} from "./types/profile";
import { RootState } from "../../store";

const API_BASE = "http://192.168.0.104:5000/api/profile";

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

export const fetchMyProfileThunk = createAsyncThunk<
  ProfileResponse,
  void,
  { rejectValue: string }
>(
  "profile/fetchMyProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ProfileResponse>("/me");
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch profile";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchPublicProfileThunk = createAsyncThunk<
  PublicProfileResponse,
  string,
  { rejectValue: string }
>(
  "profile/fetchPublicProfile",
  async (username: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<PublicProfileResponse>(`/public/${username}`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch public profile";
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateProfileThunk = createAsyncThunk<
  ProfileResponse,
  UpdateProfilePayload,
  { rejectValue: string }
>(
  "profile/updateProfile",
  async (profileData: UpdateProfilePayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<ProfileResponse>("/", profileData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to update profile";
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateSellerInfoThunk = createAsyncThunk<
  ProfileResponse,
  UpdateSellerInfoPayload,
  { rejectValue: string }
>(
  "profile/updateSellerInfo",
  async (sellerData: UpdateSellerInfoPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<ProfileResponse>("/seller-info", sellerData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to update seller info";
      return rejectWithValue(errorMessage);
    }
  }
);

export const uploadAvatarThunk = createAsyncThunk<
  ProfileResponse,
  UploadAvatarPayload,
  { rejectValue: string }
>(
  "profile/uploadAvatar",
  async (payload: UploadAvatarPayload, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("avatar", {
        uri: payload.image_uri,
        type: "image/jpeg",
        name: payload.file_name || "avatar.jpg",
      } as any);

      const response = await apiClient.post<ProfileResponse>("/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to upload avatar";
      return rejectWithValue(errorMessage);
    }
  }
);

export const uploadCoverImageThunk = createAsyncThunk<
  ProfileResponse,
  UploadCoverImagePayload,
  { rejectValue: string }
>(
  "profile/uploadCoverImage",
  async (payload: UploadCoverImagePayload, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("cover_image", {
        uri: payload.image_uri,
        type: "image/jpeg",
        name: payload.file_name || "cover.jpg",
      } as any);

      const response = await apiClient.post<ProfileResponse>("/upload-cover", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to upload cover image";
      return rejectWithValue(errorMessage);
    }
  }
);

export const submitVerificationThunk = createAsyncThunk<
  VerificationResponse,
  VerificationDocumentPayload,
  { rejectValue: string }
>(
  "profile/submitVerification",
  async (documentData: VerificationDocumentPayload, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("document_type", documentData.document_type);
      formData.append("document", {
        uri: documentData.document_uri,
        type: "image/jpeg",
        name: documentData.file_name || "document.jpg",
      } as any);

      const response = await apiClient.post<VerificationResponse>("/verify", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to submit verification";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchProfileStatsThunk = createAsyncThunk<
  ProfileStatsResponse,
  void,
  { rejectValue: string }
>(
  "profile/fetchProfileStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ProfileStatsResponse>("/stats");
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch profile stats";
      return rejectWithValue(errorMessage);
    }
  }
);

export const toggleSellerModeThunk = createAsyncThunk<
  ProfileResponse,
  void,
  { rejectValue: string }
>(
  "profile/toggleSellerMode",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<ProfileResponse>("/toggle-seller");
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to toggle seller mode";
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteProfileThunk = createAsyncThunk<
  void,
  { password: string },
  { rejectValue: string }
>(
  "profile/deleteProfile",
  async ({ password }: { password: string }, { rejectWithValue }) => {
    try {
      await apiClient.delete("/", { data: { password } });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to delete profile";
      return rejectWithValue(errorMessage);
    }
  }
);

export const deactivateProfileThunk = createAsyncThunk<
  ProfileResponse,
  { reason?: string },
  { rejectValue: string }
>(
  "profile/deactivateProfile",
  async ({ reason }: { reason?: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<ProfileResponse>("/deactivate", { reason });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to deactivate profile";
      return rejectWithValue(errorMessage);
    }
  }
);

export const checkUsernameAvailabilityThunk = createAsyncThunk<
  { available: boolean },
  string,
  { rejectValue: string }
>(
  "profile/checkUsernameAvailability",
  async (username: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<{ available: boolean }>(`/check-username/${username}`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to check username availability";
      return rejectWithValue(errorMessage);
    }
  }
);
