// src/pages/Home.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NewsFeed from "../components/NewsFeed";
import { FaBars, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [activeTab, setActiveTab] = useState("all"); // Default to 'all' or 'current-affairs' for initial load if no URL tab
  const userId = currentUser ? currentUser.uid : null;
  const [userBookmarks, setUserBookmarks] = useState([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Effect to listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        console.log("Firebase user detected:", user.uid);
      } else {
        setCurrentUser(null);
        if (location.pathname !== "/") {
          navigate("/");
        }
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, [navigate, location.pathname]);

  // Effect to set active tab from URL on load or path change
  useEffect(() => {
    const pathSegments = location.pathname.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];

    // Check if the last segment is one of your news sources
    const newsSources = [
      "all",
      "current-affairs",
      "hindu",
      "hindustan-times",
      "toi",
      "ie",
      "dna",
      "bookmarks",
    ];

    if (newsSources.includes(lastSegment)) {
      setActiveTab(lastSegment);
    } else {
      // Default to 'all' or 'current-affairs' if no specific tab in URL
      setActiveTab("all"); // Or "current-affairs" based on your preference
    }
  }, [location.pathname]);

  const fetchUserBookmarks = useCallback(async () => {
    if (!userId || loadingUser) {
      console.log(
        "Skipping bookmark fetch: userId not available or user still loading."
      );
      setUserBookmarks([]);
      return;
    }
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(
        `http://localhost:5000/api/news/user/${userId}/bookmarks`,
        { headers: { Authorization: `Bearer ${token}`, "x-user-id": userId } }
      );
      setUserBookmarks(response.data || []);
      console.log("Fetched user bookmarks in Home:", response.data);
    } catch (err) {
      console.error(
        "Error fetching user bookmarks in Home:",
        err.response ? err.response.data : err.message
      );
      toast.error("Failed to load your bookmarks.");
      setUserBookmarks([]);
    }
  }, [userId, loadingUser, currentUser]);

  useEffect(() => {
    if (!loadingUser) {
      fetchUserBookmarks();
    }
  }, [loadingUser, fetchUserBookmarks]);

  const handleBookmarkToggleSuccess = useCallback(() => {
    console.log("Bookmark toggle successful. Re-fetching user bookmarks...");
    fetchUserBookmarks();
  }, [fetchUserBookmarks]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setCurrentUser(null);
        setUserBookmarks([]);
        navigate("/");
      })
      .catch((error) => {
        console.error("Logout Error:", error);
        toast.error("Logout failed. Please try again.");
      });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // handleTabChange will now primarily be used by the Sidebar to set the active tab.
  // It will be passed down to Sidebar component.
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    // If you want to update the URL based on sidebar clicks:
    // navigate(`/home/${tabName}`);
  };

  if (loadingUser) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white text-2xl">
        Loading user data...
      </div>
    );
  }

  return (
    <div className="flex bg-gray-900 min-h-screen">
      <Sidebar
        activeTab={activeTab} // Pass activeTab to Sidebar
        setActiveTab={handleTabChange} // Pass handler to Sidebar
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        currentUser={currentUser}
      />
      <div
        className={`flex-grow p-6 text-white transition-all duration-300 ease-in-out mt-16 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">
            📰 NewsHub Dashboard
          </h1>
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
          👋 Welcome
          {currentUser?.displayName ? `, ${currentUser.displayName}` : ""}!
          Select a navigation item from the sidebar or a news source tab.
        </p>

        {/* REMOVED: Search Input Form (already done) */}

        {/* News Source Tabs - ONLY KEEP NEWSPAPER-SPECIFIC TABS HERE */}
        <div className="flex space-x-4 mb-6 overflow-x-auto pb-2">
          {/* Removed "Current Affairs", "All News", "Bookmarks" */}
          {["hindu", "hindustan-times", "toi", "ie", "dna"].map((source) => (
            <button
              key={source}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap
                                ${
                                  activeTab === source
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                }`}
              onClick={() => handleTabChange(source)}
            >
              {/* Convert source name for display (e.g., "hindu" -> "The Hindu") */}
              {source
                .replace(/-/g, " ")
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")
                .replace("Toi", "Times of India")
                .replace("Ie", "Indian Express")
                .replace("Dna", "DNA India")}
            </button>
          ))}
        </div>

        {/* NewsFeed component */}
        {userId ? (
          <NewsFeed
            key={activeTab} // Key now only depends on activeTab
            mainActiveTab={activeTab} // This will be "all", "bookmarks", or a specific newspaper name
            userId={userId}
            userBookmarks={userBookmarks}
            onBookmarkToggleSuccess={handleBookmarkToggleSuccess}
            searchTerm={""} // Always empty in Home.jsx, search is handled by dedicated SearchPage
            currentUser={currentUser}
          />
        ) : (
          <p className="text-white text-center text-xl pt-10">
            Please log in to view personalized news and bookmarks.
          </p>
        )}
      </div>
    </div>
  );
}
