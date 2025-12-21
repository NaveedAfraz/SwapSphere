import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '@/src/services/api';
import type {
  CreateIntentRequest,
  UpdateIntentRequest,
  SearchIntentsRequest,
  Intent,
  IntentListResponse,
} from './types/intent';

export const createIntentThunk = createAsyncThunk<
  Intent,
  CreateIntentRequest,
  { rejectValue: string }
>('intents/createIntent', async (intentData, { rejectWithValue }) => {
  try {
    const response = await apiClient.post('/intents', intentData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || 'Failed to create intent';
    return rejectWithValue(message);
  }
});

export const getIntentsThunk = createAsyncThunk<
  IntentListResponse,
  { page?: number; limit?: number; status?: string },
  { rejectValue: string }
>('intents/getIntents', async (params, { rejectWithValue }) => {
  try {
    const response = await apiClient.get('/intents', { params });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || 'Failed to fetch intents';
    return rejectWithValue(message);
  }
});

export const getIntentThunk = createAsyncThunk<
  Intent,
  string,
  { rejectValue: string }
>('intents/getIntent', async (intentId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(`/intents/${intentId}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || 'Failed to fetch intent';
    return rejectWithValue(message);
  }
});

export const updateIntentThunk = createAsyncThunk<
  Intent,
  { id: string; data: UpdateIntentRequest },
  { rejectValue: string }
>('intents/updateIntent', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await apiClient.put(`/intents/${id}`, data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || 'Failed to update intent';
    return rejectWithValue(message);
  }
});

export const deleteIntentThunk = createAsyncThunk<
  { message: string; intent: Intent },
  string,
  { rejectValue: string }
>('intents/deleteIntent', async (intentId, { rejectWithValue }) => {
  try {
    const response = await apiClient.delete(`/intents/${intentId}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || 'Failed to delete intent';
    return rejectWithValue(message);
  }
});

export const searchIntentsThunk = createAsyncThunk<
  IntentListResponse,
  SearchIntentsRequest,
  { rejectValue: string }
>('intents/searchIntents', async (searchParams, { rejectWithValue }) => {
  try {
    const response = await apiClient.get('/intents/search', { params: searchParams });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || 'Failed to search intents';
    return rejectWithValue(message);
  }
});
