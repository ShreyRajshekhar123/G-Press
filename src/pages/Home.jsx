// src/pages/Home.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { auth } from "../firebase"; // Correctly import auth from your firebase.js
import { onAuthStateChanged, signOut } from "firebase/auth"; // Import onAuthStateChanged
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NewsFeed from "../components/NewsFeed";
import { FaBars, FaTimes } from "react-icons/fa"; // Import icons for toggle button
import { toast } from "react-toastify"; // Import toast for user feedback

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [activeTab, setActiveTab] = useState("current-affairs"); // Initial tab
  const userId = currentUser ? currentUser.uid : null;
  const [userBookmarks, setUserBookmarks] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // State for search term

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Effect to listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        console.log("Firebase user detected:", user.uid);
      } else {
        setCurrentUser(null);
        // Only redirect if not already on the login page to prevent loop
        if (location.pathname !== "/") {
          navigate("/");
        }
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, [navigate, location.pathname]); // Add location.pathname to dependencies

  // Effect to set active tab from URL on load or path change
  useEffect(() => {
    const path = location.pathname.split("/");
    const tabFromUrl = path[path.length - 1];
    if (tabFromUrl && tabFromUrl !== "home" && tabFromUrl !== "") {
      setActiveTab(tabFromUrl);
      setSearchTerm(""); // Clear search term if a specific tab is navigated to
    } else {
      setActiveTab("current-affairs"); // Default if /home or / is accessed
      setSearchTerm(""); // Clear search term for default tab
    }
  }, [location.pathname]);

  const fetchUserBookmarks = useCallback(async () => {
    // Only attempt to fetch bookmarks if user is logged in and not still loading
    if (!userId || loadingUser) {
      console.log(
        "Skipping bookmark fetch: userId not available or user still loading."
      );
      setUserBookmarks([]); // Ensure bookmarks are empty if not logged in
      return;
    }
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(
        `http://localhost:5000/api/news/user/${userId}/bookmarks`,
        { headers: { Authorization: `Bearer ${token}`, "x-user-id": userId } }
      );
      setUserBookmarks(response.data || []); // Ensure it's an array
      console.log("Fetched user bookmarks in Home:", response.data);
    } catch (err) {
      console.error(
        "Error fetching user bookmarks in Home:",
        err.response ? err.response.data : err.message
      );
      toast.error("Failed to load your bookmarks."); // User feedback
      setUserBookmarks([]);
    }
  }, [userId, loadingUser, currentUser]); // currentUser as dependency because getIdToken needs it

  // This useEffect will run when `loadingUser` becomes false, or when `fetchUserBookmarks` changes
  useEffect(() => {
    if (!loadingUser) {
      // Once user loading is complete
      fetchUserBookmarks();
    }
  }, [loadingUser, fetchUserBookmarks]); // Ensure fetchUserBookmarks is a dependency

  // This callback is passed down to NewsFeed and then to NewsCard
  // When a bookmark is toggled, NewsCard calls this, which triggers a re-fetch of bookmarks.
  const handleBookmarkToggleSuccess = useCallback(() => {
    console.log("Bookmark toggle successful. Re-fetching user bookmarks...");
    fetchUserBookmarks(); // Re-fetch all bookmarks
  }, [fetchUserBookmarks]); // Dependency to ensure fresh fetchUserBookmarks is used

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setCurrentUser(null);
        setUserBookmarks([]); // Clear bookmarks on logout
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

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchTerm(""); // Clear search term when changing tabs
    // You might want to update the URL here if you want persistent tabs across refreshes
    // navigate(`/home/${tabName}`); // Example for URL update
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // When typing in search, clear the active tab to indicate search results
    setActiveTab(""); // Or a specific "search" tab name if you have one
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // The NewsFeed component will automatically re-fetch based on the searchTerm prop change
    // We set activeTab to an empty string or a special 'search' tab to reflect that we're searching.
    // If you want a dedicated 'search' tab state, set it here: setActiveTab("search");
  };

  if (loadingUser) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white text-2xl">
        Loading user data...
      </div>
    );
  }

  // If currentUser is null and not loading, redirect to login page (handled by useEffect)
  // We don't need a specific return here for null currentUser, as useEffect will navigate.

  return (
    <div className="flex bg-gray-900 min-h-screen">
      {/* You should ideally have a Navbar component imported and used here */}
      {/* <Navbar currentUser={currentUser} onLogout={handleLogout} /> */}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        currentUser={currentUser} // Pass currentUser to Sidebar if it needs user info
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

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto mb-8">
          <input
            type="text"
            placeholder="Search news by title or description..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button type="submit" className="hidden">
            Search
          </button>{" "}
          {/* Hidden submit button */}
        </form>

        {/* News Source Tabs */}
        <div className="flex space-x-4 mb-6 overflow-x-auto pb-2">
          <button
            className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap
                            ${
                              activeTab === "current-affairs"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
            onClick={() => handleTabChange("current-affairs")}
          >
            Current Affairs
          </button>
          <button
            className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap
                            ${
                              activeTab === "all"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
            onClick={() => handleTabChange("all")}
          >
            All News
          </button>
          {/* Map other newspaper source buttons */}
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
              {source
                .replace(/-/g, " ")
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </button>
          ))}
          {currentUser && ( // Only show Bookmarks tab if user is logged in
            <button
              className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap
                                ${
                                  activeTab === "bookmarks"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                }`}
              onClick={() => handleTabChange("bookmarks")}
            >
              Bookmarks ({userBookmarks.length}) {/* Display bookmark count */}
            </button>
          )}
        </div>

        {/* Conditional rendering for NewsFeed based on userId presence */}
        {userId ? (
          <NewsFeed
            key={activeTab + searchTerm} // Key for NewsFeed to re-mount/re-fetch on tab or search change
            mainActiveTab={activeTab}
            userId={userId}
            userBookmarks={userBookmarks} // This is the up-to-date list of bookmarks
            onBookmarkToggleSuccess={handleBookmarkToggleSuccess} // This triggers re-fetch in Home
            searchTerm={searchTerm}
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
