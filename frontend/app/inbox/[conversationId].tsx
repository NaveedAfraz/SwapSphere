import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import ChatScreen from "@/src/features/inbox/components/ChatScreen";
import {
  fetchChatByIdThunk,
  fetchMessagesThunk,
  sendMessageThunk,
  findOrCreateChatByUsersThunk,
  sendMessageOrCreateChatThunk,
  createChatThunk,
  markMessagesAsReadThunk,
} from "@/src/features/inbox/chatThunks";
import {
  selectCurrentChat,
  selectChatMessages,
  selectConversationInfo,
  selectIsChatLoading,
} from "@/src/features/inbox/chatSelectors";
import { getUserByIdThunk } from "@/src/features/user/userThunks";
import {
  selectUser as selectAuthUser,
  selectUserId,
} from "@/src/features/auth/authSelectors";
import { selectFetchedUser } from "@/src/features/user/userSelectors";
import type { Message } from "@/src/features/inbox/types/chat";

export default function ConversationScreen() {
  const { conversationId, listingId, participant1Id, participant2Id } =
    useLocalSearchParams<{
      conversationId: string;
      listingId?: string;
      participant1Id?: string;
      participant2Id?: string;
    }>();
  const dispatch = useDispatch();

  // State to track the actual chat ID (might be different from conversationId)
  const [actualChatId, setActualChatId] = useState<string | null>(null);

  // Redux state
  const currentUser = useSelector(selectAuthUser);
  const currentUserId = useSelector(selectUserId);
  const currentChat = useSelector(selectCurrentChat);
  const isLoading = useSelector(selectIsChatLoading);
  const fetchedUser = useSelector(selectFetchedUser);
  const messages = useSelector((state: any) => {
    // Only fetch messages if we have an actual chat ID
    if (!actualChatId) return [];

    const msgs = selectChatMessages(state, actualChatId) as Message[];
    return msgs;
  });
  const conversationInfo = useSelector((state: any) => {
    const info = selectConversationInfo(
      state,
      actualChatId || (conversationId as string)
    );
    return info;
  });

  const [error, setError] = useState<string | null>(null);

  // Handle sending messages
  const handleSendMessage = async (message: string) => {
    const chatIdToSend = actualChatId || conversationId;
    if (!chatIdToSend) return;

    try {
      let result;

      // If we have an actual chat ID, send message to it
      if (actualChatId) {
        result = await dispatch(
          sendMessageThunk({
            chatId: actualChatId,
            messageData: { body: message },
          }) as any
        ).unwrap();
      } else {
        // No chat exists yet, create one with listing info and send message
        result = await dispatch(
          sendMessageOrCreateChatThunk({
            recipientId: conversationId as string,
            messageData: { body: message },
            listingId: listingId, // Pass listing ID if available
          }) as any
        ).unwrap();

        // Update actual chat ID to newly created chat ID (handle wrapped and unwrapped shapes)
        if (result) {
          const chatId =
            result.chat_id ||
            result.data?.chat_id ||
            result.data?.chat?.id ||
            result.data?.id ||
            result.id;
          if (chatId) {
            setActualChatId(chatId);
            dispatch(fetchChatByIdThunk(chatId) as any);
            dispatch(fetchMessagesThunk({ chatId }) as any);
          }
        }
      }
    } catch (error: any) {
      console.error("Failed to send message in conversation screen:", error);
    }
  };

  useEffect(() => {
    // Only fetch if we don't have actualChatId set yet and we have current user
    if (!actualChatId && conversationId && currentUser) {
      // Try to fetch chat details first (might fail if conversationId is user ID)
      dispatch(fetchChatByIdThunk(conversationId as string) as any)
        .then((result: any) => {
          // If fetch succeeded, set actualChatId and load messages
          if (
            result &&
            result.meta &&
            result.meta.requestStatus === "fulfilled" &&
            result.payload
          ) {
            const chatId = conversationId as string;
            setActualChatId(chatId);
            dispatch(fetchMessagesThunk({ chatId }) as any);
            return;
          }

          // Otherwise, try to find existing chat between current user and the conversationId (other user)
          if (currentUser?.id) {
            dispatch(
              findOrCreateChatByUsersThunk({
                participant1Id: currentUser.id,
                participant2Id: conversationId as string,
                listingId: listingId || undefined,
              }) as any
            )
              .then((result: any) => {
                if (result && result.payload && result.payload.id) {
                  const chatId = result.payload.id;
                  setActualChatId(chatId);

                  // Fetch the full chat details with offer data
                  dispatch(fetchChatByIdThunk(chatId) as any).then(
                    (chatResult: any) => {}
                  );

                  // Fetch messages for the found chat
                  dispatch(fetchMessagesThunk({ chatId }) as any);

                  dispatch(getUserByIdThunk(participant2Id as string) as any);
                } else {
                  // Create a new chat when no existing chat is found
                  dispatch(
                    createChatThunk({
                      listing_id: listingId || undefined,
                      participant_id: conversationId as string,
                    }) as any
                  )
                    .then((result: any) => {
                      if (
                        result &&
                        result.payload &&
                        result.payload.data &&
                        result.payload.data.id
                      ) {
                        const newChatId = result.payload.data.id;
                        setActualChatId(newChatId);
                        // Fetch the full chat details with offer data
                        dispatch(fetchChatByIdThunk(newChatId) as any)
                          .then((chatResult: any) => {})
                          .catch((error: any) => {});
                        // Fetch messages for the new chat
                        dispatch(
                          fetchMessagesThunk({ chatId: newChatId }) as any
                        );
                        // Fetch user profile for header
                        dispatch(
                          getUserByIdThunk(conversationId as string) as any
                        );
                      }
                    })
                    .catch((error: any) => {
                      // Fallback to fetching user profile for header
                      dispatch(
                        getUserByIdThunk(conversationId as string) as any
                      );
                    });
                }
              })
              .catch((error: any) => {
                // No existing chat found, will create on first message
              });
          }
          dispatch(getUserByIdThunk(participant2Id as string) as any);
        })
        .catch((error: any) => {
          // This should not happen since Redux Toolkit doesn't throw errors
        });
    }

    return () => {
      // Cleanup subscription when component unmounts
      if (actualChatId || conversationId) {
        // Note: unsubscribeFromChatThunk was removed from imports, keeping cleanup for future use
      }
    };
  }, [conversationId, dispatch, currentUser, listingId]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (actualChatId && messages && messages.length > 0) {
      // Find unread messages (messages not sent by current user)
      const unreadMessageIds = messages
        .filter(msg => !msg.is_read && msg.sender_id !== currentUserId)
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        dispatch(markMessagesAsReadThunk({ 
          chatId: actualChatId, 
          messageIds: unreadMessageIds 
        }) as any);
      }
    }
  }, [actualChatId, messages, currentUserId, dispatch]);

  // Handle loading state
  // if (isLoading && !currentChat) {
  //   return (
  //     <ChatScreen
  //       conversationId={conversationId as string}
  //       userName="Loading..."
  //       userAvatar=""
  //       isLoading={true}
  //       messages={messages}
  //       onSendMessage={handleSendMessage}
  //       currentUserId={currentUserId || undefined}
  //     />
  //   );
  // }

  // Handle error state - show chat box instead of error
  if (error || (!currentChat && !isLoading)) {
    // Show fetched user details if available
    const userName = fetchedUser?.name || "New Chat";
    const userAvatar = fetchedUser?.avatar || "";

    return (
      <ChatScreen
        conversationId={conversationId as string}
        userName={userName}
        userAvatar={userAvatar}
        isLoading={false}
        messages={messages}
        onSendMessage={handleSendMessage}
        currentUserId={currentUserId || undefined}
      />
    );
  }

  // Use real conversation data if available
  if (conversationInfo) {
    return (
      <ChatScreen
        conversationId={conversationId as string}
        actualChatId={actualChatId || undefined}
        userName={conversationInfo.name || "Unknown User"}
        userAvatar={conversationInfo.avatar || ""}
        itemName={conversationInfo.itemName}
        itemImage={conversationInfo.itemImage}
        originalPrice={conversationInfo.originalPrice?.toString()}
        currentOffer={conversationInfo.currentOffer}
        isOwnOffer={conversationInfo.isOwnOffer}
        offerStatus={conversationInfo.offerStatus}
        offerId={conversationInfo.offerId}
        messages={messages}
        onSendMessage={handleSendMessage}
        currentUserId={currentUserId || undefined}
      />
    );
  }

  // Fallback - no conversation or offer data found
  return (
    <ChatScreen
      conversationId={conversationId as string}
      userName={fetchedUser?.name || "Unknown User"}
      userAvatar={fetchedUser?.avatar || ""}
      isLoading={false}
      messages={messages}
      onSendMessage={handleSendMessage}
      currentUserId={currentUserId || undefined}
    />
  );
}
