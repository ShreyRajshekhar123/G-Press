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

  const [activeTab, setActiveTab] = useState("all");
  const userId = currentUser ? currentUser.uid : null;
  const [userBookmarks, setUserBookmarks] = useState([]);

  // Sidebar state: Open on desktop (md+), hidden on mobile by default
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  // Effect to adjust sidebar state on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        if (!isSidebarOpen && window.innerWidth < 768) {
          setIsSidebarOpen(true);
        }
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarOpen]);

  // Effect to listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const token = await user.getIdToken();
          await axios.post(
            `${process.env.REACT_APP_BACKEND_URI}api/news/sync-user`,
            {
              displayName: user.displayName,
              email: user.email,
              firebaseUid: user.uid,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (syncError) {
          console.error(
            `Error syncing user ${user.uid} with backend:`,
            syncError.response?.data || syncError.message
          );
          toast.error(
            "Failed to sync user data with server. Bookmarking may not work."
          );
        }
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

    // This array now only needs news-related active tabs
    const newsRelatedTabs = [
      "all",
      "current-affairs",
      "hindu",
      "hindustan-times",
      "toi",
      "ie",
      "dna",
      "bookmarks",
      "search",
    ];

    // Ensure activeTab is correctly set for NewsFeed or default
    if (newsRelatedTabs.includes(lastSegment)) {
      setActiveTab(lastSegment);
    } else if (lastSegment === "home") {
      setActiveTab("current-affairs"); // Or your preferred default for /home
    } else {
      setActiveTab("all"); // Fallback for other non-news paths if needed
    }
  }, [location.pathname]);

  // Fetch user bookmarks
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
    } catch (err) {
      console.error(
        "Error fetching user bookmarks in Home:",
        err.response ? err.response.data : err.message
      );
      toast.error("Failed to load your bookmarks.");
      setUserBookmarks([]);
    }
  }, [currentUser, loadingUser]);

  useEffect(() => {
    if (!loadingUser && currentUser) {
      fetchUserBookmarks();
    }
  }, [loadingUser, currentUser, fetchUserBookmarks]);

  const handleBookmarkToggleSuccess = useCallback(() => {
    fetchUserBookmarks();
  }, [fetchUserBookmarks]);

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
    if (window.innerWidth >= 768) {
      setIsSidebarOpen((prev) => !prev);
    }
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    // Navigate based on the tabName
    if (tabName === "current-affairs") {
      navigate(`/home`);
    } else if (tabName === "all" || tabName === "bookmarks") {
      navigate(`/news/${tabName}`);
    } else if (
      ["hindu", "hindustan-times", "toi", "ie", "dna"].includes(tabName)
    ) {
      navigate(`/news/${tabName}`);
    } else if (tabName === "search") {
      navigate(`/search`); // Navigate to /search directly if it's a separate page
    } else if (tabName === "profile") {
      navigate(`/profile`); // Navigate to /profile directly
    } else if (tabName === "settings-help") {
      navigate(`/settings-help`); // Navigate to /settings-help directly
    }
  };

  if (loadingUser) {
    return (
      // Updated loading screen background and text
      <div className="flex justify-center items-center min-h-screen bg-app-bg-primary text-app-text-primary text-2xl">
        Loading user data...
      </div>
    );
  }

  return (
    // Updated main container background
    <div className="flex min-h-screen bg-app-bg-primary">
      {/* Sidebar component */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col relative transition-all duration-300 ease-in-out
                            ${isSidebarOpen ? "md:ml-64" : "md:ml-0"}`}
      >
        {/* NewsHub Dashboard Header: sticky at the top of the main content area */}
        {/* Updated header background and title color */}
        <div className="flex justify-between items-center p-6 bg-app-bg-primary sticky top-0 z-20 shadow-md">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-app-blue-main">
              📰 G-PRESS Dashboard
            </h1>
          </div>
          <button
            onClick={toggleSidebar}
            // Updated button text and hover/focus colors
            className="p-2 text-app-text-primary text-2xl rounded-full hover:bg-app-bg-secondary focus:outline-none focus:ring-2 focus:ring-app-blue-main"
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Scrollable Content below the header */}
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
          {/* Updated paragraph text color */}
          <p className="text-lg text-app-text-secondary mb-6">
            👋 Welcome
            {currentUser?.displayName ? `, ${currentUser.displayName}` : ""}!
            Select a navigation item from the sidebar or a news source tab.
          </p>

          {/* News Source Tabs (always shown in Home, adjust if needed) */}
          <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
            {["hindu", "hindustan-times", "toi", "ie", "dna"].map((source) => (
              <button
                key={source}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap
                                        ${
                                          activeTab === source
                                            ? "bg-app-blue-main text-app-text-primary" // Active state
                                            : "bg-app-bg-secondary text-app-text-secondary hover:bg-app-bg-secondary" // Inactive state
                                        }`}
                onClick={() => handleTabChange(source)}
              >
                {source
                  .replace(/-/g, " ")
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")
                  .replace("Toi", "Times of India")
                  .replace("Ie", "Indian Express")
                  .replace("Dna", "DNA India")
                  .replace("Hindu", "The Hindu")}
              </button>
            ))}
          </div>

          {/* Only render NewsFeed in Home.jsx */}
          {userId ? (
            <NewsFeed
              key={activeTab}
              mainActiveTab={activeTab}
              userId={userId}
              userBookmarks={userBookmarks}
              onBookmarkToggleSuccess={handleBookmarkToggleSuccess}
              searchTerm={""}
              currentUser={currentUser}
              newsData={activeTab === "bookmarks" ? userBookmarks : undefined}
            />
          ) : (
            // Updated text color
            <p className="text-app-text-primary text-center text-xl pt-10">
              Please log in to view personalized news and bookmarks.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
