

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import type { UserProfile, UserRole } from '@/lib/types';

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
            let userProfile = docSnap.data() as UserProfile & { role?: string }; // Allow old 'role' field
            let needsUpdate = false;
            
            // --- Migration Logic ---
            // 1. Check for old 'role' string and migrate to 'roles' array
            if (userProfile.role && typeof userProfile.role === 'string') {
              userProfile.roles = ['user'];
              if (userProfile.role !== 'user') {
                userProfile.roles.push(userProfile.role as UserRole);
              }
              delete userProfile.role; // Remove old field
              needsUpdate = true;
            }

            // 2. Ensure 'roles' is an array and contains 'user'
            if (!Array.isArray(userProfile.roles)) {
              userProfile.roles = ['user'];
              needsUpdate = true;
            } else if (!userProfile.roles.includes('user')) {
              userProfile.roles.push('user');
              needsUpdate = true;
            }

            // 3. Ensure shortId exists
            if (!userProfile.shortId) {
              userProfile.shortId = generateShortId();
              needsUpdate = true;
            }
            
            // 4. If any migration happened, update the DB
            if (needsUpdate) {
              try {
                await updateDoc(userDocRef, {
                  roles: userProfile.roles,
                  shortId: userProfile.shortId,
                  role: undefined // Ensure old 'role' field is removed
                });
              } catch (e) {
                console.error("Failed to migrate user profile:", e);
              }
            }
            
            setUser({ ...firebaseUser, ...userProfile });

          } else {
            // This case handles users created via auth but without a firestore doc yet
            const newUserProfile: UserProfile = {
              uid: firebaseUser.uid,
              shortId: generateShortId(),
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
