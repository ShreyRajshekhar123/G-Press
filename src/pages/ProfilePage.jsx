import React, { useState, useEffect } from "react";
import { auth } from "../firebase"; // Assuming your firebase config is here
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { FaArrowLeft } from "react-icons/fa"; // Import a back arrow icon

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate(); // Initialize navigate hook

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoBack = () => {
    navigate(-1); // Go back one step in the history
  };

  if (loadingUser) {
    return (
      // Updated loading screen background and text
      <div className="flex justify-center items-center min-h-screen bg-app-bg-primary text-app-text-primary text-2xl">
        Loading profile...
      </div>
    );
  }

  return (
    // Updated main container background and text
    <div className="flex-1 flex flex-col items-center justify-center bg-app-bg-primary text-app-text-primary p-6">
      {/* Updated card background and text */}
      <div className="bg-app-bg-secondary p-8 rounded-lg shadow-xl max-w-lg w-full text-center relative">
        {" "}
        {/* Added relative for positioning */}
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          // Updated button colors
          className="absolute top-4 left-4 p-2 rounded-full hover:bg-app-bg-secondary text-app-text-primary focus:outline-none focus:ring-2 focus:ring-app-blue-main"
          aria-label="Go back"
          title="Go back"
        >
          <FaArrowLeft className="text-2xl" />
        </button>
        {/* Updated title color */}
        <h2 className="text-4xl font-bold text-app-blue-main mb-6">
          Your Profile
        </h2>
        {currentUser ? (
          <div className="space-y-4">
            <p className="text-xl">
              <strong>Name:</strong> {currentUser.displayName || "Not set"}
            </p>
            <p className="text-xl">
              <strong>Email:</strong> {currentUser.email || "Not set"}
            </p>
            {currentUser.emailVerified && (
              <p className="text-green-400">Email Verified</p>
            )}
            {/* Updated UID text color */}
            <p className="text-md text-app-text-secondary">
              UID: {currentUser.uid}
            </p>
            {/* Add more profile fields here (e.g., photoURL, lastSignInTime) */}
            {currentUser.photoURL && (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto mt-4 border-2 border-app-blue-main"
              />
            )}
          </div>
        ) : (
          <p className="text-xl">Please log in to view your profile details.</p>
        )}
      </div>
    </div>
  );
}
