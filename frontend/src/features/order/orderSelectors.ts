import type { RootState } from '../../store';
import type { OrderStateType, Order, OrderState } from './types/order';

// Basic selectors
export const selectOrderState = (state: RootState): OrderStateType => state.order;

export const selectOrders = (state: RootState): Order[] => state.order.orders;

export const selectCurrentOrder = (state: RootState): Order | null => state.order.currentOrder;

export const selectMyOrders = (state: RootState): Order[] => state.order.myOrders;

export const selectOrderStatus = (state: RootState): OrderStateType['status'] => state.order.status;

export const selectOrderError = (state: RootState): string | null => state.order.error ?? null;

export const selectCreateStatus = (state: RootState): OrderStateType['createStatus'] => state.order.createStatus;

export const selectCreateError = (state: RootState): string | null => state.order.createError ?? null;

export const selectUpdateStatus = (state: RootState): OrderStateType['updateStatus'] => state.order.updateStatus;

export const selectUpdateError = (state: RootState): string | null => state.order.updateError ?? null;

export const selectPagination = (state: RootState) => state.order.pagination;

export const selectFilters = (state: RootState) => state.order.filters;

// Derived selectors
export const selectIsOrderLoading = (state: RootState): boolean => state.order.status === 'loading';

export const selectIsOrderError = (state: RootState): boolean => state.order.status === 'error';

export const selectIsOrderSuccess = (state: RootState): boolean => state.order.status === 'success';

export const selectIsOrderIdle = (state: RootState): boolean => state.order.status === 'idle';

export const selectIsCreating = (state: RootState): boolean => state.order.createStatus === 'loading';

export const selectIsCreateError = (state: RootState): boolean => state.order.createStatus === 'error';

export const selectIsCreateSuccess = (state: RootState): boolean => state.order.createStatus === 'success';

export const selectIsUpdating = (state: RootState): boolean => state.order.updateStatus === 'loading';

export const selectIsUpdateError = (state: RootState): boolean => state.order.updateStatus === 'error';

export const selectIsUpdateSuccess = (state: RootState): boolean => state.order.updateStatus === 'success';

export const selectHasMoreOrders = (state: RootState): boolean => state.order.pagination.hasMore;

export const selectTotalOrders = (state: RootState): number => state.order.pagination.total;

// Order-specific selectors
export const selectOrderById = (state: RootState, orderId: string): Order | null => {
  return state.order.orders.find(order => order.id === orderId) || null;
};

export const selectMyOrderById = (state: RootState, orderId: string): Order | null => {
  return state.order.myOrders.find(order => order.id === orderId) || null;
};

// Status-based selectors
export const selectOrdersByStatus = (state: RootState, status: OrderState): Order[] => {
  return state.order.orders.filter(order => order.status === status);
};

export const selectMyOrdersByStatus = (state: RootState, status: OrderState): Order[] => {
  return state.order.myOrders.filter(order => order.status === status);
};

export const selectPendingOrders = (state: RootState): Order[] => {
  return state.order.orders.filter(order => order.status === 'pending');
};

export const selectPendingMyOrders = (state: RootState): Order[] => {
  return state.order.myOrders.filter(order => order.status === 'pending');
};

export const selectConfirmedOrders = (state: RootState): Order[] => {
  return state.order.orders.filter(order => order.status === 'confirmed');
};

export const selectShippedOrders = (state: RootState): Order[] => {
  return state.order.orders.filter(order => order.status === 'shipped');
};

export const selectDeliveredOrders = (state: RootState): Order[] => {
  return state.order.orders.filter(order => order.status === 'delivered');
};

export const selectCancelledOrders = (state: RootState): Order[] => {
  return state.order.orders.filter(order => order.status === 'cancelled');
};

export const selectRefundedOrders = (state: RootState): Order[] => {
  return state.order.orders.filter(order => order.status === 'refunded');
};

export const selectDisputedOrders = (state: RootState): Order[] => {
  return state.order.orders.filter(order => order.status === 'disputed');
};

// Payment status selectors
export const selectOrdersByPaymentStatus = (state: RootState, paymentStatus: string): Order[] => {
  return state.order.orders.filter(order => order.payment_status === paymentStatus);
};

export const selectPaidOrders = (state: RootState): Order[] => {
  return state.order.orders.filter(order => order.payment_status === 'paid');
};

export const selectPendingPaymentOrders = (state: RootState): Order[] => {
  return state.order.orders.filter(order => order.payment_status === 'pending');
};

export const selectRefundedPaymentOrders = (state: RootState): Order[] => {
  return state.order.orders.filter(order => order.payment_status === 'refunded');
};

// Listing-based selectors
export const selectOrdersByListing = (state: RootState, listingId: string): Order[] => {
  return state.order.orders.filter(order => order.listing_id === listingId);
};

export const selectMyOrdersByListing = (state: RootState, listingId: string): Order[] => {
  return state.order.myOrders.filter(order => order.listing_id === listingId);
};

// User-based selectors
export const selectOrdersByBuyer = (state: RootState, buyerId: string): Order[] => {
  return state.order.orders.filter(order => order.buyer_id === buyerId);
};

export const selectOrdersBySeller = (state: RootState, sellerId: string): Order[] => {
  return state.order.orders.filter(order => order.seller_id === sellerId);
};

export const selectMyOrdersAsBuyer = (state: RootState, userId: string): Order[] => {
  return state.order.myOrders.filter(order => order.buyer_id === userId);
};

export const selectMyOrdersAsSeller = (state: RootState, userId: string): Order[] => {
  return state.order.myOrders.filter(order => order.seller_id === userId);
};

// Amount-based selectors
export const selectOrdersByAmountRange = (state: RootState, minAmount: number, maxAmount: number): Order[] => {
  return state.order.orders.filter(order => 
    order.final_price >= minAmount && order.final_price <= maxAmount
  );
};

export const selectHighestOrder = (state: RootState): Order | null => {
  if (state.order.orders.length === 0) return null;
  return state.order.orders.reduce((highest, order) => 
    order.final_price > highest.final_price ? order : highest
  );
};

export const selectLowestOrder = (state: RootState): Order | null => {
  if (state.order.orders.length === 0) return null;
  return state.order.orders.reduce((lowest, order) => 
    order.final_price < lowest.final_price ? order : lowest
  );
};

// Time-based selectors
export const selectRecentOrders = (state: RootState, hours: number = 24): Order[] => {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  return state.order.orders.filter(order => 
    new Date(order.created_at) >= cutoffTime
  );
};

export const selectOrdersNeedingAction = (state: RootState): Order[] => {
  return state.order.orders.filter(order => 
    order.status === 'pending' || 
    (order.status === 'confirmed' && !order.tracking_info) ||
    (order.status === 'shipped' && order.tracking_info)
  );
};

// Complex selectors
export const selectOrderInfo = (state: RootState) => ({
  orders: selectOrders(state),
  currentOrder: selectCurrentOrder(state),
  myOrders: selectMyOrders(state),
  status: selectOrderStatus(state),
  createStatus: selectCreateStatus(state),
  updateStatus: selectUpdateStatus(state),
  error: selectOrderError(state),
  createError: selectCreateError(state),
  updateError: selectUpdateError(state),
  pagination: selectPagination(state),
  filters: selectFilters(state),
});

export const selectOrderStats = (state: RootState) => {
  const orders = selectOrders(state);
  const myOrders = selectMyOrders(state);
  
  return {
    total: orders.length,
    totalMy: myOrders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    pendingMy: myOrders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    confirmedMy: myOrders.filter(o => o.status === 'confirmed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    shippedMy: myOrders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    deliveredMy: myOrders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    cancelledMy: myOrders.filter(o => o.status === 'cancelled').length,
    refunded: orders.filter(o => o.status === 'refunded').length,
    refundedMy: myOrders.filter(o => o.status === 'refunded').length,
    disputed: orders.filter(o => o.status === 'disputed').length,
    disputedMy: myOrders.filter(o => o.status === 'disputed').length,
    totalRevenue: orders.reduce((sum, order) => sum + order.final_price, 0),
    totalMyRevenue: myOrders.reduce((sum, order) => sum + order.final_price, 0),
    averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.final_price, 0) / orders.length : 0,
    averageMyOrderValue: myOrders.length > 0 ? myOrders.reduce((sum, order) => sum + order.final_price, 0) / myOrders.length : 0,
    totalItems: orders.reduce((sum, order) => sum + order.quantity, 0),
    totalMyItems: myOrders.reduce((sum, order) => sum + order.quantity, 0),
  };
};

export const selectOrderTrackingInfo = (state: RootState, orderId: string) => {
  const order = selectOrderById(state, orderId);
  return order?.tracking_info || null;
};

export const selectOrdersWithTracking = (state: RootState): Order[] => {
  return state.order.orders.filter(order => order.tracking_info);
};

export const selectOrdersWithoutTracking = (state: RootState): Order[] => {
  return state.order.orders.filter(order => order.status === 'confirmed' && !order.tracking_info);
};

export const selectOrdersByShippingAddress = (state: RootState, address: string): Order[] => {
  return state.order.orders.filter(order => 
    order.shipping_address && 
    (order.shipping_address.street.includes(address) || 
     order.shipping_address.city.includes(address) ||
     order.shipping_address.state.includes(address))
  );
};
