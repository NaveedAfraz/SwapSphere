import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../../services/api";
import {  
  DealRoom,
  DealRoomResponse,
  DealRoomsResponse,
  Message,
  MessagesResponse,
  DealEvent,
  DealEventsResponse,
  CreateDealRoomPayload,
  SendMessagePayload,
  UpdateDealRoomStatePayload,
  DealRoomSearchParams,
  MessageSearchParams,
  DealEventSearchParams,
  MessageResponse,
} from "./types/dealRoom";

// Deal Room API calls
export const dealRoomApi = {
  // Deal Rooms
  getDealRooms: async (
    params: DealRoomSearchParams = {}
  ): Promise<DealRoomsResponse> => {
    const response = await apiClient.get("/deal-rooms", { params });
    return response.data;
  },

  getDealRoom: async (dealRoomId: string): Promise<DealRoomResponse> => {
    const response = await apiClient.get(`/deal-rooms/${dealRoomId}`);
    return response.data;
  },

  createDealRoom: async (
    payload: CreateDealRoomPayload
  ): Promise<DealRoomResponse> => {
    const response = await apiClient.post("/deal-rooms", payload);
    return response.data;
  },

  findDealRoom: async (
    seller_id: string,
    listing_id: string
  ): Promise<DealRoomResponse> => {
    const response = await apiClient.get("/deal-rooms/find", {
      params: { seller_id, listing_id },
    });
    return response.data;
  },

  updateDealRoomState: async (
    dealRoomId: string,
    payload: UpdateDealRoomStatePayload
  ): Promise<DealRoomResponse> => {
    const response = await apiClient.patch(
      `/deal-rooms/${dealRoomId}/state`,
      payload
    );
    return response.data;
  },

  // Messages
  getMessages: async (
    dealRoomId: string,
    params: MessageSearchParams = {}
  ): Promise<MessagesResponse> => {
    const response = await apiClient.get(`/messages/${dealRoomId}`, { params });
    return response.data;
  },

  sendMessage: async (
    dealRoomId: string,
    payload: SendMessagePayload
  ): Promise<MessageResponse> => {
    const response = await apiClient.post(`/messages/${dealRoomId}`, payload);
    return response.data;
  },

  markMessagesAsRead: async (
    dealRoomId: string,
    message_ids: string[]
  ): Promise<void> => {
    await apiClient.patch(`/messages/${dealRoomId}/read`, { message_ids });
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/messages/message/${messageId}`);
  },

  getUnreadCount: async (
    dealRoomId?: string
  ): Promise<{ unread_count: number }> => {
    const params = dealRoomId ? { dealRoomId } : {};
    const response = await apiClient.get("/messages/unread/count", { params });
    return response.data;
  },

  // Deal Events
  getDealEvents: async (
    dealRoomId: string,
    params: DealEventSearchParams = {}
  ): Promise<DealEventsResponse> => {
    const response = await apiClient.get(`/deal-events/${dealRoomId}`, {
      params,
    });
    return response.data;
  },
};

// Redux Thunks
export const createDealRoomThunk = createAsyncThunk<
  DealRoomResponse,
  { listing_id: string; seller_id: string; intent_id?: string },
  { rejectValue: string }
>(
  "dealRooms/createDealRoom",
  async ({ listing_id, seller_id, intent_id }, { rejectWithValue }) => {
    try {
      const payload: CreateDealRoomPayload = {
        listing_id,
        seller_id,
        intent_id,
      };
      const response = await apiClient.post<DealRoomResponse>("/deal-rooms", payload);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to create deal room";
      return rejectWithValue(errorMessage);
    }
  }
);

export const findOrCreateDealRoomThunk = createAsyncThunk<
  DealRoomResponse,
  { listing_id: string; seller_id: string; intent_id?: string },
  { rejectValue: string }
>(
  "dealRooms/findOrCreateDealRoom",
  async ({ listing_id, seller_id, intent_id }, { rejectWithValue, dispatch }) => {
    try {
      // If seller_id is a user ID, we need to get the seller record ID from the listing
      let actualSellerId = seller_id;
      
      // Check if this looks like a user ID (UUID format) and fetch seller record ID
      if (seller_id && seller_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        try {
          const listingResponse = await apiClient.get(`/listing/${listing_id}`);
          const listingData = listingResponse.data;
          
          if (listingData.seller_id) {
            actualSellerId = listingData.seller_id;
          }
        } catch (listingError: any) {
          // Failed to fetch listing for seller ID
        }
      }
      
      // First try to find existing deal room
      try {
        const response = await apiClient.get<DealRoomResponse>("/deal-rooms/find", {
          params: { seller_id: actualSellerId, listing_id },
        });
        return response.data;
      } catch (findError: any) {
        // If not found, create new deal room
        if (findError.response?.status === 404) {
          const payload: CreateDealRoomPayload = {
            listing_id,
            seller_id: actualSellerId,
            intent_id,
          };
          const createResponse = await apiClient.post<DealRoomResponse>("/deal-rooms", payload);
          return createResponse.data;
        }
        throw findError;
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to find or create deal room";
      return rejectWithValue(errorMessage);
    }
  }
);

// Helper functions
export const dealRoomHelpers = {
  // Get display name for deal room state
  getStateDisplayName: (state: string): string => {
    const stateNames: Record<string, string> = {
      negotiation: "Negotiation",
      payment_pending: "Payment Pending",
      payment_completed: "Payment Completed",
      shipping: "Shipping",
      delivered: "Delivered",
      completed: "Completed",
      cancelled: "Cancelled",
      disputed: "Disputed",
    };
    return stateNames[state] || state;
  },

  // Get display name for deal event type
  getEventDisplayName: (eventType: string): string => {
    const eventNames: Record<string, string> = {
      offer_created: "Offer Made",
      offer_accepted: "Offer Accepted",
      offer_declined: "Offer Declined",
      payment_initiated: "Payment Initiated",
      payment_completed: "Payment Completed",
      order_created: "Order Created",
      state_changed: "Status Changed",
      dispute_created: "Dispute Opened",
      message_sent: "Message Sent",
      system_message: "System Message",
    };
    return eventNames[eventType] || eventType;
  },

  // Format deal room for display
  formatDealRoomForDisplay: (dealRoom: DealRoom, currentUserId?: string) => {
    const isCurrentUserBuyer = currentUserId ? dealRoom.buyer_id === currentUserId : false;
    const otherPartyName = isCurrentUserBuyer
      ? dealRoom.seller_name
      : dealRoom.buyer_name;
    const otherPartyAvatar = isCurrentUserBuyer
      ? dealRoom.seller_avatar
      : dealRoom.buyer_avatar;

    return {
      ...dealRoom,
      display_name: otherPartyName || "Unknown User",
      display_avatar: otherPartyAvatar,
      state_display_name: dealRoomHelpers.getStateDisplayName(
        dealRoom.current_state
      ),
      last_message_display: dealRoom.last_message || "No messages yet",
      formatted_time: dealRoom.last_message_at
        ? new Date(dealRoom.last_message_at).toLocaleDateString()
        : new Date(dealRoom.created_at).toLocaleDateString(),
    };
  },

  // Check if user can perform certain actions based on deal room state
  canUserMakeOffer: (dealRoom: DealRoom): boolean => {
    return dealRoom.current_state === "negotiation";
  },

  canUserMakePayment: (dealRoom: DealRoom): boolean => {
    return dealRoom.current_state === "payment_pending";
  },

  canUserCancel: (dealRoom: DealRoom): boolean => {
    return ["negotiation", "payment_pending"].includes(dealRoom.current_state);
  },

  canUserOpenDispute: (dealRoom: DealRoom): boolean => {
    return ["payment_completed", "shipping", "delivered"].includes(
      dealRoom.current_state
    );
  },
};

export default dealRoomApi;
