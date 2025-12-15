import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type { LoginPayload, RegisterPayload, AuthResponse } from "./types/auth";

const API_BASE = "http://192.168.0.104:5000/api/auth"; // Update with your backend URL

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

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
        "/login",
        credentials
      );
      
      // Store tokens in AsyncStorage after successful login
      if (response.data.token) {
        await AsyncStorage.setItem("authToken", response.data.token);
        console.log("Stored auth token after login");
      }
      
      if (response.data.refreshToken) {
        await AsyncStorage.setItem("refreshToken", response.data.refreshToken);
        console.log("Stored refresh token after login");
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
        "/register",
        userData
      );

      // Store user ID in async storage for profile setup
      if (response.data.user?.id) {
        console.log(
          "Storing user ID from registration:",
          response.data.user.id
        );
        await AsyncStorage.setItem(
          "pendingProfileUserId",
          response.data.user.id
        );
      } else {
        console.log(
          "No user ID found in registration response:",
          response.data
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
        "/google",
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
      const response = await apiClient.post<{ token: string }>("/refresh", {
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
      await apiClient.post("/logout");
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
      console.log("Local storage cleared successfully");
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

      console.log("Retrieved userId from storage:", userId);

      if (!userId) {
        // userId = "12f7cbbb-5fde-4024-800d-edfbd1895729";
        throw new Error("User ID not found. Please register again.");
      }

      console.log("Making request to:", `/profile/${userId}`);

      // Send profile data with user ID
      const response = await apiClient.post(`/profile/${userId}`, profileData);

      // Store tokens in AsyncStorage after successful profile setup
      if (response.data.token) {
        await AsyncStorage.setItem("authToken", response.data.token);
        console.log("Stored auth token after profile setup");
      }
      
      if (response.data.refreshToken) {
        await AsyncStorage.setItem("refreshToken", response.data.refreshToken);
        console.log("Stored refresh token after profile setup");
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
        "/toggle-seller-mode",
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
      console.log("=== AUTH HYDRATION: STARTING ===");
      
      // Check if token exists in AsyncStorage
      const token = await AsyncStorage.getItem("authToken");
      
      if (!token) {
        console.log("=== AUTH HYDRATION: NO TOKEN FOUND ===");
        return rejectWithValue("No auth token found");
      }
      
      console.log("=== AUTH HYDRATION: TOKEN FOUND, FETCHING USER DATA ===");
      
      // Validate token with backend and get current user data
      const response = await apiClient.get<AuthResponse>("/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log("=== AUTH HYDRATION: USER DATA RECEIVED ===");
      console.log("Full response data:", response.data);
      console.log("Response data structure:", JSON.stringify(response.data, null, 2));
      
      // Check if response has user property or is direct user data
      const userData = response.data.user || response.data;
      console.log("Extracted user data:", userData);
      console.log("User ID:", userData?.id);
      console.log("User email:", userData?.email);
      
      // Update AsyncStorage with fresh token if needed
      // if (response.data.token) {
      //   await AsyncStorage.setItem("authToken", response.data.token);
      // }
      
      return response.data;
    } catch (error: any) {
      console.error("=== AUTH HYDRATION: ERROR ===");
      console.error("Error:", error);
      
      // If token is invalid, clear AsyncStorage
      if (error.response?.status === 401) {
        console.log("=== AUTH HYDRATION: INVALID TOKEN, CLEARING STORAGE ===");
        await AsyncStorage.multiRemove(["authToken", "refreshToken"]);
      }
      
      const errorMessage =
        error.response?.data?.error || error.message || "Auth hydration failed";
      return rejectWithValue(errorMessage);
    }
  }
);
