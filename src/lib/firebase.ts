// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAsWv9ZK50xQ1mSZm42dYnORoMS79aCiMY",
  authDomain: "studio-8473300000-73d0f.firebaseapp.com",
  projectId: "studio-8473300000-73d0f",
  storageBucket: "studio-8473300000-73d0f.firebasestorage.app",
  messagingSenderId: "713659587319",
  appId: "1:713659587319:web:e9b15f7a7464f3a78051f2"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
