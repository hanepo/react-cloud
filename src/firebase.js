// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

/*
  Replace these values if your Firebase console shows different ones.
  Note: storageBucket often looks like "cloud-fs-dev.appspot.com".
*/
const firebaseConfig = {
  apiKey: "AIzaSyDShyevTrCPPyRYGXLGCGilLCUNndeoWX0",
  authDomain: "cloud-fs-dev.firebaseapp.com",
  projectId: "cloud-fs-dev",
  storageBucket: "cloud-fs-dev.firebasestorage.app", // check console; replace with PROJECT_ID.appspot.com if needed
  messagingSenderId: "125926435547",
  appId: "1:125926435547:web:27a723fac7074b91a8fafe",
  measurementId: "G-ZJBP8LE2NP"
};

// Initialize
const app = initializeApp(firebaseConfig);

// Analytics may throw in non-browser or blocked envs — guard it
let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // ignore in dev or non-compatible browsers
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
