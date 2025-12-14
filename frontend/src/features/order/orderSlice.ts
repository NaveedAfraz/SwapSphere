import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { OrderStateType, Order, OrderState } from './types/order';

const initialState: OrderStateType = {
  orders: [],
  currentOrder: null,
  myOrders: [],
  status: 'idle',
  error: null,
  createStatus: 'idle',
  createError: null,
  updateStatus: 'idle',
  updateError: null,
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

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state: OrderStateType) => {
      state.error = null;
    },
    clearCreateError: (state: OrderStateType) => {
      state.createError = null;
    },
    clearUpdateError: (state: OrderStateType) => {
      state.updateError = null;
    },
    resetCreateStatus: (state: OrderStateType) => {
      state.createStatus = 'idle';
      state.createError = null;
    },
    resetUpdateStatus: (state: OrderStateType) => {
      state.updateStatus = 'idle';
      state.updateError = null;
    },
    setCurrentOrder: (state: OrderStateType, action: PayloadAction<Order | null>) => {
      state.currentOrder = action.payload;
    },
    updateFilters: (state: OrderStateType, action: PayloadAction<any>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state: OrderStateType) => {
      state.filters = {
        sortBy: 'created_at',
        sortOrder: 'desc',
      };
    },
    clearOrders: (state: OrderStateType) => {
      state.orders = [];
      state.myOrders = [];
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
      };
    },
    updateOrderLocal: (state: OrderStateType, action: PayloadAction<{ id: string; updates: Partial<Order> }>) => {
      const { id, updates } = action.payload;
      
      // Update in main orders array
      const index = state.orders.findIndex(order => order.id === id);
      if (index !== -1) {
        state.orders[index] = { ...state.orders[index], ...updates };
      }
      
      // Update in my orders
      const myIndex = state.myOrders.findIndex(order => order.id === id);
      if (myIndex !== -1) {
        state.myOrders[myIndex] = { ...state.myOrders[myIndex], ...updates };
      }
      
      // Update current order
      if (state.currentOrder?.id === id) {
        state.currentOrder = { ...state.currentOrder, ...updates };
      }
    },
    removeOrderLocal: (state: OrderStateType, action: PayloadAction<string>) => {
      const orderId = action.payload;
      state.orders = state.orders.filter(order => order.id !== orderId);
      state.myOrders = state.myOrders.filter(order => order.id !== orderId);
      if (state.currentOrder?.id === orderId) {
        state.currentOrder = null;
      }
    },
    addOrder: (state: OrderStateType, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload);
      state.myOrders.unshift(action.payload);
    },
  },
  extraReducers: (builder: any) => {
    // Handle fetch orders thunk
    builder
      .addCase('order/fetchOrders/pending', (state: OrderStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('order/fetchOrders/fulfilled', (state: OrderStateType, action: PayloadAction<{ orders: Order[]; pagination: any }>) => {
        state.status = 'success';
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('order/fetchOrders/rejected', (state: OrderStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch orders';
      });

    // Handle fetch order by ID thunk
    builder
      .addCase('order/fetchOrderById/pending', (state: OrderStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('order/fetchOrderById/fulfilled', (state: OrderStateType, action: PayloadAction<{ order: Order }>) => {
        state.status = 'success';
        state.currentOrder = action.payload.order;
        state.error = null;
      })
      .addCase('order/fetchOrderById/rejected', (state: OrderStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch order';
      });

    // Handle create order thunk
    builder
      .addCase('order/createOrder/pending', (state: OrderStateType) => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase('order/createOrder/fulfilled', (state: OrderStateType, action: PayloadAction<{ order: Order }>) => {
        state.createStatus = 'success';
        state.orders.unshift(action.payload.order);
        state.myOrders.unshift(action.payload.order);
        state.createError = null;
      })
      .addCase('order/createOrder/rejected', (state: OrderStateType, action: any) => {
        state.createStatus = 'error';
        state.createError = action.payload as string || 'Failed to create order';
      });

    // Handle update order thunk
    builder
      .addCase('order/updateOrder/pending', (state: OrderStateType) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase('order/updateOrder/fulfilled', (state: OrderStateType, action: PayloadAction<{ order: Order }>) => {
        state.updateStatus = 'success';
        const updatedOrder = action.payload.order;
        
        // Update in all arrays
        const updateInArray = (array: Order[]) => {
          const index = array.findIndex(order => order.id === updatedOrder.id);
          if (index !== -1) {
            array[index] = updatedOrder;
          }
        };
        
        updateInArray(state.orders);
        updateInArray(state.myOrders);
        
        if (state.currentOrder?.id === updatedOrder.id) {
          state.currentOrder = updatedOrder;
        }
        
        state.updateError = null;
      })
      .addCase('order/updateOrder/rejected', (state: OrderStateType, action: any) => {
        state.updateStatus = 'error';
        state.updateError = action.payload || 'Failed to update order';
      });

    // Handle confirm order thunk
    builder
      .addCase('order/confirmOrder/fulfilled', (state: OrderStateType, action: PayloadAction<{ order: Order }>) => {
        const updatedOrder = action.payload.order;
        const updateInArray = (array: Order[]) => {
          const index = array.findIndex(order => order.id === updatedOrder.id);
          if (index !== -1) {
            array[index] = updatedOrder;
          }
        };
        
        updateInArray(state.orders);
        updateInArray(state.myOrders);
        
        if (state.currentOrder?.id === updatedOrder.id) {
          state.currentOrder = updatedOrder;
        }
      });

    // Handle ship order thunk
    builder
      .addCase('order/shipOrder/fulfilled', (state: OrderStateType, action: PayloadAction<{ order: Order }>) => {
        const updatedOrder = action.payload.order;
        const updateInArray = (array: Order[]) => {
          const index = array.findIndex(order => order.id === updatedOrder.id);
          if (index !== -1) {
            array[index] = updatedOrder;
          }
        };
        
        updateInArray(state.orders);
        updateInArray(state.myOrders);
        
        if (state.currentOrder?.id === updatedOrder.id) {
          state.currentOrder = updatedOrder;
        }
      });

    // Handle mark as delivered thunk
    builder
      .addCase('order/markAsDelivered/fulfilled', (state: OrderStateType, action: PayloadAction<{ order: Order }>) => {
        const updatedOrder = action.payload.order;
        const updateInArray = (array: Order[]) => {
          const index = array.findIndex(order => order.id === updatedOrder.id);
          if (index !== -1) {
            array[index] = updatedOrder;
          }
        };
        
        updateInArray(state.orders);
        updateInArray(state.myOrders);
        
        if (state.currentOrder?.id === updatedOrder.id) {
          state.currentOrder = updatedOrder;
        }
      });

    // Handle cancel order thunk
    builder
      .addCase('order/cancelOrder/fulfilled', (state: OrderStateType, action: PayloadAction<{ order: Order }>) => {
        const updatedOrder = action.payload.order;
        const updateInArray = (array: Order[]) => {
          const index = array.findIndex(order => order.id === updatedOrder.id);
          if (index !== -1) {
            array[index] = updatedOrder;
          }
        };
        
        updateInArray(state.orders);
        updateInArray(state.myOrders);
        
        if (state.currentOrder?.id === updatedOrder.id) {
          state.currentOrder = updatedOrder;
        }
      });

    // Handle refund order thunk
    builder
      .addCase('order/refundOrder/fulfilled', (state: OrderStateType, action: PayloadAction<{ order: Order }>) => {
        const updatedOrder = action.payload.order;
        const updateInArray = (array: Order[]) => {
          const index = array.findIndex(order => order.id === updatedOrder.id);
          if (index !== -1) {
            array[index] = updatedOrder;
          }
        };
        
        updateInArray(state.orders);
        updateInArray(state.myOrders);
        
        if (state.currentOrder?.id === updatedOrder.id) {
          state.currentOrder = updatedOrder;
        }
      });

    // Handle fetch my orders thunk
    builder
      .addCase('order/fetchMyOrders/pending', (state: OrderStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('order/fetchMyOrders/fulfilled', (state: OrderStateType, action: PayloadAction<{ orders: Order[]; pagination: any }>) => {
        state.status = 'success';
        state.myOrders = action.payload.orders;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('order/fetchMyOrders/rejected', (state: OrderStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch my orders';
      });

    // Handle fetch orders by listing thunk
    builder
      .addCase('order/fetchOrdersByListing/pending', (state: OrderStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('order/fetchOrdersByListing/fulfilled', (state: OrderStateType, action: PayloadAction<{ orders: Order[]; pagination: any }>) => {
        state.status = 'success';
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('order/fetchOrdersByListing/rejected', (state: OrderStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch orders for listing';
      });

    // Handle update tracking thunk
    builder
      .addCase('order/updateTracking/fulfilled', (state: OrderStateType, action: PayloadAction<{ order: Order }>) => {
        const updatedOrder = action.payload.order;
        const updateInArray = (array: Order[]) => {
          const index = array.findIndex(order => order.id === updatedOrder.id);
          if (index !== -1) {
            array[index] = updatedOrder;
          }
        };
        
        updateInArray(state.orders);
        updateInArray(state.myOrders);
        
        if (state.currentOrder?.id === updatedOrder.id) {
          state.currentOrder = updatedOrder;
        }
      });
  },
});

export const {
  clearError,
  clearCreateError,
  clearUpdateError,
  resetCreateStatus,
  resetUpdateStatus,
  setCurrentOrder,
  updateFilters,
  resetFilters,
  clearOrders,
  updateOrderLocal,
  removeOrderLocal,
  addOrder,
} = orderSlice.actions;

export default orderSlice.reducer;
