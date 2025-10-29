
import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { Shop } from './types';

const shopsCollection = collection(db, 'shops');

// Add a new shop
export const addShop = async (data: Omit<Shop, 'id' | 'createdAt' | 'ownerName'>): Promise<string> => {
  try {
    const docRef = await addDoc(shopsCollection, {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding shop: ", error);
    throw new Error("Failed to add shop.");
  }
};

// Get all shops
export const getShops = async (): Promise<Shop[]> => {
  try {
    const q = query(shopsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shop));
  } catch (error) {
    console.error("Error getting shops: ", error);
    throw new Error("Failed to fetch shops.");
  }
};

// Update a shop
export const updateShop = async (id: string, data: Partial<Omit<Shop, 'id' | 'createdAt' | 'ownerName'>>): Promise<void> => {
  try {
    const shopDoc = doc(db, 'shops', id);
    await updateDoc(shopDoc, data);
  } catch (error) {
    console.error("Error updating shop: ", error);
    throw new Error("Failed to update shop.");
  }
};

// Delete a shop
export const deleteShop = async (id: string): Promise<void> => {
  try {
    const shopDoc = doc(db, 'shops', id);
    await deleteDoc(shopDoc);
  } catch (error) {
    console.error("Error deleting shop: ", error);
    throw new Error("Failed to delete shop.");
  }
};
