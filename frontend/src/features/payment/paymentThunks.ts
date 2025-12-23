import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../../services/api";
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

export const fetchTransactionsThunk = createAsyncThunk<
  TransactionsResponse,
  TransactionSearchParams,
  { rejectValue: string }
>(
  "payment/fetchTransactions",
  async (searchParams: TransactionSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<TransactionsResponse>("/payment/transactions", { params: searchParams });
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
      const response = await apiClient.get<TransactionResponse>(`/payment/transactions/${transactionId}`);
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
      const response = await apiClient.post<PaymentIntentResponse>("/payment/create-intent", paymentData);
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
      const response = await apiClient.post<TransactionResponse>("/payment/process", paymentData);
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
  "payment/payment/refundTransaction",
  async (refundData: RefundPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<TransactionResponse>("/payment/refund", refundData);
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
      const response = await apiClient.get<PaymentMethodsResponse>("/payment/payment-methods");
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
      const response = await apiClient.post<PaymentMethodsResponse>("/payment/payment-methods", paymentMethodData);
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
      const response = await apiClient.put<PaymentMethodsResponse>(`/payment/payment-methods/${id}`, data);
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
      await apiClient.delete(`/payment/payment-methods/${paymentMethodId}`);
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
      const response = await apiClient.post<PaymentMethodsResponse>(`/payment/payment-methods/${paymentMethodId}/set-default`);
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
      const response = await apiClient.get<EscrowAccountResponse>("/payment/escrow");
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
      const response = await apiClient.post<EscrowAccountResponse>("/payment/escrow");
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
      const response = await apiClient.post<TransactionResponse>("/payment/escrow/withdraw", withdrawalData);
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
      const response = await apiClient.get<any>("/payment/stats", {
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
      const response = await apiClient.post<PaymentMethodsResponse>(`/payment/payment-methods/${paymentMethodId}/verify`, verificationData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to verify payment method";
      return rejectWithValue(errorMessage);
    }
  }
);

export const createPaymentOrderThunk = createAsyncThunk(
  "payment/createPaymentOrder",
  async ({ orderId, amount }: { orderId: string; amount: number }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/payment/paypal/order", {
        order_id: orderId,
        amount: amount,
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to create PayPal payment order";
      return rejectWithValue(errorMessage);
    }
  }
);

export const capturePayPalPaymentThunk = createAsyncThunk(
  "payment/capturePayPalPayment",
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/payment/paypal/capture", { token });
      return response.data;
    } catch (error: any) {
      // Handle INSTRUMENT_DECLINED error for funding source issues
      if (
        error.response?.status === 409 &&
        error.response?.data?.error === "INSTRUMENT_DECLINED"
      ) {
        // Return special error with redirect URL for handling in UI
        return rejectWithValue({
          isInstrumentDeclined: true,
          redirectUrl: error.response.data.redirect_url,
          message: error.response.data.message
        });
      }
      
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to capture PayPal payment";
      return rejectWithValue(errorMessage);
    }
  }
);

export const getOrderPaymentsThunk = createAsyncThunk(
  "payment/getOrderPayments",
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/payment/order/${orderId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to get order payments";
      return rejectWithValue(errorMessage);
    }
  }
);

export const getPaymentStatusThunk = createAsyncThunk(
  "payment/getPaymentStatus",
  async (paymentId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/payment/${paymentId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to get payment status";
      return rejectWithValue(errorMessage);
    }
  }
);
