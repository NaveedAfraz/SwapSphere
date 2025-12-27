import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api';
import { Auction, AuctionBid, CreateAuctionPayload, PlaceBidPayload } from './auctionSlice';

export const createAuction = createAsyncThunk<
  { auctionRoomId: string; auctionId: string },
  { directDealId: string; startPrice: number; minIncrement: number; durationMinutes: number; inviteeIds: string[] }
>('auction/createAuction', async (auctionData) => {
  const { directDealId, ...payload } = auctionData;
  const response = await apiClient.post(`/auction/deals/${directDealId}/start-auction`, payload);
  return response.data;
});

export const fetchAuction = createAsyncThunk<
  { auction: Auction; highestBid: AuctionBid | null; participants: any[] },
  string
>('auction/fetchAuction', async (auctionId) => {
  const response = await apiClient.get(`/auction/${auctionId}`);
  return response.data;
});

export const fetchAuctionByDealRoom = createAsyncThunk<
  { auction: any; highestBid: any; participants: any[] },
  string
>('auction/fetchAuctionByDealRoom', async (dealRoomId) => {
  const response = await apiClient.get(`/auction/deal-room/${dealRoomId}`);
  return response.data;
});

export const placeBid = createAsyncThunk<
  { bid: AuctionBid; highestBid: number },
  { auctionId: string; amount: number }
>('auction/placeBid', async (bidData) => {
  const response = await apiClient.post(`/auction/${bidData.auctionId}/bid`, { amount: bidData.amount });
  return response.data;
});

export const cancelAuction = createAsyncThunk<
  { message: string },
  string
>('auction/cancelAuction', async (auctionId) => {
  const response = await apiClient.post(`/auction/${auctionId}/cancel`);
  return response.data;
});
