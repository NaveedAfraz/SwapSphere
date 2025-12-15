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

// Connect to Socket.IO server
export const connectSocket = async (): Promise<Socket> => {
  try {
    console.log("=== SOCKET: WAITING FOR AUTH TO BE READY ===");
    
    // Wait for auth to be ready before connecting
    const authReady = await waitForAuth(5000);
    
    if (!authReady) {
      throw new Error("Auth not ready after timeout");
    }
    
    console.log("=== SOCKET: AUTH READY, PROCEEDING WITH CONNECTION ===");
    
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
      transports: ["websocket"],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    // Set up event listeners
    setupEventListeners();

    return new Promise((resolve, reject) => {
      if (socket) {
        socket.on("connect", () => {
          console.log("Socket connected successfully");
          reconnectAttempts = 0;
          resolve(socket!);
        });

        socket.on("connect_error", (error: any) => {
          console.error("Socket connection error:", error);
          reject(error);
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

// Join a chat room
export const joinChatRoom = (chatId: string): void => {
  if (socket && socket.connected && !joinedRooms.has(chatId)) {
    socket.emit("join_chat", chatId);
    joinedRooms.add(chatId);
    console.log(`Joining chat room: ${chatId}`);
  }
};

// Leave a chat room
export const leaveChatRoom = (chatId: string): void => {
  if (socket && socket.connected && joinedRooms.has(chatId)) {
    socket.emit("leave_chat", chatId);
    joinedRooms.delete(chatId);
    console.log(`Leaving chat room: ${chatId}`);
  }
};

// Send a message
export const sendSocketMessage = (
  chatId: string,
  body: string,
  attachments: any[] = []
): void => {
  if (socket && socket.connected) {
    socket.emit("send_message", {
      chatId,
      body,
      attachments,
    });
  }
};

// Start typing indicator
export const startTyping = (chatId: string): void => {
  if (socket && socket.connected) {
    socket.emit("typing_start", chatId);
  }
};

// Stop typing indicator
export const stopTyping = (chatId: string): void => {
  if (socket && socket.connected) {
    socket.emit("typing_stop", chatId);
  }
};

// Mark messages as read
export const markAsRead = (chatId: string, messageIds: string[]): void => {
  if (socket && socket.connected) {
    socket.emit("mark_read", {
      chatId,
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
  socket.on("joined_chat", (data: any) => {
    console.log("Joined chat:", data.chatId);
  });

  socket.on("left_chat", (data: any) => {
    console.log("Left chat:", data.chatId);
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
