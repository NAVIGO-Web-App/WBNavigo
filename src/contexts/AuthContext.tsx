// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          
          // Fetch the latest user data from Firestore to check admin status
          const userDoc = await getDoc(doc(db, "users", userData.uid));
          if (userDoc.exists()) {
            const userDataFromDb = userDoc.data();
            setUser({
              ...userData,
              isAdmin: userDataFromDb.isAdmin || false
            });
          } else {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error("Error checking auth state:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();
  }, []);

  const login = async (userData: { uid: string; displayName: string | null; email: string | null }) => {
    try {
      // Fetch user data from Firestore to check admin status
      const userDoc = await getDoc(doc(db, "users", userData.uid));
      let isAdmin = false;
      
      if (userDoc.exists()) {
        const userDataFromDb = userDoc.data();
        isAdmin = userDataFromDb.isAdmin || false;
      }
      
      const completeUserData = {
        ...userData,
        isAdmin
      };
      
      setUser(completeUserData);
      localStorage.setItem('user', JSON.stringify(completeUserData));
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};