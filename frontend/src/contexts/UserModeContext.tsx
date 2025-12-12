import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserModeContextType {
  isSellerMode: boolean;
  setIsSellerMode: (mode: boolean) => void;
}

const UserModeContext = createContext<UserModeContextType | undefined>(undefined);

export function UserModeProvider({ children }: { children: ReactNode }) {
  const [isSellerMode, setIsSellerMode] = useState(true);

  return (
    <UserModeContext.Provider value={{ isSellerMode, setIsSellerMode }}>
      {children}
    </UserModeContext.Provider>
  );
}

export function useUserMode() {
  const context = useContext(UserModeContext);
  if (context === undefined) {
    throw new Error('useUserMode must be used within a UserModeProvider');
  }
  return context;
}
