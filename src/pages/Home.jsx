import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { auth } from "../firebase"; // Import auth directly from your firebase.js
import { onAuthStateChanged, signOut } from "firebase/auth"; // Import onAuthStateChanged
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NewsTabs from "../components/NewsFeed";

export default function Home() {
  const navigate = useNavigate();
  // State to hold the Firebase user object
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true); // New state to track if user is being loaded

  const [activeTab, setActiveTab] = useState("all");
  // userId will now be derived from currentUser.uid
  const userId = currentUser ? currentUser.uid : null;
  const [userBookmarks, setUserBookmarks] = useState([]);

  // Effect to listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        setCurrentUser(user);
        console.log("Firebase user detected:", user.uid);
      } else {
        // User is signed out
        setCurrentUser(null);
        console.log("Firebase user logged out.");
      }
      setLoadingUser(false); // User loading is complete
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs once on mount

  // Function to fetch the raw user bookmarks list
  const fetchUserBookmarks = useCallback(async () => {
    // Only attempt to fetch if userId is available and not still loading user
    if (!userId || loadingUser) {
      console.log(
        "Skipping bookmark fetch: userId not available or user still loading."
      );
      setUserBookmarks([]); // Ensure bookmarks are empty if no user or user still loading
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:5000/api/news/user/${userId}/bookmarks`
      );
      setUserBookmarks(response.data || []);
      console.log("Fetched user bookmarks in Home:", response.data); // DEBUG: Confirm data
    } catch (err) {
      console.error(
        "Error fetching user bookmarks in Home:",
        err.response ? err.response.data : err.message
      );
      setUserBookmarks([]);
    }
  }, [userId, loadingUser]); // Dependency array: re-create if userId or loadingUser changes

  // Effect to fetch user bookmarks when the userId becomes available (after Firebase auth state changes)
  useEffect(() => {
    if (!loadingUser) {
      // Only try to fetch once user loading is complete
      fetchUserBookmarks();
    }
  }, [loadingUser, fetchUserBookmarks]); // Dependency array: re-run if loadingUser state or fetchUserBookmarks callback changes

  const handleBookmarkToggleSuccess = useCallback(() => {
    console.log("Bookmark toggle successful, re-fetching bookmarks...");
    fetchUserBookmarks(); // Re-fetch all bookmarks to update the state
  }, [fetchUserBookmarks]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setCurrentUser(null); // Clear user state on logout
        navigate("/");
      })
      .catch((error) => {
        console.error("Logout Error:", error);
      });
  };

  if (loadingUser) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        Loading user data...
      </div>
    );
  }

  return (
    <div className="flex bg-gray-900 min-h-screen">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <div className="flex-grow ml-64 p-6 text-white">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">
            📰 NewsHub Dashboard
          </h1>
        </div>
        <p className="text-lg text-gray-300 mb-6">
          👋 Welcome! Select a navigation item from the sidebar or a news source
          tab.
        </p>
        {userId ? ( // Render NewsTabs only if userId is available (user is logged in)
          <NewsTabs
            mainActiveTab={activeTab}
            userId={userId} // Pass the real Firebase UID
            userBookmarks={userBookmarks}
            onBookmarkToggleSuccess={handleBookmarkToggleSuccess}
          />
        ) : (
          <p className="text-white text-center text-xl">
            Please log in to view personalized news and bookmarks.
          </p>
        )}
      </div>
    </div>
  );
}
