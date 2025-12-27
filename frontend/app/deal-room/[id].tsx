import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import DealRoomChat from '../../src/features/dealRooms/components/DealRoomChat';
import { GlobalThemeWrapper } from '../../src/components/GlobalThemeComponents';
import { useRouter } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../../src/hooks/redux';
import { useAuth } from '../../src/hooks/useAuth';
import { fetchDealRoom, clearCurrentDealRoom } from '../../src/features/dealRooms/dealRoomSlice';
import AuctionDealRoomScreen from './[id]-auction';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DealRoomScreen() {
  console.log('REGULAR DEAL ROOM SCREEN RENDERED!!!');
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { currentDealRoom, status } = useAppSelector((state) => state.dealRooms);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (id && typeof id === 'string') {
      // Skip deal room fetch for auction routes - auction screen handles its own data
      if (id.includes('-auction')) {
        console.log('Skipping deal room fetch for auction route:', id);
        return;
      }
      
      // Clear current deal room to prevent stale data
      dispatch(clearCurrentDealRoom());
      // Fetch new deal room data
      dispatch(fetchDealRoom(id.replace('-auction', '')));
      
      console.log('Loading deal room:', id);
    }
  }, [id, dispatch]);

  
  const handleBack = () => {
    router.back();
  };

  if (!id || typeof id !== 'string') {
    return null;
  }

  // Extract negotiation data from deal room - make it reactive
  const negotiationProps = useMemo(() => {
    if (!currentDealRoom) {
      return {};
    }

    const isOwnOffer = currentDealRoom.latest_offer?.buyer_id === user?.id || 
                     currentDealRoom.seller_user_id === user?.id;
    
    // Log auction-related data
    if (currentDealRoom.metadata?.auction_id) {
      console.log('Auction detected:', {
        dealRoomId: id,
        auctionId: currentDealRoom.metadata.auction_id,
        currentState: currentDealRoom.current_state
      });
    }
    
    return {
      itemName: currentDealRoom.listing_title,
      itemImage: currentDealRoom.listing_image,
      originalPrice: currentDealRoom.listing_price ? Number(currentDealRoom.listing_price) : undefined,
      currentOffer: currentDealRoom.latest_offer?.offered_price,
      isOwnOffer,
      offerStatus: currentDealRoom.latest_offer?.status,
      offerId: currentDealRoom.latest_offer?.id,
      conversationId: currentDealRoom.id,
      actualChatId: currentDealRoom.id,
    };
  }, [currentDealRoom, user?.id, id]);
  

  return (
    <GlobalThemeWrapper useFullPage={true}>
      {currentDealRoom?.room_type === 'auction' || (typeof id === 'string' && id.includes('-auction')) ? (
        <AuctionDealRoomScreen />
      ) : (
        currentDealRoom ? (
          <DealRoomChat 
            dealRoomId={typeof id === 'string' ? id.replace('-auction', '') : id} 
            onBack={handleBack}
            {...negotiationProps}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Loading...</Text>
          </View>
        )
      )}
    </GlobalThemeWrapper>
  );
}
