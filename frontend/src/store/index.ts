import { configureStore } from "@reduxjs/toolkit";
import authSlice from "../features/auth/authSlice";
import userSlice from "../features/user/userSlice";
import listingSlice from "../features/listing/listingSlice";
import chatSlice from "../features/chat/chatSlice";
import offerSlice from "../features/offer/offerSlice";
import orderSlice from "../features/order/orderSlice";
import paymentSlice from "../features/payment/paymentSlice";
import reviewSlice from "../features/review/reviewSlice";
import notificationSlice from "../features/notification/notificationSlice";
import profileSlice from "../features/profile/profileSlice";
import supportSlice from "../features/support/supportSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    listing: listingSlice,
    chat: chatSlice,
    offer: offerSlice,
    order: orderSlice,
    payment: paymentSlice,
    review: reviewSlice,
    notification: notificationSlice,
    profile: profileSlice,
    support: supportSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
