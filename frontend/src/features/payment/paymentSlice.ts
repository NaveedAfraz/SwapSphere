import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { PaymentStateType, Transaction, PaymentMethodDetails, EscrowAccount, TransactionStatus } from './types/payment';

const initialState: PaymentStateType = {
  transactions: [],
  currentTransaction: null,
  paymentMethods: [],
  escrowAccount: null,
  status: 'idle',
  error: null,
  createPaymentStatus: 'idle',
  createPaymentError: null,
  processPaymentStatus: 'idle',
  processPaymentError: null,
  refundStatus: 'idle',
  refundError: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  },
  filters: {
    sortBy: 'created_at',
    sortOrder: 'desc',
  },
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state: PaymentStateType) => {
      state.error = null;
    },
    clearCreatePaymentError: (state: PaymentStateType) => {
      state.createPaymentError = null;
    },
    clearProcessPaymentError: (state: PaymentStateType) => {
      state.processPaymentError = null;
    },
    clearRefundError: (state: PaymentStateType) => {
      state.refundError = null;
    },
    resetCreatePaymentStatus: (state: PaymentStateType) => {
      state.createPaymentStatus = 'idle';
      state.createPaymentError = null;
    },
    resetProcessPaymentStatus: (state: PaymentStateType) => {
      state.processPaymentStatus = 'idle';
      state.processPaymentError = null;
    },
    resetRefundStatus: (state: PaymentStateType) => {
      state.refundStatus = 'idle';
      state.refundError = null;
    },
    setCurrentTransaction: (state: PaymentStateType, action: PayloadAction<Transaction | null>) => {
      state.currentTransaction = action.payload;
    },
    updateFilters: (state: PaymentStateType, action: PayloadAction<any>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state: PaymentStateType) => {
      state.filters = {
        sortBy: 'created_at',
        sortOrder: 'desc',
      };
    },
    clearTransactions: (state: PaymentStateType) => {
      state.transactions = [];
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
      };
    },
    updateTransactionLocal: (state: PaymentStateType, action: PayloadAction<{ id: string; updates: Partial<Transaction> }>) => {
      const { id, updates } = action.payload;
      const index = state.transactions.findIndex(transaction => transaction.id === id);
      if (index !== -1) {
        state.transactions[index] = { ...state.transactions[index], ...updates };
      }
      if (state.currentTransaction?.id === id) {
        state.currentTransaction = { ...state.currentTransaction, ...updates };
      }
    },
    removeTransactionLocal: (state: PaymentStateType, action: PayloadAction<string>) => {
      const transactionId = action.payload;
      state.transactions = state.transactions.filter(transaction => transaction.id !== transactionId);
      if (state.currentTransaction?.id === transactionId) {
        state.currentTransaction = null;
      }
    },
    addTransaction: (state: PaymentStateType, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
    },
    updatePaymentMethodLocal: (state: PaymentStateType, action: PayloadAction<{ id: string; updates: Partial<PaymentMethodDetails> }>) => {
      const { id, updates } = action.payload;
      const index = state.paymentMethods.findIndex(method => method.id === id);
      if (index !== -1) {
        state.paymentMethods[index] = { ...state.paymentMethods[index], ...updates };
      }
    },
    removePaymentMethodLocal: (state: PaymentStateType, action: PayloadAction<string>) => {
      const methodId = action.payload;
      state.paymentMethods = state.paymentMethods.filter(method => method.id !== methodId);
    },
    updateEscrowAccountLocal: (state: PaymentStateType, action: PayloadAction<Partial<EscrowAccount>>) => {
      if (state.escrowAccount) {
        state.escrowAccount = { ...state.escrowAccount, ...action.payload };
      }
    },
  },
  extraReducers: (builder: any) => {
    // Handle fetch transactions thunk
    builder
      .addCase('payment/fetchTransactions/pending', (state: PaymentStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('payment/fetchTransactions/fulfilled', (state: PaymentStateType, action: PayloadAction<{ transactions: Transaction[]; pagination: any }>) => {
        state.status = 'success';
        state.transactions = action.payload.transactions;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('payment/fetchTransactions/rejected', (state: PaymentStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch transactions';
      });

    // Handle fetch transaction by ID thunk
    builder
      .addCase('payment/fetchTransactionById/pending', (state: PaymentStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('payment/fetchTransactionById/fulfilled', (state: PaymentStateType, action: PayloadAction<{ transaction: Transaction }>) => {
        state.status = 'success';
        state.currentTransaction = action.payload.transaction;
        state.error = null;
      })
      .addCase('payment/fetchTransactionById/rejected', (state: PaymentStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch transaction';
      });

    // Handle create payment intent thunk
    builder
      .addCase('payment/createPaymentIntent/pending', (state: PaymentStateType) => {
        state.createPaymentStatus = 'loading';
        state.createPaymentError = null;
      })
      .addCase('payment/createPaymentIntent/fulfilled', (state: PaymentStateType, action: PayloadAction<any>) => {
        state.createPaymentStatus = 'success';
        state.createPaymentError = null;
      })
      .addCase('payment/createPaymentIntent/rejected', (state: PaymentStateType, action: any) => {
        state.createPaymentStatus = 'error';
        state.createPaymentError = action.payload as string || 'Failed to create payment intent';
      });

    // Handle process payment thunk
    builder
      .addCase('payment/processPayment/pending', (state: PaymentStateType) => {
        state.processPaymentStatus = 'loading';
        state.processPaymentError = null;
      })
      .addCase('payment/processPayment/fulfilled', (state: PaymentStateType, action: PayloadAction<{ transaction: Transaction }>) => {
        state.processPaymentStatus = 'success';
        state.transactions.unshift(action.payload.transaction);
        state.currentTransaction = action.payload.transaction;
        state.processPaymentError = null;
      })
      .addCase('payment/processPayment/rejected', (state: PaymentStateType, action: any) => {
        state.processPaymentStatus = 'error';
        state.processPaymentError = action.payload as string || 'Failed to process payment';
      });

    // Handle refund transaction thunk
    builder
      .addCase('payment/refundTransaction/pending', (state: PaymentStateType) => {
        state.refundStatus = 'loading';
        state.refundError = null;
      })
      .addCase('payment/refundTransaction/fulfilled', (state: PaymentStateType, action: PayloadAction<{ transaction: Transaction }>) => {
        state.refundStatus = 'success';
        const updatedTransaction = action.payload.transaction;
        
        // Update transaction in list
        const index = state.transactions.findIndex(transaction => transaction.id === updatedTransaction.id);
        if (index !== -1) {
          state.transactions[index] = updatedTransaction;
        }
        
        if (state.currentTransaction?.id === updatedTransaction.id) {
          state.currentTransaction = updatedTransaction;
        }
        
        state.refundError = null;
      })
      .addCase('payment/refundTransaction/rejected', (state: PaymentStateType, action: any) => {
        state.refundStatus = 'error';
        state.refundError = action.payload as string || 'Failed to refund transaction';
      });

    // Handle fetch payment methods thunk
    builder
      .addCase('payment/fetchPaymentMethods/pending', (state: PaymentStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('payment/fetchPaymentMethods/fulfilled', (state: PaymentStateType, action: PayloadAction<{ payment_methods: PaymentMethodDetails[] }>) => {
        state.status = 'success';
        state.paymentMethods = action.payload.payment_methods;
        state.error = null;
      })
      .addCase('payment/fetchPaymentMethods/rejected', (state: PaymentStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch payment methods';
      });

    // Handle add payment method thunk
    builder
      .addCase('payment/addPaymentMethod/fulfilled', (state: PaymentStateType, action: PayloadAction<{ payment_methods: PaymentMethodDetails[] }>) => {
        state.paymentMethods = action.payload.payment_methods;
      });

    // Handle update payment method thunk
    builder
      .addCase('payment/updatePaymentMethod/fulfilled', (state: PaymentStateType, action: PayloadAction<{ payment_methods: PaymentMethodDetails[] }>) => {
        state.paymentMethods = action.payload.payment_methods;
      });

    // Handle delete payment method thunk
    builder
      .addCase('payment/deletePaymentMethod/fulfilled', (state: PaymentStateType, action: PayloadAction<string>) => {
        const methodId = action.payload;
        state.paymentMethods = state.paymentMethods.filter(method => method.id !== methodId);
      });

    // Handle set default payment method thunk
    builder
      .addCase('payment/setDefaultPaymentMethod/fulfilled', (state: PaymentStateType, action: PayloadAction<{ payment_methods: PaymentMethodDetails[] }>) => {
        state.paymentMethods = action.payload.payment_methods;
      });

    // Handle fetch escrow account thunk
    builder
      .addCase('payment/fetchEscrowAccount/pending', (state: PaymentStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('payment/fetchEscrowAccount/fulfilled', (state: PaymentStateType, action: PayloadAction<{ escrow_account: EscrowAccount }>) => {
        state.status = 'success';
        state.escrowAccount = action.payload.escrow_account;
        state.error = null;
      })
      .addCase('payment/fetchEscrowAccount/rejected', (state: PaymentStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch escrow account';
      });

    // Handle create escrow account thunk
    builder
      .addCase('payment/createEscrowAccount/pending', (state: PaymentStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('payment/createEscrowAccount/fulfilled', (state: PaymentStateType, action: PayloadAction<{ escrow_account: EscrowAccount }>) => {
        state.status = 'success';
        state.escrowAccount = action.payload.escrow_account;
        state.error = null;
      })
      .addCase('payment/createEscrowAccount/rejected', (state: PaymentStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to create escrow account';
      });

    // Handle withdraw from escrow thunk
    builder
      .addCase('payment/withdrawFromEscrow/fulfilled', (state: PaymentStateType, action: PayloadAction<{ transaction: Transaction }>) => {
        state.transactions.unshift(action.payload.transaction);
        
        // Update escrow account balance if available
        if (state.escrowAccount) {
          state.escrowAccount.balance -= action.payload.transaction.amount;
          state.escrowAccount.available_balance -= action.payload.transaction.amount;
        }
      });

    // Handle verify payment method thunk
    builder
      .addCase('payment/verifyPaymentMethod/fulfilled', (state: PaymentStateType, action: PayloadAction<{ payment_methods: PaymentMethodDetails[] }>) => {
        state.paymentMethods = action.payload.payment_methods;
      });
  },
});

export const {
  clearError,
  clearCreatePaymentError,
  clearProcessPaymentError,
  clearRefundError,
  resetCreatePaymentStatus,
  resetProcessPaymentStatus,
  resetRefundStatus,
  setCurrentTransaction,
  updateFilters,
  resetFilters,
  clearTransactions,
  updateTransactionLocal,
  removeTransactionLocal,
  addTransaction,
  updatePaymentMethodLocal,
  removePaymentMethodLocal,
  updateEscrowAccountLocal,
} = paymentSlice.actions;

export default paymentSlice.reducer;
