import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NewsTabs from "../components/NewsFeed"; // Renamed from NewsFeed/NewsTabs

export default function Home() {
  const navigate = useNavigate();
  // activeTab here will only be 'all' or 'bookmarks' as controlled by the sidebar
  const [activeTab, setActiveTab] = useState("all"); // Default to "All News" from sidebar
  const [userId] = useState("defaultUser"); // Hardcoded userId for now
  const [userBookmarks, setUserBookmarks] = useState([]); // State for user's raw bookmarks

  // Function to fetch the raw user bookmarks list
  const fetchUserBookmarks = useCallback(async () => {
    try {
      const response = await axios.get(
        // === FIX IS ON THIS LINE ===
        `http://localhost:5000/api/news/user/${userId}/bookmarks` // Corrected endpoint
      );
      // Assuming your backend responds with { bookmarkedArticles: [...] }
      // The backend now sends an array of articles directly for this route, not an object with bookmarkedArticles
      setUserBookmarks(response.data || []); // Directly use response.data as it's an array of articles
    } catch (err) {
      console.error("Error fetching user bookmarks in Home:", err);
      // In a real app, you might show a notification to the user
    }
  }, [userId]); // Dependency array: re-create if userId changes

  // Effect to fetch user bookmarks on component mount and whenever fetchUserBookmarks updates
  useEffect(() => {
    fetchUserBookmarks();
  }, [fetchUserBookmarks]); // Dependency array: re-run if fetchUserBookmarks callback changes

  // Callback function to re-fetch bookmarks after a toggle in NewsCard
  const handleBookmarkToggleSuccess = useCallback(() => {
    console.log("Bookmark toggle successful, re-fetching bookmarks...");
    fetchUserBookmarks(); // Re-fetch all bookmarks to update the state
    // NewsTabs's useEffect for mainActiveTab and activeSubTab will handle re-fetching relevant news
  }, [fetchUserBookmarks]);

  const handleLogout = () => {
    signOut(auth).then(() => navigate("/"));
  };

  return (
    <div className="flex bg-gray-900 min-h-screen">
      {/* Sidebar component */}
      <Sidebar
        activeTab={activeTab} // Pass activeTab state down
        setActiveTab={setActiveTab} // Pass setter function down
        onLogout={handleLogout}
      />

      {/* Main content area, offset by sidebar width */}
      <div className="flex-grow ml-64 p-6 text-white">
        {" "}
        {/* ml-64 to push content right of fixed sidebar */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">
            📰 NewsHub Dashboard
          </h1>
        </div>
        <p className="text-lg text-gray-300 mb-6">
          👋 Welcome! Select a navigation item from the sidebar or a news source
          tab.
        </p>
        {/* NewsTabs will now handle its own sub-tabs if activeTab is "all" */}
        <NewsTabs
          mainActiveTab={activeTab} // Pass the main active tab from sidebar to NewsTabs
          userId={userId} // Pass userId for bookmarking
          userBookmarks={userBookmarks} // Pass current user bookmarks for NewsCard
          onBookmarkToggleSuccess={handleBookmarkToggleSuccess} // Pass callback
        />
      </div>
    </div>
  );
}
