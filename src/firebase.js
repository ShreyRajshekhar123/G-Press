// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // ✅ Add this
// import { getAnalytics } from "firebase/analytics"; // Optional

const firebaseConfig = {
  apiKey: "AIzaSyBmtAZX8dFZQpOyJl7Vpn7eDbCiIk_KIeI",
  authDomain: "g-press.firebaseapp.com",
  projectId: "g-press",
  storageBucket: "g-press.firebasestorage.app",
  messagingSenderId: "700092747776",
  appId: "1:700092747776:web:3a55bc9e9c72f91b1f88e5",
  measurementId: "G-FJTGQFCY85",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // ✅ Initialize auth

export { app, auth }; // ✅ Export both
