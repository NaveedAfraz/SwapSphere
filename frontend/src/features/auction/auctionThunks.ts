import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api';
import { Auction, AuctionBid, CreateAuctionPayload, PlaceBidPayload } from './auctionSlice';

export const createAuction = createAsyncThunk<
  { data: Auction },
  CreateAuctionPayload
>('auction/createAuction', async (auctionData) => {
  const response = await apiClient.post('/auctions', auctionData);
  return response.data;
});

export const fetchAuction = createAsyncThunk<
  { data: Auction },
  string
>('auction/fetchAuction', async (auctionId) => {
  const response = await apiClient.get(`/auctions/${auctionId}`);
  return response.data;
});

export const placeBid = createAsyncThunk<
  { data: AuctionBid },
  PlaceBidPayload
>('auction/placeBid', async (bidData) => {
  const response = await apiClient.post('/auctions/bid', bidData);
  return response.data;
});

export const endAuction = createAsyncThunk<
  { data: Auction },
  string
>('auction/endAuction', async (auctionId) => {
  const response = await apiClient.post(`/auctions/${auctionId}/end`);
  return response.data;
});

export const cancelAuction = createAsyncThunk<
  { data: Auction },
  string
>('auction/cancelAuction', async (auctionId) => {
  const response = await apiClient.post(`/auctions/${auctionId}/cancel`);
  return response.data;
});
