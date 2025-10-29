
import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { Post } from './types';

const postsCollection = collection(db, 'posts');

// Add a new post
export const addPost = async (content: string, authorId: string): Promise<string> => {
  try {
    const docRef = await addDoc(postsCollection, {
      content,
      authorId,
      isActive: false, // Default to inactive
      createdAt: Date.now(), // Simple timestamp
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Failed to add post.");
  }
};

// Get all posts
export const getPosts = async (): Promise<Post[]> => {
  try {
    const q = query(postsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  } catch (error) {
    console.error("Error getting documents: ", error);
    throw new Error("Failed to fetch posts.");
  }
};

// Update a post
export const updatePost = async (id: string, data: Partial<Post>): Promise<void> => {
  try {
    const postDoc = doc(db, 'posts', id);
    await updateDoc(postDoc, data);
  } catch (error) {
    console.error("Error updating document: ", error);
    throw new Error("Failed to update post.");
  }
};

// Delete a post
export const deletePost = async (id: string): Promise<void> => {
  try {
    const postDoc = doc(db, 'posts', id);
    await deleteDoc(postDoc);
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw new Error("Failed to delete post.");
  }
};

    