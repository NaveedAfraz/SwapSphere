import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "../store";
import { selectAuthStatus, selectUser } from "../features/auth/authSelectors";

// Socket instance and state
let socket: Socket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

// Track joined rooms to prevent duplicate joins
const joinedRooms = new Set<string>();

// Callback functions for socket events
let onMessageCallback: ((message: any) => void) | null = null;
let onTypingCallback: ((data: any) => void) | null = null;
let onMessagesReadCallback: ((data: any) => void) | null = null;

// Check if auth is ready
const isAuthReady = (): boolean => {
  const state = store.getState();
  const authStatus = selectAuthStatus(state);
  const user = selectUser(state);
  return authStatus === 'authenticated' && user !== null;
};

// Wait for auth to be ready (with timeout)
const waitForAuth = (timeout = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (isAuthReady()) {
      resolve(true);
      return;
    }

    const checkInterval = setInterval(() => {
      if (isAuthReady()) {
        clearInterval(checkInterval);
        resolve(true);
      }
    }, 100);

    // Timeout after specified duration
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(false);
    }, timeout);
  });
};

// Connect to Socket.IO server - ENHANCED LOGGING
export const connectSocket = async (): Promise<Socket> => {
  try {
    // Wait for auth to be ready before connecting
    const authReady = await waitForAuth(5000);
    
    if (!authReady) {
      throw new Error("Auth not ready after timeout");
    }
    
    const token = await AsyncStorage.getItem("authToken");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const serverUrl =
      process.env.EXPO_PUBLIC_SOCKET_URL || "http://192.168.0.104:5000";

    socket = io(serverUrl, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"], // Add polling as fallback
      timeout: 20000, // Increase timeout
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      forceNew: true, // Force new connection on reconnect
    });

    // Set up event listeners
    setupEventListeners();

    return new Promise((resolve, reject) => {
      if (socket) {
        socket.on("connect", () => {
          console.log("Socket connected successfully, ID:", socket?.id);
          reconnectAttempts = 0;
          resolve(socket!);
        });

        socket.on("connect_error", (error: any) => {
          console.error("Socket connection error:", error.message, error.description);
          console.error("Connection details - URL:", serverUrl, "Transports:", socket?.io.engine.transport.name);
          reject(error);
        });

        // Add reconnection attempt logging
        socket.io.on("reconnect_attempt", (attemptNumber: any) => {
          console.log("Socket reconnection attempt:", attemptNumber);
        });
      }
    });
  } catch (error: any) {
    console.error("Failed to connect to socket:", error);
    throw error;
  }
};

// Disconnect from Socket.IO server
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("Socket disconnected");
    // Clear joined rooms when disconnecting
    joinedRooms.clear();
  }
};

// Check if connected
export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};

// Join a chat room (deal room)
export const joinChatRoom = (chatId: string): void => {
  console.log("[SOCKET] Joining deal room check - Socket exists:", !!socket, "Connected:", socket?.connected, "Already joined:", joinedRooms.has(chatId), "Room:", chatId); 
  if (socket && socket.connected && !joinedRooms.has(chatId)) {
    socket.emit("join_deal_room", chatId);
    joinedRooms.add(chatId);
    console.log(`Joining deal room: ${chatId}`);
  }
};

// Leave a chat room (deal room)
export const leaveChatRoom = (chatId: string): void => {
  if (socket && socket.connected && joinedRooms.has(chatId)) {
    socket.emit("leave_deal_room", chatId);
    joinedRooms.delete(chatId);
    console.log(`Leaving deal room: ${chatId}`);
  }
};

// Send a message
export const sendSocketMessage = (
  dealRoomId: string,
  body: string,
  attachments: any[] = []
): void => {
  console.log("[SOCKET] Attempting to send message - Socket exists:", !!socket, "Connected:", socket?.connected, "Deal room ID:", dealRoomId); 
  if (socket && socket.connected) {
    socket.emit("send_message", {
      dealRoomId,
      body,
      attachments,
    });
  }
};

// Start typing indicator
export const startTyping = (dealRoomId: string): void => {
  console.log("[SOCKET] Starting typing - Socket exists:", !!socket, "Connected:", socket?.connected, "Deal room ID:", dealRoomId); 
  if (socket && socket.connected) {
    socket.emit("typing_start", dealRoomId);
  }
};

// Stop typing indicator
export const stopTyping = (dealRoomId: string): void => {
  console.log("[SOCKET] Stopping typing - Socket exists:", !!socket, "Connected:", socket?.connected, "Deal room ID:", dealRoomId); 
  if (socket && socket.connected) {
    socket.emit("typing_stop", dealRoomId);
  }
};

// Mark messages as read
export const markAsRead = (dealRoomId: string, messageIds: string[]): void => {
  console.log("[SOCKET] Marking messages as read - Socket exists:", !!socket, "Connected:", socket?.connected, "Deal room ID:", dealRoomId); 
  if (socket && socket.connected) {
    socket.emit("mark_read", {
      dealRoomId,
      messageIds,
    });
  }
};

// Set up event listeners
const setupEventListeners = (): void => {
  if (!socket) return;

  // Connection events
  socket.on("disconnect", (reason: any) => {
    console.log("Socket disconnected:", reason);
  });

  socket.on("reconnect", (attemptNumber: any) => {
    console.log("Socket reconnected after", attemptNumber, "attempts");
  });

  socket.on("reconnect_error", (error: any) => {
    console.error("Socket reconnection error:", error);
    reconnectAttempts++;

    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log("Max reconnection attempts reached, giving up");
      disconnectSocket();
    }
  });

  // Chat events
  socket.on("joined_deal_room", (data: any) => {
    console.log("Joined deal room:", data.dealRoomId);
  });

  socket.on("left_deal_room", (data: any) => {
    console.log("Left deal room:", data.dealRoomId);
  });

  // Message events
  socket.on("new_message", (message: any) => {
    console.log("New message received via socket:", message);
    // Dispatch to Redux store - this will be handled by the component
    if (onMessageCallback) {
      onMessageCallback(message);
    }
  });

  socket.on("user_typing", (data: any) => {
    console.log("User typing:", data);
    if (onTypingCallback) {
      onTypingCallback(data);
    }
  });

  socket.on("messages_read", (data: any) => {
    console.log("Messages read:", data);
    if (onMessagesReadCallback) {
      onMessagesReadCallback(data);
    }
  });

  // Error handling
  socket.on("error", (error: any) => {
    console.error("Socket error:", error);
  });
};

// Get the socket instance
export const getSocket = (): Socket | null => {
  return socket;
};

// Reconnect with new token
export const reconnectSocketWithNewToken = async (): Promise<void> => {
  disconnectSocket();
  await connectSocket();
};

// Set up event callbacks
export const onSocketMessage = (callback: (message: any) => void): void => {
  onMessageCallback = callback;
};

export const onOfferUpdate = (callback: (data: any) => void): void => {
  if (!socket) {
    console.warn('[SOCKET] Cannot listen to offer updates - socket not connected');
    return;
  }
  
  socket.on('offer_updated', (data) => {
    console.log('[SOCKET] Received offer_updated event:', data);
    callback(data);
  });
  console.log('[SOCKET] Listening for offer update events');
};

export const offOfferUpdate = (callback: (data: any) => void): void => {
  if (!socket) return;
  
  socket.off('offer_updated', callback);
  console.log('[SOCKET] Stopped listening for offer update events');
};

export const onSocketTyping = (callback: (data: any) => void): void => {
  onTypingCallback = callback;
};

export const onSocketMessagesRead = (callback: (data: any) => void): void => {
  onMessagesReadCallback = callback;
};

// Clear all callbacks
export const clearSocketCallbacks = (): void => {
  onMessageCallback = null;
  onTypingCallback = null;
  onMessagesReadCallback = null;
};
