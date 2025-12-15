import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hydrateAuth } from '@/src/features/auth/authThunks';
import { selectAuthStatus, selectUser } from '@/src/features/auth/authSelectors';
import { View, Text, ActivityIndicator } from 'react-native';

interface AuthHydrationProviderProps {
  children: React.ReactNode;
}

export function AuthHydrationProvider({ children }: AuthHydrationProviderProps) {
  const dispatch = useDispatch();
  const authStatus = useSelector(selectAuthStatus);
  const user = useSelector(selectUser);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    // Only run hydration once on app startup
    const performHydration = async () => {
      try {
        console.log("=== AUTH HYDRATION PROVIDER: STARTING HYDRATION ===");
        await dispatch(hydrateAuth() as any);
        console.log("=== AUTH HYDRATION PROVIDER: HYDRATION COMPLETED ===");
      } catch (error) {
        console.error("=== AUTH HYDRATION PROVIDER: HYDRATION FAILED ===", error);
      } finally {
        setIsHydrating(false);
      }
    };

    performHydration();
  }, [dispatch]);

  // Show loading screen during initial hydration
  if (isHydrating && authStatus === 'loading') {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#F9FAFB'
      }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ 
          marginTop: 16, 
          fontSize: 16, 
          color: '#6B7280',
          fontFamily: 'System'
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Once hydration is complete, render children
  return <>{children}</>;
}
