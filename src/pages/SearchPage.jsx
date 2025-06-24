// src/pages/SearchPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import NewsFeed from "../components/NewsFeed";
import Sidebar from "../components/Sidebar";
import { FaBars, FaTimes, FaSearch, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";

export default function SearchPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [userBookmarks, setUserBookmarks] = useState([]);

  // Sidebar state: Open on desktop (md+), hidden on mobile by default
  // Initial state derived from window width for desktop, otherwise false (closed for mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  // Effect to adjust sidebar state on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true); // Always open on desktop
      } else {
        setIsSidebarOpen(false); // Default to closed on mobile
      }
    };

    // Set initial state based on current window size
    setIsSidebarOpen(window.innerWidth >= 768);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty dependency array means this runs once on mount

  const debounceTimeoutRef = React.useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        console.log("Firebase user detected on SearchPage:", user.uid);
      } else {
        setCurrentUser(null);
        navigate("/");
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const userId = currentUser ? currentUser.uid : null;

  // Fetch user bookmarks (needed for NewsCard bookmarking functionality)
  const fetchUserBookmarks = useCallback(async () => {
    if (!currentUser || loadingUser) {
      setUserBookmarks([]);
      return;
    }
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URI}api/news/bookmarks`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserBookmarks(response.data || []);
      console.log("User bookmarks fetched in SearchPage:", response.data);
    } catch (err) {
      console.error(
        "Error fetching user bookmarks in SearchPage:",
        err.response ? err.response.data : err.message
      );
      toast.error("Failed to load your bookmarks on search page.");
      setUserBookmarks([]);
    }
  }, [currentUser, loadingUser]);

  useEffect(() => {
    if (!loadingUser && currentUser) {
      fetchUserBookmarks();
    }
  }, [loadingUser, currentUser, fetchUserBookmarks]);

  const handleBookmarkToggleSuccess = useCallback(() => {
    console.log(
      "Bookmark toggle successful from SearchPage context, refetching bookmarks."
    );
    fetchUserBookmarks(); // Refetch bookmarks to update UI immediately
  }, [fetchUserBookmarks]);

  const fetchSearchResults = useCallback(async () => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      setSearchError(null);
      setLoadingSearch(false);
      return;
    }

    setLoadingSearch(true);
    setSearchError(null);
    try {
      // Ensure currentUser exists before attempting to get a token
      if (!currentUser) {
        console.warn(
          "Attempted to search without a current user. This should not happen if user is redirected."
        );
        setLoadingSearch(false);
        setSearchError("You must be logged in to search."); // More explicit error for UI
        return;
      }

      const token = await currentUser.getIdToken();
      // Headers must always include Authorization for a protected route
      const headers = { Authorization: `Bearer ${token}` };

      // --- ADD THESE LOGS FOR DEBUGGING ---
      const requestUrl = `${
        process.env.REACT_APP_BACKEND_URI
      }api/news/search?q=${encodeURIComponent(searchTerm)}`;
      console.log("Making search request to URL:", requestUrl);
      console.log(
        "With Authorization header:",
        `Bearer ${token ? "TOKEN_PRESENT" : "TOKEN_MISSING"}`
      );
      // --- END ADDED LOGS ---

      const response = await axios.get(requestUrl, { headers });
      setSearchResults(response.data.news || []);
      console.log("Search results fetched:", response.data.news);
      if (
        response.data.news &&
        response.data.news.length === 0 &&
        searchTerm.trim() !== ""
      ) {
        toast.info(`No results found for "${searchTerm}".`);
      }
    } catch (err) {
      console.error(
        "Error fetching search results:",
        err.response ? err.response.data : err.message,
        // --- ADD THIS LOG FOR DEBUGGING ---
        "Status Code:",
        err.response ? err.response.status : "N/A"
        // --- END ADDED LOG ---
      );
      setSearchError("Failed to fetch search results. Please try again.");
      toast.error("Failed to fetch search results.");
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }, [searchTerm, currentUser]); // Added currentUser to dependencies for token refresh

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchSearchResults();
    }, 500); // Debounce search by 500ms

    return () => {
      clearTimeout(debounceTimeoutRef.current);
    };
  }, [searchTerm, fetchSearchResults]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setCurrentUser(null);
        setUserBookmarks([]);
        navigate("/");
        toast.info("Logged out successfully.");
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
    setSearchResults([]);
    setSearchError(null);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  };

  // Function to handle tab changes from sidebar (copied from Home.jsx for consistency)
  const handleTabChange = (tabName) => {
    if (tabName === "current-affairs") {
      navigate(`/home`);
    } else if (tabName === "all" || tabName === "bookmarks") {
      navigate(`/news/${tabName}`);
    } else if (
      ["hindu", "hindustan-times", "toi", "ie", "dna"].includes(tabName)
    ) {
      navigate(`/news/${tabName}`);
    } else if (tabName === "search") {
      navigate(`/search`);
    } else if (tabName === "profile") {
      navigate(`/profile`);
    } else if (tabName === "settings-help") {
      navigate(`/settings-help`);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-app-bg-primary text-app-text-primary">
        <FaSpinner className="animate-spin text-app-blue-main text-4xl mr-4" />
        <p className="text-lg">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="flex bg-app-bg-primary min-h-screen">
      {/* Sidebar component */}
      <Sidebar
        activeTab="search" // Keep search active when on this page
        setActiveTab={handleTabChange} // Pass the navigation handler
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar} // Pass toggleSidebar to Sidebar for responsive closing
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <div
        className={`flex-grow p-6 text-app-text-primary transition-all duration-300 ease-in-out
                         ${isSidebarOpen ? "md:ml-64" : "md:ml-0"}`}
      >
        {/* NewsHub Dashboard Header: Copied directly from Home.jsx */}
        <div className="flex justify-between items-center p-6 bg-app-bg-primary sticky top-0 z-20 shadow-md">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-app-blue-main">
              📰 G-PRESS Dashboard
            </h1>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 text-app-text-primary text-2xl rounded-full hover:bg-app-bg-secondary focus:outline-none focus:ring-2 focus:ring-app-blue-main"
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Adjust top margin of content to account for sticky header */}
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full pt-8">
          {" "}
          {/* Added pt-8 for spacing below sticky header */}
          {/* Original Search section - now below the dashboard header */}
          <h1 className="text-3xl font-bold text-app-blue-main flex items-center mb-6">
            <FaSearch className="mr-3" /> Search News
          </h1>
          <p className="text-lg text-app-text-secondary mb-6">
            Type your keywords below to search across all news sources and
            categories.
          </p>
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search news by keyword, category, or source..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full p-3 pl-10 rounded-lg bg-app-bg-secondary border border-app-gray-border text-app-text-primary placeholder-app-placeholder focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Positioning the search icon inside the input field */}
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-app-placeholder" />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-app-placeholder hover:text-app-text-primary text-xl"
                aria-label="Clear search"
                title="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>
          {userId ? (
            loadingSearch ? (
              <div className="flex justify-center items-center h-40">
                <FaSpinner className="animate-spin text-app-blue-main text-4xl mr-4" />
                <p className="ml-4 text-app-blue-main text-lg">
                  Loading search results...
                </p>
              </div>
            ) : searchError ? (
              <div className="text-center text-red-500 text-xl pt-10">
                {searchError}
              </div>
            ) : searchTerm.trim() === "" ? (
              <div className="text-center text-app-text-secondary text-xl pt-10">
                Start typing to find news articles.
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center text-app-text-secondary text-xl pt-10">
                No articles found matching "{searchTerm}". Try different
                keywords.
              </div>
            ) : (
              <NewsFeed
                key={`search-${searchTerm}`}
                mainActiveTab="search"
                userId={userId}
                userBookmarks={userBookmarks}
                onBookmarkToggleSuccess={handleBookmarkToggleSuccess}
                searchTerm={searchTerm}
                currentUser={currentUser}
                newsData={searchResults}
              />
            )
          ) : (
            <p className="text-app-text-primary text-center text-xl pt-10">
              Please log in to use the search functionality.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
