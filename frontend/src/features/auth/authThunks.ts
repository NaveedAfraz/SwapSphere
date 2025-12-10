import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import type { LoginPayload, RegisterPayload, AuthResponse } from "./types/auth";

const API_BASE = "http://localhost:3000/api/auth"; // Update with your backend URL

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
      await apiClient.post("/logout");
    } catch (error: any) {
      // Even if backend call fails, we still want to clear local state
      console.warn(
        "Backend logout failed, but clearing local state:",
        error.message
      );
      // Don't reject - we still want to clear local state
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
