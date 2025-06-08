import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NewsTabs from "../components/NewsFeed";
import { FaBars, FaTimes } from "react-icons/fa"; // Import icons for toggle button

export default function Home() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const userId = currentUser ? currentUser.uid : null;
  const [userBookmarks, setUserBookmarks] = useState([]);

  // NEW STATE: Manage sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Start open by default

  // Effect to listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        console.log("Firebase user detected:", user.uid);
      } else {
        setCurrentUser(null);
        console.log("Firebase user logged out.");
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserBookmarks = useCallback(async () => {
    if (!userId || loadingUser) {
      console.log(
        "Skipping bookmark fetch: userId not available or user still loading."
      );
      setUserBookmarks([]);
      return;
    }
    try {
      const response = await axios.get(
        `http://localhost:5000/api/news/user/${userId}/bookmarks`
      );
      setUserBookmarks(response.data || []);
      console.log("Fetched user bookmarks in Home:", response.data);
    } catch (err) {
      console.error(
        "Error fetching user bookmarks in Home:",
        err.response ? err.response.data : err.message
      );
      setUserBookmarks([]);
    }
  }, [userId, loadingUser]);

  useEffect(() => {
    if (!loadingUser) {
      fetchUserBookmarks();
    }
  }, [loadingUser, fetchUserBookmarks]);

  const handleBookmarkToggleSuccess = useCallback(() => {
    console.log("Bookmark toggle successful, re-fetching bookmarks...");
    fetchUserBookmarks();
  }, [fetchUserBookmarks]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setCurrentUser(null);
        navigate("/");
      })
      .catch((error) => {
        console.error("Logout Error:", error);
      });
  };

  // NEW: Function to toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
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
        isSidebarOpen={isSidebarOpen} // NEW PROP: Pass visibility state
        toggleSidebar={toggleSidebar} // NEW PROP: Pass toggle function
      />

      {/* Main Content Area */}
      <div
        className={`flex-grow p-6 text-white transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-64" : "ml-0" // Conditionally apply margin
        }`}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">
            📰 NewsHub Dashboard
          </h1>
          {/* NEW: Sidebar Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="p-2 text-white text-2xl rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        <p className="text-lg text-gray-300 mb-6">
          👋 Welcome! Select a navigation item from the sidebar or a news source
          tab.
        </p>
        {userId ? (
          <NewsTabs
            mainActiveTab={activeTab}
            userId={userId}
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
