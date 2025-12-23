import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type { 
  CreateOrderPayload, 
  UpdateOrderPayload, 
  UpdateTrackingPayload,
  OrderSearchParams,
  OrderResponse, 
  OrdersResponse 
} from "./types/order";

const API_BASE = "http://192.168.0.104:5000/api/order";

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

export const fetchOrdersThunk = createAsyncThunk<
  OrdersResponse,
  OrderSearchParams,
  { rejectValue: string }
>(
  "order/fetchOrders",
  async (searchParams: OrderSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<OrdersResponse>("/", { params: searchParams });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch orders";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchOrderByIdThunk = createAsyncThunk<
  OrderResponse,
  string,
  { rejectValue: string }
>(
  "order/fetchOrderById",
  async (orderId: string, { rejectWithValue }) => {
    try {
      console.log('[ORDER THUNK] Fetching order by ID:', orderId);
      const response = await apiClient.get<OrderResponse>(`/${orderId}`);
      console.log('[ORDER THUNK] Received order response:', response.data);
      console.log('[ORDER THUNK] Order data in response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error('[ORDER THUNK] Error fetching order:', error);
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch order";
      return rejectWithValue(errorMessage);
    }
  }
);

export const createOrderThunk = createAsyncThunk<
  OrderResponse,
  CreateOrderPayload,
  { rejectValue: string }
>(
  "order/createOrder",
  async (orderData: CreateOrderPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<OrderResponse>("/", orderData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to create order";
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateOrderThunk = createAsyncThunk<
  OrderResponse,
  { id: string; data: UpdateOrderPayload },
  { rejectValue: string }
>(
  "order/updateOrder",
  async ({ id, data }: { id: string; data: UpdateOrderPayload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<OrderResponse>(`/${id}`, data);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to update order";
      return rejectWithValue(errorMessage);
    }
  }
);

export const confirmOrderThunk = createAsyncThunk<
  OrderResponse,
  string,
  { rejectValue: string }
>(
  "order/confirmOrder",
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<OrderResponse>(`/${orderId}/confirm`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to confirm order";
      return rejectWithValue(errorMessage);
    }
  }
);

export const shipOrderThunk = createAsyncThunk<
  OrderResponse,
  { id: string; trackingData: UpdateTrackingPayload },
  { rejectValue: string }
>(
  "order/shipOrder",
  async ({ id, trackingData }: { id: string; trackingData: UpdateTrackingPayload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<OrderResponse>(`/${id}/ship`, trackingData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to ship order";
      return rejectWithValue(errorMessage);
    }
  }
);

export const markAsDeliveredThunk = createAsyncThunk<
  OrderResponse,
  string,
  { rejectValue: string }
>(
  "order/markAsDelivered",
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<OrderResponse>(`/${orderId}/deliver`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to mark order as delivered";
      return rejectWithValue(errorMessage);
    }
  }
);

export const cancelOrderThunk = createAsyncThunk<
  OrderResponse,
  { id: string; reason?: string },
  { rejectValue: string }
>(
  "order/cancelOrder",
  async ({ id, reason }: { id: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<OrderResponse>(`/${id}/cancel`, { reason });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to cancel order";
      return rejectWithValue(errorMessage);
    }
  }
);

export const refundOrderThunk = createAsyncThunk<
  OrderResponse,
  { id: string; reason?: string },
  { rejectValue: string }
>(
  "order/refundOrder",
  async ({ id, reason }: { id: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<OrderResponse>(`/${id}/refund`, { reason });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to refund order";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchMyOrdersThunk = createAsyncThunk<
  OrdersResponse,
  OrderSearchParams,
  { rejectValue: string }
>(
  "order/fetchMyOrders",
  async (searchParams: OrderSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<OrdersResponse>("/buyer", { params: searchParams });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch my orders";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchOrdersByListingThunk = createAsyncThunk<
  OrdersResponse,
  { listingId: string; params?: OrderSearchParams },
  { rejectValue: string }
>(
  "order/fetchOrdersByListing",
  async ({ listingId, params = {} }: { listingId: string; params?: OrderSearchParams }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<OrdersResponse>(`/listing/${listingId}`, { params });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch orders for listing";
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateTrackingThunk = createAsyncThunk<
  OrderResponse,
  { id: string; trackingData: UpdateTrackingPayload },
  { rejectValue: string }
>(
  "order/updateTracking",
  async ({ id, trackingData }: { id: string; trackingData: UpdateTrackingPayload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<OrderResponse>(`/${id}/tracking`, trackingData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to update tracking";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchOrderStatsThunk = createAsyncThunk<
  any,
  void,
  { rejectValue: string }
>(
  "order/fetchOrderStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<any>("/stats");
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch order stats";
      return rejectWithValue(errorMessage);
    }
  }
);

export const createDisputeThunk = createAsyncThunk<
  any,
  { orderId: string; reason: string; description: string },
  { rejectValue: string }
>(
  "order/createDispute",
  async ({ orderId, reason, description }: { orderId: string; reason: string; description: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<any>(`/${orderId}/dispute`, {
        reason,
        description,
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to create dispute";
      return rejectWithValue(errorMessage);
    }
  }
);

export const resolveDisputeThunk = createAsyncThunk<
  any,
  { disputeId: string; resolution: string },
  { rejectValue: string }
>(
  "order/resolveDispute",
  async ({ disputeId, resolution }: { disputeId: string; resolution: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<any>(`/dispute/${disputeId}/resolve`, {
        resolution,
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to resolve dispute";
      return rejectWithValue(errorMessage);
    }
  }
);
