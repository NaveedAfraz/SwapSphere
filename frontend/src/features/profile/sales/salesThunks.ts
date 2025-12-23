import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../../services/api';
import type { FetchSalesParams, SaleDetails, SalesResponse } from './types/sales';

// Update order status thunk
export const updateOrderStatus = createAsyncThunk(
  'sales/updateOrderStatus',
  async ({ orderId, status }: { orderId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/order/${orderId}/status`, { status });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to update order status'
      );
    }
  }
);

// Async thunks for sales operations
export const fetchSales = createAsyncThunk(
  'sales/fetchSales',
  async (params: FetchSalesParams | undefined, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
      
      const response = await apiClient.get(`/profile/sales?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch sales'
      );
    }
  }
);

export const fetchSaleDetails = createAsyncThunk(
  'sales/fetchSaleDetails',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/profile/sales/${orderId}`);
      return response.data.sale;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch sale details'
      );
    }
  }
);

export const fetchSalesStats = createAsyncThunk(
  'sales/fetchSalesStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/profile/sales?limit=1');
      return response.data.stats;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch sales stats'
      );
    }
  }
);

// Additional thunks for specific sales operations
export const refreshSales = createAsyncThunk(
  'sales/refreshSales',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Fetch fresh sales data
      const result = await dispatch(fetchSales()).unwrap();
      return result;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to refresh sales'
      );
    }
  }
);

export const loadMoreSales = createAsyncThunk(
  'sales/loadMoreSales',
  async (params: FetchSalesParams, { dispatch, rejectWithValue }) => {
    try {
      const result = await dispatch(fetchSales(params)).unwrap();
      return result;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to load more sales'
      );
    }
  }
);
