import { RootState } from '../../store';
import { DealRoom, DealRoomStateType } from './types/dealRoom';

export const selectDealRooms = (state: RootState): DealRoom[] => state.dealRooms.dealRooms;

export const selectCurrentDealRoom = (state: RootState): DealRoom | null => 
  state.dealRooms.currentDealRoom;

export const selectDealRoomById = (state: RootState, dealRoomId: string): DealRoom | undefined =>
  state.dealRooms.dealRooms.find(dr => dr.id === dealRoomId);

export const selectMessagesByDealRoomId = (state: RootState, dealRoomId: string) =>
  state.dealRooms.messages[dealRoomId] || [];

export const selectEventsByDealRoomId = (state: RootState, dealRoomId: string) =>
  state.dealRooms.events[dealRoomId] || [];

export const selectIsDealRoomsLoading = (state: RootState): boolean =>
  state.dealRooms.status === 'loading';

export const selectDealRoomsError = (state: RootState): string | null =>
  state.dealRooms.error;

export const selectSendMessageStatus = (state: RootState): string =>
  state.dealRooms.sendMessageStatus;

export const selectSendMessageError = (state: RootState): string | null =>
  state.dealRooms.sendMessageError;

export const selectDealRoomsPagination = (state: RootState) =>
  state.dealRooms.pagination;

export const selectTypingUsers = (state: RootState): Record<string, boolean> =>
  state.dealRooms.typing;

export const selectIsUserTyping = (state: RootState, dealRoomId: string): boolean =>
  !!state.dealRooms.typing[dealRoomId];

export const selectOnlineUsers = (state: RootState): string[] =>
  state.dealRooms.onlineUsers;

export const selectUnreadCount = (state: RootState): number => {
  return state.dealRooms.dealRooms.reduce((total, dealRoom) => {
    return total + (dealRoom.unread_count || 0);
  }, 0);
};

export const selectUnreadCountByDealRoomId = (state: RootState, dealRoomId: string): number => {
  const dealRoom = state.dealRooms.dealRooms.find(dr => dr.id === dealRoomId);
  return dealRoom?.unread_count || 0;
};

export const selectDealRoomsByState = (rootState: RootState, dealState: string): DealRoom[] => {
  return rootState.dealRooms.dealRooms.filter(dr => dr.current_state === dealState);
};

export const selectHasUnreadMessages = (state: RootState): boolean => {
  return state.dealRooms.dealRooms.some(dr => (dr.unread_count || 0) > 0);
};
