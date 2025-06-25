// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase"; // Assuming your Firebase auth instance is exported from firebase.js

// Create the Auth Context
const AuthContext = createContext({
  currentUser: null,
  loadingUser: true, // Indicates if Firebase auth state is still loading
});

// Create a custom hook to use the Auth Context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    // This listener runs whenever the user's sign-in state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingUser(false); // Auth state has been determined
      console.log(
        "[AuthContext] Firebase auth state changed. User:",
        user ? user.uid : "null"
      );
    });

    // Cleanup subscription on unmount to prevent memory leaks
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount

  const value = {
    currentUser,
    loadingUser,
  };

  // Only render children when authentication state is determined
  if (loadingUser) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-app-bg-primary text-app-text-primary text-2xl">
        Initializing authentication...
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
