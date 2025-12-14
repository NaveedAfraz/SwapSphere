import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type { 
  CreateTicketPayload, 
  UpdateTicketPayload,
  CreateMessagePayload,
  CreateDisputePayload,
  SubmitEvidencePayload,
  UpdateDisputePayload,
  SatisfactionPayload,
  TicketSearchParams,
  TicketResponse, 
  TicketsResponse,
  MessagesResponse,
  DisputeResponse,
  DisputesResponse,
  SupportStatsResponse
} from "./types/support";

const API_BASE = "http://192.168.0.104:5000/api/support";

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

export const fetchTicketsThunk = createAsyncThunk<
  TicketsResponse,
  TicketSearchParams,
  { rejectValue: string }
>(
  "support/fetchTickets",
  async (searchParams: TicketSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<TicketsResponse>("/tickets", { params: searchParams });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch tickets";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTicketByIdThunk = createAsyncThunk<
  TicketResponse,
  string,
  { rejectValue: string }
>(
  "support/fetchTicketById",
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<TicketResponse>(`/tickets/${ticketId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch ticket";
      return rejectWithValue(errorMessage);
    }
  }
);

export const createTicketThunk = createAsyncThunk<
  TicketResponse,
  CreateTicketPayload,
  { rejectValue: string }
>(
  "support/createTicket",
  async (ticketData: CreateTicketPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<TicketResponse>("/tickets", ticketData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to create ticket";
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateTicketThunk = createAsyncThunk<
  TicketResponse,
  { id: string; data: UpdateTicketPayload },
  { rejectValue: string }
>(
  "support/updateTicket",
  async ({ id, data }: { id: string; data: UpdateTicketPayload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<TicketResponse>(`/tickets/${id}`, data);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to update ticket";
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteTicketThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  "support/deleteTicket",
  async (ticketId: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/tickets/${ticketId}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to delete ticket";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTicketMessagesThunk = createAsyncThunk<
  MessagesResponse,
  string,
  { rejectValue: string }
>(
  "support/fetchTicketMessages",
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<MessagesResponse>(`/tickets/${ticketId}/messages`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch messages";
      return rejectWithValue(errorMessage);
    }
  }
);

export const createMessageThunk = createAsyncThunk<
  void,
  CreateMessagePayload,
  { rejectValue: string }
>(
  "support/createMessage",
  async (messageData: CreateMessagePayload, { rejectWithValue }) => {
    try {
      await apiClient.post("/messages", messageData);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to send message";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchDisputesThunk = createAsyncThunk<
  DisputesResponse,
  TicketSearchParams,
  { rejectValue: string }
>(
  "support/fetchDisputes",
  async (searchParams: TicketSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<DisputesResponse>("/disputes", { params: searchParams });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch disputes";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchDisputeByIdThunk = createAsyncThunk<
  DisputeResponse,
  string,
  { rejectValue: string }
>(
  "support/fetchDisputeById",
  async (disputeId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<DisputeResponse>(`/disputes/${disputeId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch dispute";
      return rejectWithValue(errorMessage);
    }
  }
);

export const createDisputeThunk = createAsyncThunk<
  DisputeResponse,
  CreateDisputePayload,
  { rejectValue: string }
>(
  "support/createDispute",
  async (disputeData: CreateDisputePayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<DisputeResponse>("/disputes", disputeData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to create dispute";
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateDisputeThunk = createAsyncThunk<
  DisputeResponse,
  { id: string; data: UpdateDisputePayload },
  { rejectValue: string }
>(
  "support/updateDispute",
  async ({ id, data }: { id: string; data: UpdateDisputePayload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<DisputeResponse>(`/disputes/${id}`, data);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to update dispute";
      return rejectWithValue(errorMessage);
    }
  }
);

export const submitEvidenceThunk = createAsyncThunk<
  DisputeResponse,
  SubmitEvidencePayload,
  { rejectValue: string }
>(
  "support/submitEvidence",
  async (evidenceData: SubmitEvidencePayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<DisputeResponse>(`/disputes/${evidenceData.dispute_id}/evidence`, evidenceData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to submit evidence";
      return rejectWithValue(errorMessage);
    }
  }
);

export const submitSatisfactionThunk = createAsyncThunk<
  void,
  SatisfactionPayload,
  { rejectValue: string }
>(
  "support/submitSatisfaction",
  async (satisfactionData: SatisfactionPayload, { rejectWithValue }) => {
    try {
      await apiClient.post("/satisfaction", satisfactionData);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to submit satisfaction rating";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchSupportStatsThunk = createAsyncThunk<
  SupportStatsResponse,
  void,
  { rejectValue: string }
>(
  "support/fetchSupportStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<SupportStatsResponse>("/stats");
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch support stats";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchMyTicketsThunk = createAsyncThunk<
  TicketsResponse,
  TicketSearchParams,
  { rejectValue: string }
>(
  "support/fetchMyTickets",
  async (searchParams: TicketSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<TicketsResponse>("/my-tickets", { params: searchParams });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch my tickets";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchMyDisputesThunk = createAsyncThunk<
  DisputesResponse,
  TicketSearchParams,
  { rejectValue: string }
>(
  "support/fetchMyDisputes",
  async (searchParams: TicketSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<DisputesResponse>("/my-disputes", { params: searchParams });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch my disputes";
      return rejectWithValue(errorMessage);
    }
  }
);

export const escalateTicketThunk = createAsyncThunk<
  TicketResponse,
  string,
  { rejectValue: string }
>(
  "support/escalateTicket",
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<TicketResponse>(`/tickets/${ticketId}/escalate`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to escalate ticket";
      return rejectWithValue(errorMessage);
    }
  }
);

export const closeTicketThunk = createAsyncThunk<
  TicketResponse,
  { id: string; reason?: string },
  { rejectValue: string }
>(
  "support/closeTicket",
  async ({ id, reason }: { id: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<TicketResponse>(`/tickets/${id}/close`, { reason });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to close ticket";
      return rejectWithValue(errorMessage);
    }
  }
);

export const reopenTicketThunk = createAsyncThunk<
  TicketResponse,
  { id: string; reason?: string },
  { rejectValue: string }
>(
  "support/reopenTicket",
  async ({ id, reason }: { id: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<TicketResponse>(`/tickets/${id}/reopen`, { reason });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to reopen ticket";
      return rejectWithValue(errorMessage);
    }
  }
);
