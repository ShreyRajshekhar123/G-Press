// src/pages/SearchPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import NewsFeed from "../components/NewsFeed";
// import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import { FaBars, FaTimes } from "react-icons/fa"; // Import icons for toggle button

export default function SearchPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // State for the search input
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Effect to listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        console.log("Firebase user detected on SearchPage:", user.uid);
      } else {
        setCurrentUser(null);
        navigate("/"); // Redirect to login if not authenticated
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, [navigate]);

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

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // No specific active tab for the search page in the NewsFeed logic
  // We'll just pass `searchTerm` directly to NewsFeed.

  if (loadingUser) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        Loading user data...
      </div>
    );
  }

  const userId = currentUser ? currentUser.uid : null;
  // Note: userBookmarks and onBookmarkToggleSuccess won't be explicitly handled here
  // as NewsFeed will manage its own internal state/prop for that when a search is active.
  // We don't fetch all user bookmarks on this page, but individual NewsCard components
  // can still update/remove if passed a minimal bookmark list (even if empty initially).

  // For `userBookmarks`, we can either fetch it here or simply pass an empty array,
  // relying on `NewsCard` to handle bookmark state on its own if not present in this prop.
  // For simplicity, let's pass an empty array, and ensure NewsCard handles it gracefully.
  // A better solution for bookmarks in search results would be to add a `isBookmarked` flag
  // to the articles returned from the backend, but for now, NewsCard can check its own state.

  return (
    <div className="flex bg-gray-900 min-h-screen">
      {/* <Navbar /> */}

      <Sidebar
        activeTab="search" // Highlight search in sidebar if needed (or just don't highlight)
        setActiveTab={() => {}} // No tab changes from search page sidebar
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      <div
        className={`flex-grow p-6 text-white transition-all duration-300 ease-in-out mt-16 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">🔍 Search News</h1>
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
          Type your keywords below to search across all news sources and
          categories.
        </p>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search news by keyword, category, or source..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {userId ? (
          <NewsFeed
            mainActiveTab="search" // Indicate this is a search context
            userId={userId}
            userBookmarks={[]} // Pass empty, NewsCard will manage its own state
            onBookmarkToggleSuccess={() => {
              /* no-op for search page for now */
            }}
            searchTerm={searchTerm} // Pass the search term
            currentUser={currentUser}
          />
        ) : (
          <p className="text-white text-center text-xl pt-10">
            Please log in to use the search functionality.
          </p>
        )}
      </div>
    </div>
  );
}
