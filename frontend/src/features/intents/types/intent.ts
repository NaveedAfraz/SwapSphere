export interface Intent {
  id: string;
  buyer_id: string;
  title: string;
  description: string;
  category: string;
  max_price: number;
  location: {
    city: string;
    state?: string;
    country?: string;
  };
  status: 'open' | 'matched' | 'closed';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  buyer_name?: string;
  buyer_avatar?: string;
  deal_rooms_count?: number;
  active_deals_count?: number;
}

export interface IntentListResponse {
  intents: Intent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateIntentRequest {
  title: string;
  description: string;
  category: string;
  max_price: number;
  location: {
    city: string;
    state?: string;
  };
  metadata?: Record<string, any>;
}

export interface UpdateIntentRequest {
  title?: string;
  description?: string;
  category?: string;
  max_price?: number;
  location?: {
    city: string;
    state?: string;
  };
  status?: 'open' | 'matched' | 'closed';
  metadata?: Record<string, any>;
}

export interface SearchIntentsRequest {
  page?: number;
  limit?: number;
  category?: string;
  max_price?: number;
  location_text?: string;
  buyer_location?: {
    city: string;
    state?: string;
  };
}
