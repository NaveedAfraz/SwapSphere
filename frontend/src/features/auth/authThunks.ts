import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "@/src/services/api";
import type { LoginPayload, RegisterPayload, AuthResponse } from "./types/auth";

export const loginThunk = createAsyncThunk<
  AuthResponse,
  LoginPayload,
  { rejectValue: string }
>(
  "auth/login",
  async (
    credentials: LoginPayload,
    { rejectWithValue }: { rejectWithValue: (value: string) => any }
  ) => {
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/login",
        credentials
      );
      
      // Store tokens in AsyncStorage after successful login
      if (response.data.token) {
        await AsyncStorage.setItem("authToken", response.data.token);
      }
      
      if (response.data.refreshToken) {
        await AsyncStorage.setItem("refreshToken", response.data.refreshToken);
      }
      
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Login failed";
      return rejectWithValue(errorMessage);
    }
  }
);

export const registerThunk = createAsyncThunk<
  AuthResponse,
  RegisterPayload,
  { rejectValue: string }
>(
  "auth/register",
  async (
    userData: RegisterPayload,
    { rejectWithValue }: { rejectWithValue: (value: string) => any }
  ) => {
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/register",
        userData
      );

      // Store user ID in async storage for profile setup
      if (response.data.user?.id) {
        await AsyncStorage.setItem(
          "pendingProfileUserId",
          response.data.user.id
        );
      }

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Registration failed";
      return rejectWithValue(errorMessage);
    }
  }
);

export const googleAuthThunk = createAsyncThunk<
  AuthResponse,
  { email: string; googleId: string; name?: string },
  { rejectValue: string }
>(
  "auth/google",
  async (
    googleData: { email: string; googleId: string; name?: string },
    { rejectWithValue }: { rejectWithValue: (value: string) => any }
  ) => {
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/google",
        googleData
      );

      // Store user ID in async storage for profile setup
      if (response.data.user?.id) {
        await AsyncStorage.setItem(
          "pendingProfileUserId",
          response.data.user.id
        );
      }

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Google auth failed";
      return rejectWithValue(errorMessage);
    }
  }
);

export const refreshTokenThunk = createAsyncThunk<
  { token: string },
  { refreshToken: string },
  { rejectValue: string }
>(
  "auth/refresh",
  async (
    { refreshToken }: { refreshToken: string },
    { rejectWithValue }: { rejectWithValue: (value: string) => any }
  ) => {
    try {
      const response = await apiClient.post<{ token: string }>("/auth/refresh", {
        refreshToken,
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Token refresh failed";
      return rejectWithValue(errorMessage);
    }
  }
);

export const logoutThunk = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  "auth/logout",
  async (
    _: void,
    { rejectWithValue }: { rejectWithValue: (value: string) => any }
  ) => {
    try {
      // Call backend logout endpoint
      await apiClient.post("/auth/logout");
    } catch (error: any) {
      // Even if backend call fails, we still want to clear local state
      console.warn(
        "Backend logout failed, but clearing local state:",
        error.message
      );
      // Don't reject - we still want to clear local state
    }

    // Always clear local storage regardless of backend success
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("pendingProfileUserId");
    } catch (storageError) {
      console.error("Failed to clear local storage:", storageError);
    }
  }
);

export const updateProfileThunk = createAsyncThunk<
  any,
  {
    name?: string;
    bio?: string;
    seller_mode?: boolean;
    location?: any;
  },
  { rejectValue: string }
>(
  "auth/updateProfile",
  async (
    profileData: {
      name?: string;
      bio?: string;
      seller_mode?: boolean;
      location?: any;
    },
    { rejectWithValue }: { rejectWithValue: (value: string) => any }
  ) => {
    try {
      // Get stored user ID from async storage
      let userId = await AsyncStorage.getItem("pendingProfileUserId");

      if (!userId) {
        throw new Error("User ID not found. Please register again.");
      }

      // Send profile data with user ID
      const response = await apiClient.post(`/auth/profile/${userId}`, profileData);

      // Store tokens in AsyncStorage after successful profile setup
      if (response.data.token) {
        await AsyncStorage.setItem("authToken", response.data.token);
      }
      
      if (response.data.refreshToken) {
        await AsyncStorage.setItem("refreshToken", response.data.refreshToken);
      }

      // Clear stored user ID after successful profile setup
      await AsyncStorage.removeItem("pendingProfileUserId");

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
  { sellerMode: boolean },
  { enabled: boolean; description?: string },
  { rejectValue: string }
>(
  "auth/toggleSellerMode",
  async (
    { enabled, description }: { enabled: boolean; description?: string },
    { rejectWithValue }: { rejectWithValue: (value: string) => any }
  ) => {
    try {
      const response = await apiClient.post<{ sellerMode: boolean }>(
        "/auth/toggle-seller-mode",
        { enabled, description }
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

// Hydrate auth state from AsyncStorage and backend
export const hydrateAuth = createAsyncThunk<
  AuthResponse,
  void,
  { rejectValue: string }
>(
  "auth/hydrate",
  async (_, { rejectWithValue }) => {
    try {
      // Check if token exists in AsyncStorage
      const token = await AsyncStorage.getItem("authToken");
      
      if (!token) {
        return rejectWithValue("No auth token found");
      }
      
      // Validate token with backend and get current user data
      const response = await apiClient.get("/auth/me");
      
      // Check if response has user property or is direct user data
      const userData = response.data.user || response.data;
      
      // Update AsyncStorage with fresh token if needed
      // if (response.data.token) {
      //   await AsyncStorage.setItem("authToken", response.data.token);
      // }
      
      return response.data;
    } catch (error: any) {
      // If token is invalid, clear AsyncStorage
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(["authToken", "refreshToken"]);
      }
      
      const errorMessage =
        error.response?.data?.error || error.message || "Auth hydration failed";
      return rejectWithValue(errorMessage);
    }
  }
);
