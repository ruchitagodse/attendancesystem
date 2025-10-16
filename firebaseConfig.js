import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBVSGmT465qa3yql0u4dZsnttDxH5DeOxY",
  authDomain: "attendance-f8f35.firebaseapp.com",
  projectId: "attendance-f8f35",
  storageBucket: "attendance-f8f35.appspot.com",
  messagingSenderId: "105395761052",
  appId: "1:105395761052:web:2e1c238654381db855a259",
  measurementId: "G-1YDQ3HQ081",
};

// ✅ Reuse existing app OR initialize once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Microsoft provider
const microsoftProvider = new OAuthProvider("microsoft.com");

export { auth, db, microsoftProvider, storage };
