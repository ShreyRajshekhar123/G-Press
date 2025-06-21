// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { auth } from "../firebase"; // Assuming your firebase config is here
import { useAuthState } from "react-firebase-hooks/auth"; // You'll need to install this package

const PrivateRoute = () => {
  const [user, loading, error] = useAuthState(auth); // Hook to get Firebase auth state

  if (loading) {
    // While checking auth state, show a loading indicator
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white text-2xl">
        Checking authentication...
      </div>
    );
  }

  if (error) {
    // Handle error, e.g., display a message
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-red-500 text-2xl">
        Error: {error.message}
      </div>
    );
  }

  // If user is logged in, render the child routes (Outlet)
  // Otherwise, redirect to the login page (or wherever you want unauthenticated users to go)
  return user ? <Outlet /> : <Navigate to="/" replace />;
};

export default PrivateRoute;
