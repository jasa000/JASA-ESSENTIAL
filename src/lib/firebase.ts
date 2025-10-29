// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCNzaRhZ9GOtfiVHC4fvhSL6m7rGT7zSWg",
  authDomain: "jasa-booking.firebaseapp.com",
  projectId: "jasa-booking",
  storageBucket: "jasa-booking.firebasestorage.app",
  messagingSenderId: "588977017789",
  appId: "1:588977017789:web:6cb32557fe40a6db9db8d4",
  measurementId: "G-TWSSVNRRCL"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
