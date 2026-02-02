// src/app/(main)/SessionProvider.tsx
"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

interface SessionContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export default function SessionProvider({ children }: SessionProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <SessionContext.Provider value={{ user, setUser }}>
      {children}
    </SessionContext.Provider>
  );
}

// Custom hook for consuming session
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}