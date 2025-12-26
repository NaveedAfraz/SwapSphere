import { getSocket } from './socketService';
import { store } from '../store';
import {
  handleAuctionStarted,
  handleBidUpdate,
  handleAuctionClosed,
  Auction,
  AuctionBid,
} from '../features/auction/auctionSlice';

export const joinAuctionRoom = (auctionId: string) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('join_auction', { auctionId });
  }
};

export const leaveAuctionRoom = (auctionId: string) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('leave_auction', { auctionId });
  }
};

export const onAuctionUpdate = () => {
  const socket = getSocket();
  if (socket) {
    socket.on('auction:started', (data: Auction) => {
      store.dispatch(handleAuctionStarted(data));
    });

    socket.on('auction:bid:update', (data: AuctionBid) => {
      store.dispatch(handleBidUpdate(data));
    });

    socket.on('auction:closed', (data: { auction_id: string; winner_id?: string; final_amount: number }) => {
      store.dispatch(handleAuctionClosed(data));
    });
  }
};
