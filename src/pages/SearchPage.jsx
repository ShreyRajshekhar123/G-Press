// src/pages/SearchPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios"; // Make sure axios is imported
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import NewsFeed from "../components/NewsFeed";
import Sidebar from "../components/Sidebar";
import { FaBars, FaTimes, FaSearch } from "react-icons/fa"; // Import FaSearch for the title
import { toast } from "react-toastify"; // Import toast for user feedback

export default function SearchPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]); // State to store search results
  const [loadingSearch, setLoadingSearch] = useState(false); // Loading state for search API call
  const [searchError, setSearchError] = useState(null); // Error state for search API call
  const [userBookmarks, setUserBookmarks] = useState([]); // Needed for NewsFeed to show bookmark status

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

  const userId = currentUser ? currentUser.uid : null;

  // Fetch user bookmarks for NewsFeed components
  const fetchUserBookmarks = useCallback(async () => {
    if (!userId || loadingUser) {
      console.log(
        "Skipping bookmark fetch on SearchPage: userId not available or user still loading."
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
      console.log("Fetched user bookmarks in SearchPage:", response.data);
    } catch (err) {
      console.error(
        "Error fetching user bookmarks in SearchPage:",
        err.response ? err.response.data : err.message
      );
      toast.error("Failed to load your bookmarks on search page.");
      setUserBookmarks([]);
    }
  }, [userId, loadingUser, currentUser]);

  useEffect(() => {
    if (!loadingUser) {
      fetchUserBookmarks();
    }
  }, [loadingUser, fetchUserBookmarks]);

  // Callback for when a bookmark is toggled in NewsCard
  const handleBookmarkToggleSuccess = useCallback(() => {
    console.log(
      "Bookmark toggle successful on SearchPage. Re-fetching bookmarks..."
    );
    fetchUserBookmarks(); // Re-fetch to update the bookmark status
  }, [fetchUserBookmarks]);

  // Function to fetch search results based on searchTerm
  const fetchSearchResults = useCallback(async () => {
    if (searchTerm.trim() === "") {
      setSearchResults([]); // Clear results if search term is empty
      setSearchError(null); // Clear any previous error
      setLoadingSearch(false); // Ensure loading is off
      return; // Don't make API call for empty search
    }

    setLoadingSearch(true);
    setSearchError(null); // Clear previous errors
    try {
      const token = currentUser ? await currentUser.getIdToken() : null;
      const headers = token
        ? { Authorization: `Bearer ${token}`, "x-user-id": userId }
        : {};

      const response = await axios.get(
        `http://localhost:5000/api/news/search?q=${encodeURIComponent(
          searchTerm
        )}`,
        { headers }
      );
      setSearchResults(response.data);
    } catch (err) {
      console.error(
        "Error fetching search results:",
        err.response ? err.response.data : err.message
      );
      setSearchError("Failed to fetch search results. Please try again.");
      toast.error("Failed to fetch search results.");
      setSearchResults([]); // Clear results on error
    } finally {
      setLoadingSearch(false);
    }
  }, [searchTerm, currentUser, userId]); // Dependencies for useCallback

  // Effect to trigger search when searchTerm changes (with debounce)
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSearchResults();
    }, 500); // Debounce search for 500ms

    return () => {
      clearTimeout(handler); // Cleanup the timeout if searchTerm changes before 500ms
    };
  }, [searchTerm, fetchSearchResults]); // Re-run effect if searchTerm or fetchSearchResults changes

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setCurrentUser(null);
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults([]); // Clear displayed results
    setSearchError(null); // Clear any errors
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
        activeTab="search" // Always highlight 'search' tab in sidebar when on this page
        setActiveTab={() => {}} // No tab changes from search page sidebar
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
          <h1 className="text-3xl font-bold text-blue-400 flex items-center">
            <FaSearch className="mr-3" /> Search News
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
          Type your keywords below to search across all news sources and
          categories.
        </p>

        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search news by keyword, category, or source..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && ( // Show clear button only if searchTerm is not empty
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xl"
              aria-label="Clear search"
              title="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Conditional rendering for search results/messages */}
        {userId ? (
          loadingSearch ? (
            <div className="text-center text-blue-400 text-xl pt-10">
              Loading search results...
            </div>
          ) : searchError ? (
            <div className="text-center text-red-500 text-xl pt-10">
              {searchError}
            </div>
          ) : searchTerm.trim() === "" ? ( // User has not typed anything
            <div className="text-center text-gray-400 text-xl pt-10">
              Start typing to find news articles.
            </div>
          ) : searchResults.length === 0 ? ( // Search performed, no results
            <div className="text-center text-gray-400 text-xl pt-10">
              No articles found matching "{searchTerm}". Try different keywords.
            </div>
          ) : (
            // Search performed, results found
            <NewsFeed
              key={searchTerm} // Key for NewsFeed to re-mount/re-render when search term changes
              mainActiveTab="search" // Indicate this is a search context (for NewsFeed's internal logic)
              userId={userId}
              userBookmarks={userBookmarks} // Pass bookmarks for NewsCard status
              onBookmarkToggleSuccess={handleBookmarkToggleSuccess}
              searchTerm={searchTerm} // Pass the search term
              currentUser={currentUser}
              newsData={searchResults} // Pass the fetched search results here
            />
          )
        ) : (
          <p className="text-white text-center text-xl pt-10">
            Please log in to use the search functionality.
          </p>
        )}
      </div>
    </div>
  );
}
