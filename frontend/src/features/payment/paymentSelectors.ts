import type { RootState } from '../../store';
import type { PaymentStateType, Transaction, PaymentMethodDetails, EscrowAccount, TransactionStatus, PaymentMethod } from './types/payment';

// Basic selectors
export const selectPaymentState = (state: RootState): PaymentStateType => state.payment;

export const selectTransactions = (state: RootState): Transaction[] => state.payment.transactions;

export const selectCurrentTransaction = (state: RootState): Transaction | null => state.payment.currentTransaction;

export const selectPaymentMethods = (state: RootState): PaymentMethodDetails[] => state.payment.paymentMethods;

export const selectEscrowAccount = (state: RootState): EscrowAccount | null => state.payment.escrowAccount;

export const selectPaymentStatus = (state: RootState): PaymentStateType['status'] => state.payment.status;

export const selectPaymentError = (state: RootState): string | null => state.payment.error ?? null;

export const selectCreatePaymentStatus = (state: RootState): PaymentStateType['createPaymentStatus'] => state.payment.createPaymentStatus;

export const selectCreatePaymentError = (state: RootState): string | null => state.payment.createPaymentError ?? null;

export const selectProcessPaymentStatus = (state: RootState): PaymentStateType['processPaymentStatus'] => state.payment.processPaymentStatus;

export const selectProcessPaymentError = (state: RootState): string | null => state.payment.processPaymentError ?? null;

export const selectRefundStatus = (state: RootState): PaymentStateType['refundStatus'] => state.payment.refundStatus;

export const selectRefundError = (state: RootState): string | null => state.payment.refundError ?? null;

export const selectPagination = (state: RootState) => state.payment.pagination;

export const selectFilters = (state: RootState) => state.payment.filters;

// Derived selectors
export const selectIsPaymentLoading = (state: RootState): boolean => state.payment.status === 'loading';

export const selectIsPaymentError = (state: RootState): boolean => state.payment.status === 'error';

export const selectIsPaymentSuccess = (state: RootState): boolean => state.payment.status === 'success';

export const selectIsPaymentIdle = (state: RootState): boolean => state.payment.status === 'idle';

export const selectIsCreatingPayment = (state: RootState): boolean => state.payment.createPaymentStatus === 'loading';

export const selectIsCreatePaymentError = (state: RootState): boolean => state.payment.createPaymentStatus === 'error';

export const selectIsCreatePaymentSuccess = (state: RootState): boolean => state.payment.createPaymentStatus === 'success';

export const selectIsProcessingPayment = (state: RootState): boolean => state.payment.processPaymentStatus === 'loading';

export const selectIsProcessPaymentError = (state: RootState): boolean => state.payment.processPaymentStatus === 'error';

export const selectIsProcessPaymentSuccess = (state: RootState): boolean => state.payment.processPaymentStatus === 'success';

export const selectIsRefunding = (state: RootState): boolean => state.payment.refundStatus === 'loading';

export const selectIsRefundError = (state: RootState): boolean => state.payment.refundStatus === 'error';

export const selectIsRefundSuccess = (state: RootState): boolean => state.payment.refundStatus === 'success';

export const selectHasMoreTransactions = (state: RootState): boolean => state.payment.pagination.hasMore;

export const selectTotalTransactions = (state: RootState): number => state.payment.pagination.total;

// Transaction-specific selectors
export const selectTransactionById = (state: RootState, transactionId: string): Transaction | null => {
  return state.payment.transactions.find(transaction => transaction.id === transactionId) || null;
};

export const selectTransactionsByStatus = (state: RootState, status: TransactionStatus): Transaction[] => {
  return state.payment.transactions.filter(transaction => transaction.status === status);
};

export const selectPendingTransactions = (state: RootState): Transaction[] => {
  return state.payment.transactions.filter(transaction => transaction.status === 'pending');
};

export const selectProcessingTransactions = (state: RootState): Transaction[] => {
  return state.payment.transactions.filter(transaction => transaction.status === 'processing');
};

export const selectSucceededTransactions = (state: RootState): Transaction[] => {
  return state.payment.transactions.filter(transaction => transaction.status === 'succeeded');
};

export const selectFailedTransactions = (state: RootState): Transaction[] => {
  return state.payment.transactions.filter(transaction => transaction.status === 'failed');
};

export const selectCancelledTransactions = (state: RootState): Transaction[] => {
  return state.payment.transactions.filter(transaction => transaction.status === 'cancelled');
};

export const selectRefundedTransactions = (state: RootState): Transaction[] => {
  return state.payment.transactions.filter(transaction => transaction.status === 'refunded');
};

// Payment method selectors
export const selectPaymentMethodById = (state: RootState, methodId: string): PaymentMethodDetails | null => {
  return state.payment.paymentMethods.find(method => method.id === methodId) || null;
};

export const selectDefaultPaymentMethod = (state: RootState): PaymentMethodDetails | null => {
  return state.payment.paymentMethods.find(method => method.is_default) || null;
};

export const selectPaymentMethodsByType = (state: RootState, type: PaymentMethod): PaymentMethodDetails[] => {
  return state.payment.paymentMethods.filter(method => method.type === type);
};

export const selectCardPaymentMethods = (state: RootState): PaymentMethodDetails[] => {
  return state.payment.paymentMethods.filter(method => method.type === 'card');
};

export const selectBankTransferMethods = (state: RootState): PaymentMethodDetails[] => {
  return state.payment.paymentMethods.filter(method => method.type === 'bank_transfer');
};

export const selectDigitalWalletMethods = (state: RootState): PaymentMethodDetails[] => {
  return state.payment.paymentMethods.filter(method => method.type === 'digital_wallet');
};

// Amount-based selectors
export const selectTransactionsByAmountRange = (state: RootState, minAmount: number, maxAmount: number): Transaction[] => {
  return state.payment.transactions.filter(transaction => 
    transaction.amount >= minAmount && transaction.amount <= maxAmount
  );
};

export const selectHighestTransaction = (state: RootState): Transaction | null => {
  if (state.payment.transactions.length === 0) return null;
  return state.payment.transactions.reduce((highest, transaction) => 
    transaction.amount > highest.amount ? transaction : highest
  );
};

export const selectLowestTransaction = (state: RootState): Transaction | null => {
  if (state.payment.transactions.length === 0) return null;
  return state.payment.transactions.reduce((lowest, transaction) => 
    transaction.amount < lowest.amount ? transaction : lowest
  );
};

// Order/Listing-based selectors
export const selectTransactionsByOrder = (state: RootState, orderId: string): Transaction[] => {
  return state.payment.transactions.filter(transaction => transaction.order_id === orderId);
};

export const selectTransactionsByOffer = (state: RootState, offerId: string): Transaction[] => {
  return state.payment.transactions.filter(transaction => transaction.offer_id === offerId);
};

export const selectTransactionsByListing = (state: RootState, listingId: string): Transaction[] => {
  return state.payment.transactions.filter(transaction => transaction.listing_id === listingId);
};

// Time-based selectors
export const selectRecentTransactions = (state: RootState, hours: number = 24): Transaction[] => {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  return state.payment.transactions.filter(transaction => 
    new Date(transaction.created_at) >= cutoffTime
  );
};

export const selectTransactionsByDateRange = (state: RootState, startDate: string, endDate: string): Transaction[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return state.payment.transactions.filter(transaction => {
    const transactionDate = new Date(transaction.created_at);
    return transactionDate >= start && transactionDate <= end;
  });
};

// Escrow account selectors
export const selectselectEscrowBalance = (state: RootState): number => state.payment.escrowAccount?.balance || 0;

export const selectAvailableEscrowBalance = (state: RootState): number => state.payment.escrowAccount?.available_balance || 0;

export const selectPendingEscrowBalance = (state: RootState): number => state.payment.escrowAccount?.pending_balance || 0;

export const selectIsEscrowVerified = (state: RootState): boolean => state.payment.escrowAccount?.is_verified || false;

export const selectEscrowVerificationStatus = (state: RootState): string => state.payment.escrowAccount?.verification_status || 'pending';

// Complex selectors
export const selectPaymentInfo = (state: RootState) => ({
  transactions: selectTransactions(state),
  currentTransaction: selectCurrentTransaction(state),
  paymentMethods: selectPaymentMethods(state),
  escrowAccount: selectEscrowAccount(state),
  status: selectPaymentStatus(state),
  createPaymentStatus: selectCreatePaymentStatus(state),
  processPaymentStatus: selectProcessPaymentStatus(state),
  refundStatus: selectRefundStatus(state),
  error: selectPaymentError(state),
  createPaymentError: selectCreatePaymentError(state),
  processPaymentError: selectProcessPaymentError(state),
  refundError: selectRefundError(state),
  pagination: selectPagination(state),
  filters: selectFilters(state),
});

export const selectTransactionStats = (state: RootState) => {
  const transactions = selectTransactions(state);
  
  return {
    total: transactions.length,
    pending: transactions.filter(t => t.status === 'pending').length,
    processing: transactions.filter(t => t.status === 'processing').length,
    succeeded: transactions.filter(t => t.status === 'succeeded').length,
    failed: transactions.filter(t => t.status === 'failed').length,
    cancelled: transactions.filter(t => t.status === 'cancelled').length,
    refunded: transactions.filter(t => t.status === 'refunded').length,
    totalVolume: transactions.reduce((sum, transaction) => sum + transaction.amount, 0),
    successfulVolume: transactions.filter(t => t.status === 'succeeded').reduce((sum, transaction) => sum + transaction.amount, 0),
    refundedVolume: transactions.filter(t => t.status === 'refunded').reduce((sum, transaction) => sum + (transaction.refund_amount || 0), 0),
    averageTransactionAmount: transactions.length > 0 ? transactions.reduce((sum, transaction) => sum + transaction.amount, 0) / transactions.length : 0,
    successRate: transactions.length > 0 ? (transactions.filter(t => t.status === 'succeeded').length / transactions.length) * 100 : 0,
  };
};

export const selectPaymentMethodStats = (state: RootState) => {
  const paymentMethods = selectPaymentMethods(state);
  const transactions = selectTransactions(state);
  
  return {
    totalPaymentMethods: paymentMethods.length,
    cardMethods: paymentMethods.filter(m => m.type === 'card').length,
    bankTransferMethods: paymentMethods.filter(m => m.type === 'bank_transfer').length,
    digitalWalletMethods: paymentMethods.filter(m => m.type === 'digital_wallet').length,
    hasDefaultMethod: paymentMethods.some(m => m.is_default),
    cardTransactions: transactions.filter(t => t.payment_method === 'card').length,
    bankTransferTransactions: transactions.filter(t => t.payment_method === 'bank_transfer').length,
    digitalWalletTransactions: transactions.filter(t => t.payment_method === 'digital_wallet').length,
  };
};

export const selectEscrowStats = (state: RootState) => {
  const escrowAccount = selectEscrowAccount(state);
  const transactions = selectTransactions(state);
  
  return {
    totalBalance: escrowAccount?.balance || 0,
    availableBalance: escrowAccount?.available_balance || 0,
    pendingBalance: escrowAccount?.pending_balance || 0,
    isVerified: escrowAccount?.is_verified || false,
    verificationStatus: escrowAccount?.verification_status || 'pending',
    totalTransactions: transactions.filter(t => t.status === 'succeeded').length,
    pendingWithdrawals: transactions.filter(t => t.status === 'pending').length,
    totalWithdrawn: transactions.filter(t => t.status === 'succeeded').reduce((sum, t) => sum + t.amount, 0),
  };
};

export const selectCanWithdraw = (state: RootState): boolean => {
  const escrowAccount = selectEscrowAccount(state);
  return (escrowAccount?.is_verified || false) && (escrowAccount?.available_balance || 0) > 0;
};

export const selectNeedsPaymentMethod = (state: RootState): boolean => {
  return selectPaymentMethods(state).length === 0;
};

export const selectNeedsEscrowAccount = (state: RootState): boolean => {
  return !selectEscrowAccount(state);
};
