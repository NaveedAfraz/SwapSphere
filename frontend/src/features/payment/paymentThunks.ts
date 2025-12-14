import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type { 
  CreatePaymentIntentPayload,
  ProcessPaymentPayload,
  RefundPayload,
  AddPaymentMethodPayload,
  UpdatePaymentMethodPayload,
  TransactionSearchParams,
  WithdrawalPayload,
  PaymentIntentResponse,
  TransactionResponse,
  TransactionsResponse,
  PaymentMethodsResponse,
  EscrowAccountResponse
} from "./types/payment";

const API_BASE = "http://192.168.0.104:5000/api/payment";

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

export const fetchTransactionsThunk = createAsyncThunk<
  TransactionsResponse,
  TransactionSearchParams,
  { rejectValue: string }
>(
  "payment/fetchTransactions",
  async (searchParams: TransactionSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<TransactionsResponse>("/transactions", { params: searchParams });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch transactions";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTransactionByIdThunk = createAsyncThunk<
  TransactionResponse,
  string,
  { rejectValue: string }
>(
  "payment/fetchTransactionById",
  async (transactionId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<TransactionResponse>(`/transactions/${transactionId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch transaction";
      return rejectWithValue(errorMessage);
    }
  }
);

export const createPaymentIntentThunk = createAsyncThunk<
  PaymentIntentResponse,
  CreatePaymentIntentPayload,
  { rejectValue: string }
>(
  "payment/createPaymentIntent",
  async (paymentData: CreatePaymentIntentPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<PaymentIntentResponse>("/create-intent", paymentData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to create payment intent";
      return rejectWithValue(errorMessage);
    }
  }
);

export const processPaymentThunk = createAsyncThunk<
  TransactionResponse,
  ProcessPaymentPayload,
  { rejectValue: string }
>(
  "payment/processPayment",
  async (paymentData: ProcessPaymentPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<TransactionResponse>("/process", paymentData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to process payment";
      return rejectWithValue(errorMessage);
    }
  }
);

export const refundTransactionThunk = createAsyncThunk<
  TransactionResponse,
  RefundPayload,
  { rejectValue: string }
>(
  "payment/refundTransaction",
  async (refundData: RefundPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<TransactionResponse>("/refund", refundData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to refund transaction";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchPaymentMethodsThunk = createAsyncThunk<
  PaymentMethodsResponse,
  void,
  { rejectValue: string }
>(
  "payment/fetchPaymentMethods",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<PaymentMethodsResponse>("/payment-methods");
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch payment methods";
      return rejectWithValue(errorMessage);
    }
  }
);

export const addPaymentMethodThunk = createAsyncThunk<
  PaymentMethodsResponse,
  AddPaymentMethodPayload,
  { rejectValue: string }
>(
  "payment/addPaymentMethod",
  async (paymentMethodData: AddPaymentMethodPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<PaymentMethodsResponse>("/payment-methods", paymentMethodData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to add payment method";
      return rejectWithValue(errorMessage);
    }
  }
);

export const updatePaymentMethodThunk = createAsyncThunk<
  PaymentMethodsResponse,
  { id: string; data: UpdatePaymentMethodPayload },
  { rejectValue: string }
>(
  "payment/updatePaymentMethod",
  async ({ id, data }: { id: string; data: UpdatePaymentMethodPayload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<PaymentMethodsResponse>(`/payment-methods/${id}`, data);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to update payment method";
      return rejectWithValue(errorMessage);
    }
  }
);

export const deletePaymentMethodThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  "payment/deletePaymentMethod",
  async (paymentMethodId: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/payment-methods/${paymentMethodId}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to delete payment method";
      return rejectWithValue(errorMessage);
    }
  }
);

export const setDefaultPaymentMethodThunk = createAsyncThunk<
  PaymentMethodsResponse,
  string,
  { rejectValue: string }
>(
  "payment/setDefaultPaymentMethod",
  async (paymentMethodId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<PaymentMethodsResponse>(`/payment-methods/${paymentMethodId}/set-default`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to set default payment method";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchEscrowAccountThunk = createAsyncThunk<
  EscrowAccountResponse,
  void,
  { rejectValue: string }
>(
  "payment/fetchEscrowAccount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<EscrowAccountResponse>("/escrow");
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch escrow account";
      return rejectWithValue(errorMessage);
    }
  }
);

export const createEscrowAccountThunk = createAsyncThunk<
  EscrowAccountResponse,
  void,
  { rejectValue: string }
>(
  "payment/createEscrowAccount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<EscrowAccountResponse>("/escrow");
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to create escrow account";
      return rejectWithValue(errorMessage);
    }
  }
);

export const withdrawFromEscrowThunk = createAsyncThunk<
  TransactionResponse,
  WithdrawalPayload,
  { rejectValue: string }
>(
  "payment/withdrawFromEscrow",
  async (withdrawalData: WithdrawalPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<TransactionResponse>("/escrow/withdraw", withdrawalData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to withdraw from escrow";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTransactionStatsThunk = createAsyncThunk<
  any,
  { startDate?: string; endDate?: string },
  { rejectValue: string }
>(
  "payment/fetchTransactionStats",
  async ({ startDate, endDate }: { startDate?: string; endDate?: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<any>("/stats", {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch transaction stats";
      return rejectWithValue(errorMessage);
    }
  }
);

export const verifyPaymentMethodThunk = createAsyncThunk<
  PaymentMethodsResponse,
  { paymentMethodId: string; verificationData: any },
  { rejectValue: string }
>(
  "payment/verifyPaymentMethod",
  async ({ paymentMethodId, verificationData }: { paymentMethodId: string; verificationData: any }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<PaymentMethodsResponse>(`/payment-methods/${paymentMethodId}/verify`, verificationData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to verify payment method";
      return rejectWithValue(errorMessage);
    }
  }
);
