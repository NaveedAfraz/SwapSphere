import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../store';
import type { SalesStateType, Sale, SalesStats } from './types/sales';

// Basic selectors
export const selectSalesState = (state: RootState): SalesStateType => (state as any).sales;

export const selectSales = (state: RootState): Sale[] => (state as any).sales.sales;

export const selectCurrentSale = (state: RootState) => (state as any).sales.currentSale;

export const selectSalesStats = (state: RootState): SalesStats | null => (state as any).sales.salesStats;

export const selectSalesPagination = (state: RootState) => (state as any).sales.pagination;

export const selectSalesStatus = (state: RootState) => (state as any).sales.status;

export const selectSalesError = (state: RootState) => (state as any).sales.error;

export const selectSaleDetailsStatus = (state: RootState) => (state as any).sales.detailsStatus;

export const selectSaleDetailsError = (state: RootState) => (state as any).sales.detailsError;

// Computed selectors
export const selectSalesLoading = createSelector(
  [selectSalesStatus],
  (status) => status === 'loading'
);

export const selectSaleDetailsLoading = createSelector(
  [selectSaleDetailsStatus],
  (status) => status === 'loading'
);

export const selectSalesHasError = createSelector(
  [selectSalesError],
  (error) => !!error
);

export const selectSaleDetailsHasError = createSelector(
  [selectSaleDetailsError],
  (error) => !!error
);

export const selectSalesCount = createSelector(
  [selectSales],
  (sales) => sales.length
);

export const selectTotalRevenue = createSelector(
  [selectSalesStats],
  (stats) => stats?.total_revenue || 0
);

export const selectTotalSales = createSelector(
  [selectSalesStats],
  (stats) => stats?.total_sales || 0
);

export const selectPendingOrders = createSelector(
  [selectSalesStats],
  (stats) => stats?.pending_orders || 0
);

export const selectCompletedOrders = createSelector(
  [selectSalesStats],
  (stats) => stats?.completed_orders || 0
);

export const selectHasMoreSales = createSelector(
  [selectSalesPagination],
  (pagination) => pagination?.has_next || false
);

export const selectCurrentPage = createSelector(
  [selectSalesPagination],
  (pagination) => pagination?.page || 1
);

export const selectTotalPages = createSelector(
  [selectSalesPagination],
  (pagination) => pagination?.total_pages || 0
);

// Filtered selectors
export const selectSalesByStatus = createSelector(
  [selectSales, (state: RootState, status: string) => status],
  (sales, status) => {
    if (!status || status === 'all') return sales;
    return sales.filter(sale => sale.order_status === status);
  }
);

export const selectPendingSales = createSelector(
  [selectSales],
  (sales) => sales.filter(sale => sale.order_status === 'pending')
);

export const selectCompletedSales = createSelector(
  [selectSales],
  (sales) => sales.filter(sale => sale.order_status === 'completed')
);

export const selectPaidSales = createSelector(
  [selectSales],
  (sales) => sales.filter(sale => sale.payment_status === 'paid' || sale.payment_status === 'escrowed')
);

// Sales by category
export const selectSalesByCategory = createSelector(
  [selectSales],
  (sales) => {
    const categoryCounts: Record<string, number> = {};
    sales.forEach(sale => {
      const category = sale.listing_category || 'other';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    return categoryCounts;
  }
);

// Recent sales (last 7 days)
export const selectRecentSales = createSelector(
  [selectSales],
  (sales) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return sales.filter(sale => 
      new Date(sale.order_created_at) >= sevenDaysAgo
    );
  }
);

// Sales with payment issues
export const selectSalesWithPaymentIssues = createSelector(
  [selectSales],
  (sales) => sales.filter(sale => 
    sale.payment_status === 'failed' || 
    sale.payment_status === 'canceled' ||
    !sale.payment_status
  )
);

// Export all selectors
export const salesSelectors = {
  // Basic
  selectSalesState,
  selectSales,
  selectCurrentSale,
  selectSalesStats,
  selectSalesPagination,
  selectSalesStatus,
  selectSalesError,
  selectSaleDetailsStatus,
  selectSaleDetailsError,
  
  // Computed
  selectSalesLoading,
  selectSaleDetailsLoading,
  selectSalesHasError,
  selectSaleDetailsHasError,
  selectSalesCount,
  selectTotalRevenue,
  selectTotalSales,
  selectPendingOrders,
  selectCompletedOrders,
  selectHasMoreSales,
  selectCurrentPage,
  selectTotalPages,
  
  // Filtered
  selectSalesByStatus,
  selectPendingSales,
  selectCompletedSales,
  selectPaidSales,
  selectSalesByCategory,
  selectRecentSales,
  selectSalesWithPaymentIssues,
};
