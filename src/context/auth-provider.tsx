

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

type AuthContextType = {
  user: (User & UserProfile) | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

const generateShortId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<(User & UserProfile) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubscribeSnapshot = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const userProfile = docSnap.data() as UserProfile;
            
            // Check if shortId exists, if not, create and update it.
            if (!userProfile.shortId) {
              const newShortId = generateShortId();
              try {
                await updateDoc(userDocRef, { shortId: newShortId });
                setUser({ ...firebaseUser, ...userProfile, shortId: newShortId });
              } catch (e) {
                console.error("Failed to update user with shortId", e);
                setUser({ ...firebaseUser, ...userProfile });
              }
            } else {
              setUser({ ...firebaseUser, ...userProfile });
            }

          } else {
            // This case handles users created via auth but without a firestore doc yet
            // e.g. some edge cases with Google Sign-in on first try.
            const newShortId = generateShortId();
            const newUserProfile: UserProfile = {
              uid: firebaseUser.uid,
              shortId: newShortId,
              name: firebaseUser.displayName || 'New User',
              email: firebaseUser.email || '',
              roles: ['user'],
              createdAt: new Date(),
            };
            try {
              await setDoc(userDocRef, newUserProfile);
              setUser({ ...firebaseUser, ...newUserProfile });
            } catch (error) {
              console.error("Failed to create user document:", error);
              setUser(firebaseUser as (User & UserProfile));
            }
          }
          setLoading(false);
        });

        // Return a cleanup function for the snapshot listener
        return () => unsubscribeSnapshot();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Return a cleanup function for the auth state listener
    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
