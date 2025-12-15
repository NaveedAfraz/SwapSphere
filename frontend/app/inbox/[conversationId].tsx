import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import ChatScreen from "@/src/features/inbox/components/ChatScreen";
import {
  fetchChatByIdThunk,
  fetchMessagesThunk,
  subscribeToChatThunk,
  unsubscribeFromChatThunk,
} from "@/src/features/inbox/chatThunks";
import {
  selectCurrentChat,
  selectChatMessages,
  selectConversationInfo,
  selectIsChatLoading,
} from "@/src/features/inbox/chatSelectors";
import {
  getUserByIdThunk,
  getUserProfileThunk,
} from "@/src/features/user/userThunks";
import { selectUser as selectAuthUser } from "@/src/features/auth/authSelectors";
import {
  selectFetchedUser,
} from "@/src/features/user/userSelectors";
import { fetchOfferByIdThunk } from "@/src/features/offer/offerThunks";
import {
  selectCurrentOffer,
  selectOfferStatus,
} from "@/src/features/offer/offerSelectors";

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const dispatch = useDispatch();

  // Redux state
  const currentUser = useSelector(selectAuthUser);
  const currentChat = useSelector(selectCurrentChat);
  const isLoading = useSelector(selectIsChatLoading);
  const fetchedUser = useSelector(selectFetchedUser);
  const currentOffer = useSelector(selectCurrentOffer);
  const offerStatus = useSelector(selectOfferStatus);
  const messages = useSelector((state: any) =>
    selectChatMessages(state, conversationId as string)
  );
  const conversationInfo = useSelector((state: any) =>
    selectConversationInfo(state, conversationId as string)
  );

  const [error, setError] = useState<string | null>(null);

  // Fetch offer data if conversationId might be an offer ID
  // useEffect(() => {
  //   if (conversationId && !currentChat && !currentOffer && offerStatus !== 'loading') {
  //     console.log('=== TRYING TO FETCH OFFER BY ID ===');
  //     console.log('conversationId:', conversationId);
  //     console.log('currentChat:', currentChat);
  //     console.log('currentOffer:', currentOffer);
  //     console.log('offerStatus:', offerStatus);

  //     // Try to fetch as offer ID
  //     dispatch(fetchOfferByIdThunk(conversationId as string) as any)
  //       .then((res: any) => {
  //         console.log("Offer fetched successfully", res);
  //       })
  //       .catch((error: any) => {
  //         console.log("Not an offer ID, continuing with user fetch:", error.message);
  //       });
  //   }
  // }, [conversationId, currentChat, currentOffer, offerStatus, dispatch]);

  useEffect(() => {
    if (conversationId) {
      // Fetch chat details and messages
      dispatch(fetchChatByIdThunk(conversationId as string) as any);
      dispatch(fetchMessagesThunk({ chatId: conversationId as string }) as any);

      // Subscribe to real-time updates
      dispatch(subscribeToChatThunk(conversationId as string) as any);
    }

    return () => {
      // Cleanup subscription when component unmounts
      if (conversationId) {
        dispatch(unsubscribeFromChatThunk(conversationId as string) as any);
      }
    };
  }, [conversationId, dispatch]);

  // Fetch current user profile if not available
  // useEffect(() => {
  //   if (!currentUser) {
  //     dispatch(getUserProfileThunk() as any);
  //   }
  // }, [currentUser, dispatch]);

  // Separate effect for fetching user details to avoid repeated subscriptions
  useEffect(() => {
    if (conversationId && currentUser && conversationId !== currentUser.id) {
      dispatch(getUserByIdThunk(conversationId as string) as any);
    }
  }, [conversationId, currentUser, dispatch]);

  // Also fetch user details when there's no current chat (new chat scenario)
  useEffect(() => {
    if (conversationId && !currentChat && !isLoading) {
      // Always try to fetch user details even if not authenticated
      dispatch(getUserByIdThunk(conversationId as string) as any)
        .then((res: any) => {
          setError(null);
        })
        .catch((error: any) => {
          setError(error.message);
        });
    }
  }, [conversationId, currentChat, isLoading, dispatch]);

  // Check if user is authenticated
  if (!currentUser && !fetchedUser) {
    return (
      <ChatScreen
        conversationId={conversationId as string}
        userName="Please Login"
        userAvatar=""
        isLoading={false}
      />
    );
  }

  // Handle loading state
  if (isLoading && !currentChat) {
    return (
      <ChatScreen
        conversationId={conversationId as string}
        userName="Loading..."
        userAvatar=""
        isLoading={true}
      />
    );
  }

  // Handle error state - show chat box instead of error
  if (error || (!currentChat && !isLoading)) {
    // Show fetched user details if available
    const userName = fetchedUser?.name || "New Chat";
    const userAvatar = fetchedUser?.avatar || "";

    // Prepare offer data if available
    const offerProps = currentOffer
      ? {
          itemName: currentOffer.listing_title || "",
          itemImage: currentOffer.listing_image || "",
          originalPrice: 0, // Offer doesn't contain original price, would need separate fetch
          currentOffer: currentOffer.amount || 0,
          isOwnOffer: currentOffer.buyer_id === currentUser?.id,
          offerStatus: currentOffer.status || "pending",
        }
      : {};

    return (
      <ChatScreen
        conversationId={conversationId as string}
        userName={userName}
        userAvatar={userAvatar}
        isLoading={false}
        {...offerProps}
      />
    );
  }

  // Use real conversation data if available
  if (conversationInfo) {
    return (
      <ChatScreen
        conversationId={conversationId as string}
        userName={conversationInfo.name}
        userAvatar={conversationInfo.avatar}
        itemName={conversationInfo.itemName}
        itemImage={conversationInfo.itemImage}
        originalPrice={conversationInfo.originalPrice}
        currentOffer={conversationInfo.currentOffer}
        isOwnOffer={conversationInfo.isOwnOffer}
        messages={messages}
        onSendMessage={(message: string) => {
          // Handle sending message
        }}
      />
    );
  }

  // Fallback - no conversation or offer data found
  return (
    <ChatScreen
      conversationId={conversationId as string}
      userName="Unknown User"
      userAvatar=""
      isLoading={false}
    />
  );
}
