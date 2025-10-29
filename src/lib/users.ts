
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
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
