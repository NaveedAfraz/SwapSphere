import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

// Token refresh promise
let tokenRefreshPromise: Promise<string | null> | null = null;

function validateToken(token: string): boolean {
  if (!token) return false;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    return payload.exp > (currentTime + 300);
  } catch (error: any) {
    return false;
  }
}

export const getAuthState = () => {
  try {
    // Dynamic import to avoid circular dependency
    const store = require("@/src/store").store;
    const state = store.getState();
    return {
      user: state.auth.user,
      accessToken: state.auth.accessToken,
      refreshToken: state.auth.refreshToken,
      status: state.auth.status,
      isAuthenticated: state.auth.status === 'authenticated' && state.auth.user !== null
    };
  } catch (error) {
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      status: 'unauthenticated',
      isAuthenticated: false
    };
  }
};

export const getCurrentUser = (): AuthUser | null => {
  try {
    const store = require("@/src/store").store;
    const state = store.getState();
    const user = state.auth.user;
    
    if (user && user.id) {
      return user;
    }
    
    const token = state.auth.accessToken;
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          return {
            id: payload.userId || payload.user_id,
            email: payload.email,
            name: payload.name,
            avatar: payload.avatar
          };
        }
      } catch (jwtError) {
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  try {
    const store = require("@/src/store").store;
    const state = store.getState();
    const token = state.auth.accessToken;
    
    if (token) {
      return token;
    }
    
    const storageToken = await AsyncStorage.getItem('authToken');
    return storageToken;
    
  } catch (error) {
    const token = await AsyncStorage.getItem('authToken');
    return token;
  }
};

export const isAuthenticated = (): boolean => {
  try {
    const store = require("@/src/store").store;
    const state = store.getState();
    return state.auth.status === 'authenticated' && state.auth.user !== null;
  } catch (error) {
    return false;
  }
};

export const handleAuthError = async (): Promise<void> => {
  try {
    const store = require("@/src/store").store;
    const logoutAction = require("@/src/features/auth/authSlice").logout;
    store.dispatch(logoutAction() as any);
  } catch (error) {
  }
  
  await AsyncStorage.multiRemove(['authToken', 'authUser', 'refreshToken']);
};

export const getValidToken = async (): Promise<string | null> => {
  const token = await getAccessToken();
  
  if (!token) {
    return null;
  }
  
  if (validateToken(token)) {
    return token;
  }
  
  const refreshedToken = await refreshToken();
  return refreshedToken;
};

const refreshToken = async (): Promise<string | null> => {
  if (tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  tokenRefreshPromise = doTokenRefresh();
  
  try {
    const newToken = await tokenRefreshPromise;
    return newToken;
  } finally {
    tokenRefreshPromise = null;
  }
};

const doTokenRefresh = async (): Promise<string | null> => {
  try {
    const store = require("@/src/store").store;
    const state = store.getState();
    const refreshToken = state.auth.refreshToken;
    
    if (!refreshToken) {
      return null;
    }

    return null;
  } catch (error) {
    return null;
  }
};

export const initializeAuth = async (): Promise<void> => {
  try {
    const [token, userStr, refreshToken] = await AsyncStorage.multiGet([
      'authToken',
      'authUser', 
      'refreshToken'
    ]);

    const authToken = token[1];
    const userData = userStr[1];
    const refreshTok = refreshToken[1];

    if (authToken && userData) {
      try {
        const user = JSON.parse(userData);
        
        if (validateToken(authToken)) {
        } else {
          await handleAuthError();
        }
      } catch (parseError) {
      }
    }
  } catch (error) {
  }
};

export const getLegacyToken = async (): Promise<string | null> => {
  return getAccessToken();
};
