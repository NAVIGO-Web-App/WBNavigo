// src/__tests__/__mocks__/MockAuthProvider.tsx
import React, { createContext, useContext } from "react";

const mockAuthContextValue = {
  currentUser: {
    uid: "mockUserId",
    email: "mockuser@example.com",
    displayName: "Mock User",
  },
  signup: vi.fn(() => Promise.resolve({ user: { uid: "mockUserId" } })),
  login: vi.fn(() => Promise.resolve()),
  logout: vi.fn(() => Promise.resolve()),
};

const MockAuthContext = createContext(mockAuthContextValue);
export const useAuth = () => useContext(MockAuthContext);

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MockAuthContext.Provider value={mockAuthContextValue}>
    {children}
  </MockAuthContext.Provider>
);
