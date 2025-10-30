
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, query, where, arrayUnion } from 'firebase/firestore';
import type { UserProfile } from './types';

const usersCollection = collection(db, 'users');

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const querySnapshot = await getDocs(usersCollection);
    return querySnapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
  } catch (error) {
    console.error("Error getting users: ", error);
    throw new Error("Failed to fetch users.");
  }
};

export const getSellers = async (): Promise<UserProfile[]> => {
  try {
    const q = query(usersCollection, where("role", "==", "seller"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
  } catch (error) {
    console.error("Error getting sellers: ", error);
    throw new Error("Failed to fetch sellers.");
  }
};

export const updateUserRole = async (uid: string, role: UserProfile['role']): Promise<void> => {
  try {
    const userDoc = doc(db, 'users', uid);
    await updateDoc(userDoc, { role });
  } catch (error) {
    console.error("Error updating user role: ", error);
    throw new Error("Failed to update user role.");
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  try {
    const userDoc = doc(db, 'users', uid);
    
    // Firestore's arrayUnion is better for adding items to an array
    // but it doesn't work well with an array of objects without a unique ID.
    // For simplicity, we'll just overwrite the array. If you need to merge,
    // you would fetch the doc, merge arrays in code, and then update.
    // However, since we are passing the whole array from the client, a simple update is fine.
    await updateDoc(userDoc, data);

  } catch (error) {
    console.error("Error updating user profile: ", error);
    throw new Error("Failed to update user profile.");
  }
};

    