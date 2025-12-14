export type SupportStatus = "idle" | "loading" | "success" | "error";

export type TicketStatus = "open" | "in_progress" | "pending_customer" | "pending_support" | "resolved" | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketCategory = 
  | "account"
  | "payment"
  | "listing"
  | "order"
  | "dispute"
  | "technical"
  | "feature_request"
  | "bug_report"
  | "safety"
  | "other";

export type TicketType = "ticket" | "dispute" | "inquiry";

export interface SupportTicket {
  id: string;
  user_id: string;
  ticket_number: string;
  type: TicketType;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  attachments?: string[];
  order_id?: string;
  listing_id?: string;
  user_reported_id?: string; // For disputes
  assigned_to?: string; // Support agent ID
  escalation_level: number;
  resolution?: string;
  resolution_notes?: string;
  satisfaction_rating?: number; // 1-5
  satisfaction_comment?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  last_activity_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: "user" | "support" | "system";
  message: string;
  attachments?: string[];
  is_internal: boolean; // Internal notes between support agents
  created_at: string;
  updated_at: string;
}

export interface Dispute {
  id: string;
  order_id: string;
  reporter_id: string;
  respondent_id: string;
  reason: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  resolution?: string;
  resolution_notes?: string;
  evidence?: DisputeEvidence[];
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface DisputeEvidence {
  id: string;
  dispute_id: string;
  submitted_by: string;
  evidence_type: "photo" | "document" | "message" | "other";
  evidence_url: string;
  description?: string;
  created_at: string;
}

export interface SupportStateType {
  tickets: SupportTicket[];
  currentTicket: SupportTicket | null;
  messages: SupportMessage[];
  disputes: Dispute[];
  currentDispute: Dispute | null;
  status: SupportStatus;
  error: string | null;
  createStatus: SupportStatus;
  createError: string | null;
  updateStatus: SupportStatus;
  updateError: string | null;
  messageStatus: SupportStatus;
  messageError: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: {
    status?: TicketStatus;
    category?: TicketCategory;
    priority?: TicketPriority;
    type?: TicketType;
    search?: string;
    sortBy?: "created_at" | "updated_at" | "priority";
    sortOrder?: "asc" | "desc";
  };
  stats: {
    total_tickets: number;
    open_tickets: number;
    resolved_tickets: number;
    pending_tickets: number;
    urgent_tickets: number;
    average_resolution_time: number;
    satisfaction_score: number;
    category_distribution: Record<TicketCategory, number>;
    status_distribution: Record<TicketStatus, number>;
  };
}

export interface CreateTicketPayload {
  type: TicketType;
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  description: string;
  attachments?: string[];
  order_id?: string;
  listing_id?: string;
  user_reported_id?: string;
}

export interface UpdateTicketPayload {
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  subject?: string;
  description?: string;
  assigned_to?: string;
  escalation_level?: number;
}

export interface CreateMessagePayload {
  ticket_id: string;
  message: string;
  attachments?: string[];
  is_internal?: boolean;
}

export interface CreateDisputePayload {
  order_id: string;
  respondent_id: string;
  reason: string;
  category: TicketCategory;
  priority: TicketPriority;
  evidence?: DisputeEvidence[];
}

export interface SubmitEvidencePayload {
  dispute_id: string;
  evidence_type: DisputeEvidence["evidence_type"];
  evidence_url: string;
  description?: string;
}

export interface UpdateDisputePayload {
  status?: TicketStatus;
  resolution?: string;
  resolution_notes?: string;
}

export interface SatisfactionPayload {
  ticket_id: string;
  rating: number;
  comment?: string;
}

export interface TicketSearchParams {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  type?: TicketType;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "updated_at" | "priority";
  sortOrder?: "asc" | "desc";
}

export interface TicketResponse {
  ticket: SupportTicket;
}

export interface TicketsResponse {
  tickets: SupportTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface MessagesResponse {
  messages: SupportMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface DisputeResponse {
  dispute: Dispute;
}

export interface DisputesResponse {
  disputes: Dispute[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface SupportStatsResponse {
  stats: SupportStateType["stats"];
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: TicketCategory;
  tags: string[];
  views: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseResponse {
  articles: KnowledgeBaseArticle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface FAQResponse {
  faqs: {
    id: string;
    question: string;
    answer: string;
    category: TicketCategory;
    order: number;
  }[];
}
