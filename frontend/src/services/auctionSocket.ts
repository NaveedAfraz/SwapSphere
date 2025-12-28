import { getSocket } from './socketService';
import { store } from '../store';
import {
  handleAuctionStarted,
  handleBidUpdate,
  handleAuctionClosed,
  Auction,
  AuctionBid,
} from '../features/auction/auctionSlice';

export const joinAuctionRoom = (auctionDealRoomId: string) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('auction:join', { auctionDealRoomId });
  }
};

export const leaveAuctionRoom = (auctionDealRoomId: string) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('auction:leave', { auctionDealRoomId });
  }
};

export const placeBidViaSocket = (auctionId: string, amount: number) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('auction:bid', { auctionId, amount });
  }
};

export const onAuctionUpdate = () => {
  const socket = getSocket();
  
  if (socket) {
    // Add global socket listener to catch all events
    socket.onAny((eventName, data) => {
    });
    
    // Reconnect if disconnected
    if (!socket.connected) {
      socket.connect();
      
      // Wait for reconnection, then rejoin rooms
      socket.on('connect', () => {
        // Rejoin auction room and deal room when reconnected
        const currentAuction = store.getState().auction.currentAuction;
        if (currentAuction) {
          joinAuctionRoom(currentAuction.id);
          const { joinChatRoom } = require('./socketService');
          joinChatRoom(currentAuction.deal_room_id);
        }
      });
    }
    
    socket.on('auction:joined', (data: { auctionDealRoomId: string }) => {
    });

    socket.on('auction:started', (data: { auctionId: string; dealRoomId: string; startPrice: number; minIncrement: number; endAt: string }) => {
      store.dispatch(handleAuctionStarted(data));
    });

    socket.on('auction:bid:update', (data: { auctionId: string; bid: AuctionBid; highestBid: number; bidderId: string }) => {
      const state = store.getState();
      const participants = state.auction?.participants || [];
      const matchingParticipant = participants.find(
        (participant) => participant.userId === data.bid.bidder_id,
      );

      const normalizedBid: AuctionBid = {
        ...data.bid,
        amount: Number(data.bid.amount),
        bidder_name: data.bid.bidder_name || matchingParticipant?.name || 'Bidder',
        bidder_avatar: data.bid.bidder_avatar || matchingParticipant?.avatarUrl || undefined,
      };

      store.dispatch(handleBidUpdate(normalizedBid));
    });

    socket.on('auction:closed', (data: { auctionId: string; dealRoomId: string; winnerId?: string; finalAmount: number; hasWinner: boolean }) => {
      console.log('[SOCKET] Received auction:closed event:', data);
      store.dispatch(handleAuctionClosed(data));
    });

    socket.on('auction:cancelled', (data: { auctionId: string; dealRoomId: string }) => {
      // Handle auction cancellation
    });

    socket.on('auction:error', (data: { error: string }) => {
      // Could dispatch an error action to show in UI
    });

    socket.on('auction:bid:success', (data: { bid: AuctionBid; highestBid: number }) => {
    });
  }
};
