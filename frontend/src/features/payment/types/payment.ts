export type PaymentStatus = "idle" | "loading" | "success" | "error";

export type TransactionStatus = "pending" | "processing" | "succeeded" | "failed" | "cancelled" | "refunded";

export type PaymentMethod = "card" | "bank_transfer" | "digital_wallet";

export interface PaymentMethodDetails {
  id: string;
  type: PaymentMethod;
  last4?: string;
  brand?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  order_id?: string;
  offer_id?: string;
  listing_id?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  payment_method: PaymentMethod;
  payment_intent_id?: string;
  stripe_payment_intent_id?: string;
  description?: string;
  metadata?: Record<string, string>;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  failed_at?: string;
  refunded_at?: string;
  refund_amount?: number;
  refund_reason?: string;
}

export interface EscrowAccount {
  id: string;
  user_id: string;
  balance: number;
  available_balance: number;
  pending_balance: number;
  currency: string;
  stripe_account_id?: string;
  is_verified: boolean;
  verification_status: "pending" | "verified" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface PaymentStateType {
  transactions: Transaction[];
  currentTransaction: Transaction | null;
  paymentMethods: PaymentMethodDetails[];
  escrowAccount: EscrowAccount | null;
  status: PaymentStatus;
  error: string | null;
  createPaymentStatus: PaymentStatus;
  createPaymentError: string | null;
  processPaymentStatus: PaymentStatus;
  processPaymentError: string | null;
  refundStatus: PaymentStatus;
  refundError: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: {
    status?: TransactionStatus;
    payment_method?: PaymentMethod;
    user_id?: string;
    order_id?: string;
    minAmount?: number;
    maxAmount?: number;
    startDate?: string;
    endDate?: string;
    sortBy?: "created_at" | "amount" | "updated_at";
    sortOrder?: "asc" | "desc";
  };
}

export interface CreatePaymentIntentPayload {
  amount: number;
  currency?: string;
  order_id?: string;
  offer_id?: string;
  listing_id?: string;
  description?: string;
  metadata?: Record<string, string>;
  payment_method_types?: PaymentMethod[];
}

export interface ProcessPaymentPayload {
  payment_intent_id: string;
  payment_method_id?: string;
  save_payment_method?: boolean;
}

export interface RefundPayload {
  transaction_id: string;
  amount?: number;
  reason?: string;
}

export interface AddPaymentMethodPayload {
  type: PaymentMethod;
  payment_method_token: string;
  is_default?: boolean;
}

export interface UpdatePaymentMethodPayload {
  is_default?: boolean;
  expiry_month?: number;
  expiry_year?: number;
}

export interface TransactionSearchParams {
  status?: TransactionStatus;
  payment_method?: PaymentMethod;
  user_id?: string;
  order_id?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "amount" | "updated_at";
  sortOrder?: "asc" | "desc";
}

export interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface TransactionResponse {
  transaction: Transaction;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface PaymentMethodsResponse {
  payment_methods: PaymentMethodDetails[];
}

export interface EscrowAccountResponse {
  escrow_account: EscrowAccount;
}

export interface TransactionStats {
  totalTransactions: number;
  totalVolume: number;
  successfulTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
  pendingTransactions: number;
  averageTransactionAmount: number;
  totalRefunds: number;
  successRate: number;
}

export interface WithdrawalPayload {
  amount: number;
  destination: string;
  method: "bank_account" | "card";
}
