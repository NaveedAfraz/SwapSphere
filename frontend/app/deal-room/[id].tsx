import React, { useEffect, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import DealRoomChat from '../../src/features/dealRooms/components/DealRoomChat';
import { GlobalThemeWrapper } from '../../src/components/GlobalThemeComponents';
import { useRouter } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../../src/hooks/redux';
import { useAuth } from '../../src/hooks/useAuth';
import { fetchDealRoom } from '../../src/features/dealRooms/dealRoomSlice';

export default function DealRoomScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { currentDealRoom, status } = useAppSelector((state) => state.dealRooms);

  useEffect(() => {
    if (id && typeof id === 'string') {
      dispatch(fetchDealRoom(id));
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
  }, [currentDealRoom, user?.id]);
  

  return (
    <GlobalThemeWrapper useFullPage={true}>
      <DealRoomChat 
        dealRoomId={id} 
        onBack={handleBack}
        {...negotiationProps}
      />
    </GlobalThemeWrapper>
  );
}
