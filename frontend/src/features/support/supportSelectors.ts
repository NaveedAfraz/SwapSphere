import type { RootState } from '../../store';
import type { SupportStateType, SupportTicket, SupportMessage, Dispute, TicketStatus, TicketCategory, TicketPriority } from './types/support';

// Basic selectors
export const selectSupportState = (state: RootState): SupportStateType => state.support;

export const selectTickets = (state: RootState): SupportTicket[] => 
  selectSupportState(state).tickets;

export const selectCurrentTicket = (state: RootState): SupportTicket | null => 
  selectSupportState(state).currentTicket;

export const selectMessages = (state: RootState): SupportMessage[] => 
  selectSupportState(state).messages;

export const selectDisputes = (state: RootState): Dispute[] => 
  selectSupportState(state).disputes;

export const selectCurrentDispute = (state: RootState): Dispute | null => 
  selectSupportState(state).currentDispute;

export const selectSupportStatus = (state: RootState): string => 
  selectSupportState(state).status;

export const selectSupportError = (state: RootState): string | null => 
  selectSupportState(state).error;

export const selectCreateStatus = (state: RootState): string => 
  selectSupportState(state).createStatus;

export const selectCreateError = (state: RootState): string | null => 
  selectSupportState(state).createError;

export const selectUpdateStatus = (state: RootState): string => 
  selectSupportState(state).updateStatus;

export const selectUpdateError = (state: RootState): string | null => 
  selectSupportState(state).updateError;

export const selectMessageStatus = (state: RootState): string => 
  selectSupportState(state).messageStatus;

export const selectMessageError = (state: RootState): string | null => 
  selectSupportState(state).messageError;

export const selectSupportPagination = (state: RootState) => 
  selectSupportState(state).pagination;

export const selectSupportFilters = (state: RootState) => 
  selectSupportState(state).filters;

export const selectSupportStats = (state: RootState) => 
  selectSupportState(state).stats;

// Derived selectors
export const selectIsSupportLoading = (state: RootState): boolean => 
  selectSupportStatus(state) === 'loading';

export const selectIsSupportError = (state: RootState): boolean => 
  selectSupportStatus(state) === 'error';

export const selectIsSupportSuccess = (state: RootState): boolean => 
  selectSupportStatus(state) === 'success';

export const selectIsCreateLoading = (state: RootState): boolean => 
  selectCreateStatus(state) === 'loading';

export const selectIsCreateError = (state: RootState): boolean => 
  selectCreateStatus(state) === 'error';

export const selectIsCreateSuccess = (state: RootState): boolean => 
  selectCreateStatus(state) === 'success';

export const selectIsUpdateLoading = (state: RootState): boolean => 
  selectUpdateStatus(state) === 'loading';

export const selectIsUpdateError = (state: RootState): boolean => 
  selectUpdateStatus(state) === 'error';

export const selectIsUpdateSuccess = (state: RootState): boolean => 
  selectUpdateStatus(state) === 'success';

export const selectIsMessageLoading = (state: RootState): boolean => 
  selectMessageStatus(state) === 'loading';

export const selectIsMessageError = (state: RootState): boolean => 
  selectMessageStatus(state) === 'error';

export const selectIsMessageSuccess = (state: RootState): boolean => 
  selectMessageStatus(state) === 'success';

export const selectHasMoreTickets = (state: RootState): boolean => 
  selectSupportPagination(state).hasMore;

export const selectTotalTickets = (state: RootState): number => 
  selectSupportPagination(state).total;

// Ticket-specific selectors
export const selectTicketById = (state: RootState, ticketId: string): SupportTicket | undefined => 
  selectTickets(state).find(ticket => ticket.id === ticketId);

export const selectTicketsByStatus = (state: RootState, status: TicketStatus): SupportTicket[] => 
  selectTickets(state).filter(ticket => ticket.status === status);

export const selectTicketsByCategory = (state: RootState, category: TicketCategory): SupportTicket[] => 
  selectTickets(state).filter(ticket => ticket.category === category);

export const selectTicketsByPriority = (state: RootState, priority: TicketPriority): SupportTicket[] => 
  selectTickets(state).filter(ticket => ticket.priority === priority);

export const selectOpenTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByStatus(state, 'open');

export const selectInProgressTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByStatus(state, 'in_progress');

export const selectPendingTickets = (state: RootState): SupportTicket[] => 
  selectTickets(state).filter(ticket => 
    ticket.status === 'pending_customer' || ticket.status === 'pending_support'
  );

export const selectResolvedTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByStatus(state, 'resolved');

export const selectClosedTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByStatus(state, 'closed');

export const selectUrgentTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByPriority(state, 'urgent');

export const selectHighPriorityTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByPriority(state, 'high');

export const selectMediumPriorityTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByPriority(state, 'medium');

export const selectLowPriorityTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByPriority(state, 'low');

// Category-based selectors
export const selectAccountTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByCategory(state, 'account');

export const selectPaymentTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByCategory(state, 'payment');

export const selectListingTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByCategory(state, 'listing');

export const selectOrderTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByCategory(state, 'order');

export const selectDisputeTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByCategory(state, 'dispute');

export const selectTechnicalTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByCategory(state, 'technical');

export const selectFeatureRequestTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByCategory(state, 'feature_request');

export const selectBugReportTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByCategory(state, 'bug_report');

export const selectSafetyTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByCategory(state, 'safety');

export const selectOtherTickets = (state: RootState): SupportTicket[] => 
  selectTicketsByCategory(state, 'other');

// Message selectors
export const selectMessagesByTicket = (state: RootState, ticketId: string): SupportMessage[] => 
  selectMessages(state).filter(message => message.ticket_id === ticketId);

export const selectUserMessages = (state: RootState): SupportMessage[] => 
  selectMessages(state).filter(message => message.sender_type === 'user');

export const selectSupportMessages = (state: RootState): SupportMessage[] => 
  selectMessages(state).filter(message => message.sender_type === 'support');

export const selectSystemMessages = (state: RootState): SupportMessage[] => 
  selectMessages(state).filter(message => message.sender_type === 'system');

export const selectInternalMessages = (state: RootState): SupportMessage[] => 
  selectMessages(state).filter(message => message.is_internal);

export const selectPublicMessages = (state: RootState): SupportMessage[] => 
  selectMessages(state).filter(message => !message.is_internal);

// Dispute selectors
export const selectDisputeById = (state: RootState, disputeId: string): Dispute | undefined => 
  selectDisputes(state).find(dispute => dispute.id === disputeId);

export const selectDisputesByStatus = (state: RootState, status: TicketStatus): Dispute[] => 
  selectDisputes(state).filter(dispute => dispute.status === status);

export const selectOpenDisputes = (state: RootState): Dispute[] => 
  selectDisputesByStatus(state, 'open');

export const selectInProgressDisputes = (state: RootState): Dispute[] => 
  selectDisputesByStatus(state, 'in_progress');

export const selectResolvedDisputes = (state: RootState): Dispute[] => 
  selectDisputesByStatus(state, 'resolved');

export const selectClosedDisputes = (state: RootState): Dispute[] => 
  selectDisputesByStatus(state, 'closed');

export const selectDisputesByOrder = (state: RootState, orderId: string): Dispute[] => 
  selectDisputes(state).filter(dispute => dispute.order_id === orderId);

// Stats selectors
export const selectTotalTicketCount = (state: RootState): number => 
  selectSupportStats(state).total_tickets;

export const selectOpenTicketCount = (state: RootState): number => 
  selectSupportStats(state).open_tickets;

export const selectResolvedTicketCount = (state: RootState): number => 
  selectSupportStats(state).resolved_tickets;

export const selectPendingTicketCount = (state: RootState): number => 
  selectSupportStats(state).pending_tickets;

export const selectUrgentTicketCount = (state: RootState): number => 
  selectSupportStats(state).urgent_tickets;

export const selectAverageResolutionTime = (state: RootState): number => 
  selectSupportStats(state).average_resolution_time;

export const selectSatisfactionScore = (state: RootState): number => 
  selectSupportStats(state).satisfaction_score;

export const selectCategoryDistribution = (state: RootState) => 
  selectSupportStats(state).category_distribution;

export const selectStatusDistribution = (state: RootState) => 
  selectSupportStats(state).status_distribution;

// Time-based selectors
export const selectRecentTickets = (state: RootState, hours: number = 24): SupportTicket[] => {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hours);
  return selectTickets(state).filter(ticket => 
    new Date(ticket.created_at) >= cutoffDate
  );
};

export const selectRecentDisputes = (state: RootState, hours: number = 24): Dispute[] => {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hours);
  return selectDisputes(state).filter(dispute => 
    new Date(dispute.created_at) >= cutoffDate
  );
};

export const selectStaleTickets = (state: RootState, days: number = 7): SupportTicket[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return selectTickets(state).filter(ticket => 
    new Date(ticket.last_activity_at) < cutoffDate && 
    (ticket.status === 'open' || ticket.status === 'in_progress')
  );
};

// Complex selectors
export const selectTicketsNeedingAction = (state: RootState): SupportTicket[] => 
  selectTickets(state).filter(ticket => 
    (ticket.status === 'pending_customer' || ticket.status === 'pending_support') ||
    (ticket.priority === 'urgent' && ticket.status !== 'resolved' && ticket.status !== 'closed')
  );

export const selectTicketsNeedingResponse = (state: RootState): SupportTicket[] => 
  selectTickets(state).filter(ticket => 
    ticket.status === 'pending_support' && ticket.priority !== 'low'
  );

export const selectCriticalTickets = (state: RootState): SupportTicket[] => 
  selectTickets(state).filter(ticket => 
    ticket.priority === 'urgent' && 
    (ticket.category === 'safety' || ticket.category === 'payment')
  );

export const selectSupportSummary = (state: RootState) => {
  const open = selectOpenTickets(state);
  const pending = selectPendingTickets(state);
  const urgent = selectUrgentTickets(state);
  const needingAction = selectTicketsNeedingAction(state);
  
  return {
    totalOpen: open.length,
    totalPending: pending.length,
    totalUrgent: urgent.length,
    totalNeedingAction: needingAction.length,
    hasCritical: selectCriticalTickets(state).length > 0,
    oldestTicket: selectTickets(state).length > 0 ? selectTickets(state)[selectTickets(state).length - 1].created_at : null,
    newestTicket: selectTickets(state).length > 0 ? selectTickets(state)[0].created_at : null,
  };
};

export const selectTicketResolutionRate = (state: RootState): number => {
  const total = selectTotalTicketCount(state);
  const resolved = selectResolvedTicketCount(state);
  return total > 0 ? (resolved / total) * 100 : 0;
};

export const selectTicketEscalationRate = (state: RootState): number => {
  const tickets = selectTickets(state);
  const escalated = tickets.filter(ticket => ticket.escalation_level > 1);
  return tickets.length > 0 ? (escalated.length / tickets.length) * 100 : 0;
};

export const selectDisputeResolutionRate = (state: RootState): number => {
  const disputes = selectDisputes(state);
  const resolved = selectResolvedDisputes(state);
  return disputes.length > 0 ? (resolved.length / disputes.length) * 100 : 0;
};

export const selectSupportWorkload = (state: RootState): 'low' | 'medium' | 'high' | 'critical' => {
  const openCount = selectOpenTicketCount(state);
  const urgentCount = selectUrgentTicketCount(state);
  const pendingCount = selectPendingTicketCount(state);
  
  if (urgentCount > 0 || (openCount > 20 && pendingCount > 10)) return 'critical';
  if (openCount > 15 || pendingCount > 5) return 'high';
  if (openCount > 5 || pendingCount > 2) return 'medium';
  return 'low';
};

export const selectTicketTrends = (state: RootState) => {
  const tickets = selectTickets(state);
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const weeklyTickets = tickets.filter(ticket => new Date(ticket.created_at) >= lastWeek);
  const monthlyTickets = tickets.filter(ticket => new Date(ticket.created_at) >= lastMonth);
  
  return {
    weeklyNew: weeklyTickets.length,
    monthlyNew: monthlyTickets.length,
    weeklyResolved: weeklyTickets.filter(ticket => ticket.status === 'resolved').length,
    monthlyResolved: monthlyTickets.filter(ticket => ticket.status === 'resolved').length,
    weeklyResolutionRate: weeklyTickets.length > 0 ? 
      (weeklyTickets.filter(ticket => ticket.status === 'resolved').length / weeklyTickets.length) * 100 : 0,
  };
};
