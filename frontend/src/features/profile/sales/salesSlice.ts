import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { 
  SalesStateType, 
  SalesResponse, 
  SaleDetails, 
  SalesStats 
} from './types/sales';
import { 
  fetchSales, 
  fetchSaleDetails, 
  fetchSalesStats, 
  refreshSales,
  loadMoreSales 
} from './salesThunks';

const initialState: SalesStateType = {
  sales: [],
  currentSale: null,
  salesStats: null,
  pagination: null,
  status: 'idle',
  error: null,
  detailsStatus: 'idle',
  detailsError: null,
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state: SalesStateType) => {
      state.error = null;
    },
    clearDetailsError: (state: SalesStateType) => {
      state.detailsError = null;
    },
    clearCurrentSale: (state: SalesStateType) => {
      state.currentSale = null;
    },
    resetSalesState: (state: SalesStateType) => {
      state.sales = [];
      state.currentSale = null;
      state.salesStats = null;
      state.pagination = null;
      state.status = 'idle';
      state.error = null;
      state.detailsStatus = 'idle';
      state.detailsError = null;
    },
    updateSaleStatus: (state: SalesStateType, action: PayloadAction<{ orderId: string; status: string }>) => {
      const sale = state.sales.find(s => s.order_id === action.payload.orderId);
      if (sale) {
        sale.order_status = action.payload.status;
      }
      if (state.currentSale && state.currentSale.order_id === action.payload.orderId) {
        state.currentSale.order_status = action.payload.status;
      }
    },
    // For optimistic updates
    optimisticUpdateSale: (state: SalesStateType, action: PayloadAction<{ orderId: string; updates: Partial<SaleDetails> }>) => {
      const { orderId, updates } = action.payload;
      
      // Update in sales list
      const saleIndex = state.sales.findIndex(s => s.order_id === orderId);
      if (saleIndex !== -1) {
        state.sales[saleIndex] = { ...state.sales[saleIndex], ...updates };
      }
      
      // Update current sale if it matches
      if (state.currentSale && state.currentSale.order_id === orderId) {
        state.currentSale = { ...state.currentSale, ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    // Handle fetchSales
    builder
      .addCase(fetchSales.pending, (state: SalesStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSales.fulfilled, (state: SalesStateType, action: PayloadAction<SalesResponse>) => {
        state.status = 'success';
        state.sales = action.payload.sales;
        state.pagination = action.payload.pagination;
        state.salesStats = action.payload.stats;
        state.error = null;
      })
      .addCase(fetchSales.rejected, (state: SalesStateType, action) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch sales';
      });

    // Handle fetchSaleDetails
    builder
      .addCase(fetchSaleDetails.pending, (state: SalesStateType) => {
        state.detailsStatus = 'loading';
        state.detailsError = null;
      })
      .addCase(fetchSaleDetails.fulfilled, (state: SalesStateType, action: PayloadAction<SaleDetails>) => {
        state.detailsStatus = 'success';
        state.currentSale = action.payload;
        state.detailsError = null;
      })
      .addCase(fetchSaleDetails.rejected, (state: SalesStateType, action) => {
        state.detailsStatus = 'error';
        state.detailsError = action.payload as string || 'Failed to fetch sale details';
      });

    // Handle fetchSalesStats
    builder
      .addCase(fetchSalesStats.fulfilled, (state: SalesStateType, action: PayloadAction<SalesStats>) => {
        state.salesStats = action.payload;
      });

    // Handle refreshSales (same as fetchSales but maintains loading state)
    builder
      .addCase(refreshSales.fulfilled, (state: SalesStateType, action: PayloadAction<SalesResponse>) => {
        state.sales = action.payload.sales;
        state.pagination = action.payload.pagination;
        state.salesStats = action.payload.stats;
        state.error = null;
      });

    // Handle loadMoreSales (append to existing sales)
    builder
      .addCase(loadMoreSales.fulfilled, (state: SalesStateType, action: PayloadAction<SalesResponse>) => {
        // Append new sales to existing ones
        state.sales = [...state.sales, ...action.payload.sales];
        state.pagination = action.payload.pagination;
        state.salesStats = action.payload.stats;
      });
  },
});

export const {
  clearError,
  clearDetailsError,
  clearCurrentSale,
  resetSalesState,
  updateSaleStatus,
  optimisticUpdateSale,
} = salesSlice.actions;

export default salesSlice.reducer;
