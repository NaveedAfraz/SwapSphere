import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SupportStateType, SupportTicket, SupportMessage, Dispute, TicketStatus, TicketCategory, TicketPriority } from './types/support';

const initialState: SupportStateType = {
  tickets: [],
  currentTicket: null,
  messages: [],
  disputes: [],
  currentDispute: null,
  status: 'idle',
  error: null,
  createStatus: 'idle',
  createError: null,
  updateStatus: 'idle',
  updateError: null,
  messageStatus: 'idle',
  messageError: null,
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
  stats: {
    total_tickets: 0,
    open_tickets: 0,
    resolved_tickets: 0,
    pending_tickets: 0,
    urgent_tickets: 0,
    average_resolution_time: 0,
    satisfaction_score: 0,
    category_distribution: {
      account: 0,
      payment: 0,
      listing: 0,
      order: 0,
      dispute: 0,
      technical: 0,
      feature_request: 0,
      bug_report: 0,
      safety: 0,
      other: 0,
    },
    status_distribution: {
      open: 0,
      in_progress: 0,
      pending_customer: 0,
      pending_support: 0,
      resolved: 0,
      closed: 0,
    },
  },
};

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state: SupportStateType) => {
      state.error = null;
    },
    clearCreateError: (state: SupportStateType) => {
      state.createError = null;
    },
    clearUpdateError: (state: SupportStateType) => {
      state.updateError = null;
    },
    clearMessageError: (state: SupportStateType) => {
      state.messageError = null;
    },
    resetCreateStatus: (state: SupportStateType) => {
      state.createStatus = 'idle';
      state.createError = null;
    },
    resetUpdateStatus: (state: SupportStateType) => {
      state.updateStatus = 'idle';
      state.updateError = null;
    },
    resetMessageStatus: (state: SupportStateType) => {
      state.messageStatus = 'idle';
      state.messageError = null;
    },
    setCurrentTicket: (state: SupportStateType, action: PayloadAction<SupportTicket | null>) => {
      state.currentTicket = action.payload;
    },
    setCurrentDispute: (state: SupportStateType, action: PayloadAction<Dispute | null>) => {
      state.currentDispute = action.payload;
    },
    updateFilters: (state: SupportStateType, action: PayloadAction<any>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state: SupportStateType) => {
      state.filters = {
        sortBy: 'created_at',
        sortOrder: 'desc',
      };
    },
    clearTickets: (state: SupportStateType) => {
      state.tickets = [];
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
      };
    },
    clearMessages: (state: SupportStateType) => {
      state.messages = [];
    },
    clearDisputes: (state: SupportStateType) => {
      state.disputes = [];
    },
    updateTicketLocal: (state: SupportStateType, action: PayloadAction<{ id: string; updates: Partial<SupportTicket> }>) => {
      const { id, updates } = action.payload;
      const index = state.tickets.findIndex(ticket => ticket.id === id);
      if (index !== -1) {
        state.tickets[index] = { ...state.tickets[index], ...updates };
      }
      if (state.currentTicket?.id === id) {
        state.currentTicket = { ...state.currentTicket, ...updates };
      }
    },
    updateDisputeLocal: (state: SupportStateType, action: PayloadAction<{ id: string; updates: Partial<Dispute> }>) => {
      const { id, updates } = action.payload;
      const index = state.disputes.findIndex(dispute => dispute.id === id);
      if (index !== -1) {
        state.disputes[index] = { ...state.disputes[index], ...updates };
      }
      if (state.currentDispute?.id === id) {
        state.currentDispute = { ...state.currentDispute, ...updates };
      }
    },
    addMessage: (state: SupportStateType, action: PayloadAction<SupportMessage>) => {
      state.messages.push(action.payload);
    },
    addTicket: (state: SupportStateType, action: PayloadAction<SupportTicket>) => {
      state.tickets.unshift(action.payload);
    },
    addDispute: (state: SupportStateType, action: PayloadAction<Dispute>) => {
      state.disputes.unshift(action.payload);
    },
    removeTicket: (state: SupportStateType, action: PayloadAction<string>) => {
      const ticketId = action.payload;
      state.tickets = state.tickets.filter(ticket => ticket.id !== ticketId);
      if (state.currentTicket?.id === ticketId) {
        state.currentTicket = null;
      }
    },
    removeDispute: (state: SupportStateType, action: PayloadAction<string>) => {
      const disputeId = action.payload;
      state.disputes = state.disputes.filter(dispute => dispute.id !== disputeId);
      if (state.currentDispute?.id === disputeId) {
        state.currentDispute = null;
      }
    },
    updateStats: (state: SupportStateType, action: PayloadAction<Partial<SupportStateType['stats']>>) => {
      state.stats = { ...state.stats, ...action.payload };
    },
  },
  extraReducers: (builder: any) => {
    // Handle fetch tickets thunk
    builder
      .addCase('support/fetchTickets/pending', (state: SupportStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('support/fetchTickets/fulfilled', (state: SupportStateType, action: PayloadAction<{ tickets: SupportTicket[]; pagination: any }>) => {
        state.status = 'success';
        state.tickets = action.payload.tickets;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('support/fetchTickets/rejected', (state: SupportStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch tickets';
      });

    // Handle fetch ticket by ID thunk
    builder
      .addCase('support/fetchTicketById/pending', (state: SupportStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('support/fetchTicketById/fulfilled', (state: SupportStateType, action: PayloadAction<{ ticket: SupportTicket }>) => {
        state.status = 'success';
        state.currentTicket = action.payload.ticket;
        state.error = null;
      })
      .addCase('support/fetchTicketById/rejected', (state: SupportStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch ticket';
      });

    // Handle create ticket thunk
    builder
      .addCase('support/createTicket/pending', (state: SupportStateType) => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase('support/createTicket/fulfilled', (state: SupportStateType, action: PayloadAction<{ ticket: SupportTicket }>) => {
        state.createStatus = 'success';
        state.tickets.unshift(action.payload.ticket);
        state.currentTicket = action.payload.ticket;
        state.createError = null;
      })
      .addCase('support/createTicket/rejected', (state: SupportStateType, action: any) => {
        state.createStatus = 'error';
        state.createError = action.payload as string || 'Failed to create ticket';
      });

    // Handle update ticket thunk
    builder
      .addCase('support/updateTicket/pending', (state: SupportStateType) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase('support/updateTicket/fulfilled', (state: SupportStateType, action: PayloadAction<{ ticket: SupportTicket }>) => {
        state.updateStatus = 'success';
        const updatedTicket = action.payload.ticket;
        
        // Update in tickets array
        const index = state.tickets.findIndex(ticket => ticket.id === updatedTicket.id);
        if (index !== -1) {
          state.tickets[index] = updatedTicket;
        }
        
        // Update current ticket
        if (state.currentTicket?.id === updatedTicket.id) {
          state.currentTicket = updatedTicket;
        }
        
        state.updateError = null;
      })
      .addCase('support/updateTicket/rejected', (state: SupportStateType, action: any) => {
        state.updateStatus = 'error';
        state.updateError = action.payload as string || 'Failed to update ticket';
      });

    // Handle delete ticket thunk
    builder
      .addCase('support/deleteTicket/fulfilled', (state: SupportStateType, action: PayloadAction<string>) => {
        const ticketId = action.payload;
        state.tickets = state.tickets.filter(ticket => ticket.id !== ticketId);
        if (state.currentTicket?.id === ticketId) {
          state.currentTicket = null;
        }
      });

    // Handle fetch ticket messages thunk
    builder
      .addCase('support/fetchTicketMessages/fulfilled', (state: SupportStateType, action: PayloadAction<{ messages: SupportMessage[] }>) => {
        state.messages = action.payload.messages;
      });

    // Handle create message thunk
    builder
      .addCase('support/createMessage/pending', (state: SupportStateType) => {
        state.messageStatus = 'loading';
        state.messageError = null;
      })
      .addCase('support/createMessage/fulfilled', (state: SupportStateType) => {
        state.messageStatus = 'success';
        state.messageError = null;
      })
      .addCase('support/createMessage/rejected', (state: SupportStateType, action: any) => {
        state.messageStatus = 'error';
        state.messageError = action.payload as string || 'Failed to send message';
      });

    // Handle fetch disputes thunk
    builder
      .addCase('support/fetchDisputes/fulfilled', (state: SupportStateType, action: PayloadAction<{ disputes: Dispute[]; pagination: any }>) => {
        state.disputes = action.payload.disputes;
        state.pagination = action.payload.pagination;
      });

    // Handle fetch dispute by ID thunk
    builder
      .addCase('support/fetchDisputeById/fulfilled', (state: SupportStateType, action: PayloadAction<{ dispute: Dispute }>) => {
        state.currentDispute = action.payload.dispute;
      });

    // Handle create dispute thunk
    builder
      .addCase('support/createDispute/fulfilled', (state: SupportStateType, action: PayloadAction<{ dispute: Dispute }>) => {
        state.disputes.unshift(action.payload.dispute);
        state.currentDispute = action.payload.dispute;
      });

    // Handle update dispute thunk
    builder
      .addCase('support/updateDispute/fulfilled', (state: SupportStateType, action: PayloadAction<{ dispute: Dispute }>) => {
        const updatedDispute = action.payload.dispute;
        
        // Update in disputes array
        const index = state.disputes.findIndex(dispute => dispute.id === updatedDispute.id);
        if (index !== -1) {
          state.disputes[index] = updatedDispute;
        }
        
        // Update current dispute
        if (state.currentDispute?.id === updatedDispute.id) {
          state.currentDispute = updatedDispute;
        }
      });

    // Handle submit evidence thunk
    builder
      .addCase('support/submitEvidence/fulfilled', (state: SupportStateType, action: PayloadAction<{ dispute: Dispute }>) => {
        const updatedDispute = action.payload.dispute;
        
        // Update current dispute
        if (state.currentDispute?.id === updatedDispute.id) {
          state.currentDispute = updatedDispute;
        }
      });

    // Handle fetch support stats thunk
    builder
      .addCase('support/fetchSupportStats/fulfilled', (state: SupportStateType, action: PayloadAction<{ stats: any }>) => {
        state.stats = action.payload.stats;
      });

    // Handle fetch my tickets thunk
    builder
      .addCase('support/fetchMyTickets/fulfilled', (state: SupportStateType, action: PayloadAction<{ tickets: SupportTicket[]; pagination: any }>) => {
        state.tickets = action.payload.tickets;
        state.pagination = action.payload.pagination;
      });

    // Handle fetch my disputes thunk
    builder
      .addCase('support/fetchMyDisputes/fulfilled', (state: SupportStateType, action: PayloadAction<{ disputes: Dispute[]; pagination: any }>) => {
        state.disputes = action.payload.disputes;
        state.pagination = action.payload.pagination;
      });

    // Handle escalate ticket thunk
    builder
      .addCase('support/escalateTicket/fulfilled', (state: SupportStateType, action: PayloadAction<{ ticket: SupportTicket }>) => {
        const updatedTicket = action.payload.ticket;
        
        // Update in tickets array
        const index = state.tickets.findIndex(ticket => ticket.id === updatedTicket.id);
        if (index !== -1) {
          state.tickets[index] = updatedTicket;
        }
        
        // Update current ticket
        if (state.currentTicket?.id === updatedTicket.id) {
          state.currentTicket = updatedTicket;
        }
      });

    // Handle close ticket thunk
    builder
      .addCase('support/closeTicket/fulfilled', (state: SupportStateType, action: PayloadAction<{ ticket: SupportTicket }>) => {
        const updatedTicket = action.payload.ticket;
        
        // Update in tickets array
        const index = state.tickets.findIndex(ticket => ticket.id === updatedTicket.id);
        if (index !== -1) {
          state.tickets[index] = updatedTicket;
        }
        
        // Update current ticket
        if (state.currentTicket?.id === updatedTicket.id) {
          state.currentTicket = updatedTicket;
        }
      });

    // Handle reopen ticket thunk
    builder
      .addCase('support/reopenTicket/fulfilled', (state: SupportStateType, action: PayloadAction<{ ticket: SupportTicket }>) => {
        const updatedTicket = action.payload.ticket;
        
        // Update in tickets array
        const index = state.tickets.findIndex(ticket => ticket.id === updatedTicket.id);
        if (index !== -1) {
          state.tickets[index] = updatedTicket;
        }
        
        // Update current ticket
        if (state.currentTicket?.id === updatedTicket.id) {
          state.currentTicket = updatedTicket;
        }
      });
  },
});

export const {
  clearError,
  clearCreateError,
  clearUpdateError,
  clearMessageError,
  resetCreateStatus,
  resetUpdateStatus,
  resetMessageStatus,
  setCurrentTicket,
  setCurrentDispute,
  updateFilters,
  resetFilters,
  clearTickets,
  clearMessages,
  clearDisputes,
  updateTicketLocal,
  updateDisputeLocal,
  addMessage,
  addTicket,
  addDispute,
  removeTicket,
  removeDispute,
  updateStats,
} = supportSlice.actions;

export default supportSlice.reducer;
