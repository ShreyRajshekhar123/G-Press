// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth"; // Import signOut from firebase/auth
import { getFirestore } from "firebase/firestore"; // Import getFirestore for database access

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID, // Keep this if you use it
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
// Export it if you intend to use Firestore in other parts of your app
export const db = getFirestore(app);

// Export signOut directly from here so other components can import it
export { signOut }; // <-- This line makes signOut available for import

// Export the app instance if needed elsewhere
export { app };
