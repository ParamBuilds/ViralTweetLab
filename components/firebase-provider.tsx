'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserData {
  uid: string;
  email: string;
  role: 'user' | 'admin';
  subscriptionTier: 'free' | 'pro';
  tweetsGenerated: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  refreshUserData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user exists in Firestore, if not create them
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          const newUserData: UserData = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            role: 'user',
            subscriptionTier: 'free',
            tweetsGenerated: 0,
            createdAt: new Date().toISOString(),
          };
          await setDoc(docRef, newUserData);
          setUserData(newUserData);
        } else {
          setUserData(docSnap.data() as UserData);
        }

        // Handle public profile
        const publicProfileRef = doc(db, 'public_profiles', currentUser.uid);
        const publicProfileSnap = await getDoc(publicProfileRef);
        
        if (!publicProfileSnap.exists()) {
          await setDoc(publicProfileRef, {
            uid: currentUser.uid,
            displayName: currentUser.displayName || 'Anonymous',
            photoURL: currentUser.photoURL || '',
            totalTweets: 0,
            lastActive: new Date().toISOString()
          });
        } else {
          // Update last active and profile info
          await setDoc(publicProfileRef, {
            displayName: currentUser.displayName || 'Anonymous',
            photoURL: currentUser.photoURL || '',
            lastActive: new Date().toISOString()
          }, { merge: true });
        }

        // Setup real-time listener for user data
        unsubscribeSnapshot = onSnapshot(docRef, (doc) => {
          if (doc.exists()) {
            setUserData(doc.data() as UserData);
          }
        });

      } else {
        setUserData(null);
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const refreshUserData = async () => {
    // No longer needed since we use onSnapshot, but keeping for interface compatibility
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}
