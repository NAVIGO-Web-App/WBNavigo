// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser, createUserWithEmailAndPassword } from 'firebase/auth';

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
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          let isAdmin = false;
          let displayName = firebaseUser.displayName;
          
          if (userDoc.exists()) {
            const userDataFromDb = userDoc.data();
            isAdmin = userDataFromDb.isAdmin || false;
            displayName = userDataFromDb.name || displayName;
          }
          
          const userData: User = {
            uid: firebaseUser.uid,
            displayName: displayName,
            email: firebaseUser.email,
            isAdmin: isAdmin
          };
          
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
          localStorage.removeItem('user');
        }
      } else {
        // User is signed out
        setUser(null);
        localStorage.removeItem('user');
      }
      setIsLoading(false);
    });

    return unsubscribe;
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
      throw error; // Re-throw to handle in the component
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create the user document
      await setDoc(doc(db, "users", user.uid), { 
        name, 
        email, 
        points: 0, 
        inventory: [], 
        isAdmin: false 
      });

      // Sign out the user to prevent auto-login
      await auth.signOut();
      
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create account' };
    }
  };

  const value = {
    user,
    login,
    logout,
    signup,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};