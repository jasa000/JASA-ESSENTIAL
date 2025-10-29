
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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

export const updateUserRole = async (uid: string, role: UserProfile['role']): Promise<void> => {
  try {
    const userDoc = doc(db, 'users', uid);
    await updateDoc(userDoc, { role });
  } catch (error) {
    console.error("Error updating user role: ", error);
    throw new Error("Failed to update user role.");
  }
};
