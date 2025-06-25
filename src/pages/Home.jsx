// src/pages/Home.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { auth, signOut } from "../firebase"; // Keep signOut from firebase
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NewsFeed from "../components/NewsFeed";
import { FaBars, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext"; // <--- IMPORT useAuth hook

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  // Use the useAuth hook to get currentUser and loadingUser from the context
  const { currentUser, loadingUser } = useAuth(); // <--- UPDATED: Get from context

  const [activeTab, setActiveTab] = useState("all");
  // userId now directly comes from currentUser from context
  const userId = currentUser ? currentUser.uid : null;
  const [userBookmarks, setUserBookmarks] = useState([]);

  // Sidebar state: Open on desktop (md+), hidden on mobile by default
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  // Effect to adjust sidebar state on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // If wider than md, and sidebar is not open, open it (adjust if you want it always open on desktop)
        if (!isSidebarOpen && window.innerWidth < 768) {
          setIsSidebarOpen(true);
        }
      } else {
        setIsSidebarOpen(false); // Close on smaller screens
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarOpen]);

  // ⭐ REMOVED THE OLD onAuthStateChanged useEffect BLOCK HERE ⭐
  // The AuthContext now handles the primary Firebase authentication state listening.

  // New useEffect for syncing user with backend, dependent on currentUser and loadingUser from context
  useEffect(() => {
    const syncUserWithBackend = async () => {
      if (currentUser && !loadingUser) {
        try {
          const token = await currentUser.getIdToken();
          await axios.post(
            `${process.env.REACT_APP_BACKEND_URI}api/news/sync-user`,
            {
              displayName: currentUser.displayName,
              email: currentUser.email,
              firebaseUid: currentUser.uid,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log(`User ${currentUser.uid} synced with backend.`);
        } catch (syncError) {
          console.error(
            `Error syncing user ${currentUser.uid} with backend:`,
            syncError.response?.data || syncError.message
          );
          toast.error(
            "Failed to sync user data with server. Bookmarking may not work."
          );
        }
      } else if (!currentUser && !loadingUser && location.pathname !== "/") {
        // If user is null and not loading, and not already on login, navigate to login
        navigate("/");
      }
    };

    // Only run sync if currentUser or loadingUser state changes, and once loading is complete
    if (!loadingUser) {
      syncUserWithBackend();
    }
  }, [currentUser, loadingUser, navigate, location.pathname]); // Depend on context values

  // Effect to set active tab from URL on load or path change
  useEffect(() => {
    const pathSegments = location.pathname.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];

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

    if (newsRelatedTabs.includes(lastSegment)) {
      setActiveTab(lastSegment);
    } else if (lastSegment === "home") {
      setActiveTab("current-affairs");
    } else {
      setActiveTab("all");
    }
  }, [location.pathname]);

  // Fetch user bookmarks
  const fetchUserBookmarks = useCallback(async () => {
    // ⭐ UPDATED: Check currentUser and loadingUser from context
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
  }, [currentUser, loadingUser]); // Depend on currentUser and loadingUser from context

  useEffect(() => {
    // ⭐ Only fetch bookmarks once loadingUser is false AND currentUser is available
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
        // AuthContext's listener will now handle setting currentUser to null
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

  // No longer need this loadingUser check here, as AuthProvider handles it
  // if (loadingUser) {
  //   return (
  //     <div className="flex justify-center items-center min-h-screen bg-app-bg-primary text-app-text-primary text-2xl">
  //       Loading user data...
  //     </div>
  //   );
  // }

  return (
    <div className="flex min-h-screen bg-app-bg-primary">
      {/* Sidebar component */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        currentUser={currentUser} // Continue passing currentUser to Sidebar if it needs it
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col relative transition-all duration-300 ease-in-out
                            ${isSidebarOpen ? "md:ml-64" : "md:ml-0"}`}
      >
        {/* NewsHub Dashboard Header: sticky at the top of the main content area */}
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

        {/* Scrollable Content below the header */}
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
          <p className="text-lg text-app-text-secondary mb-6">
            👋 Welcome
            {currentUser?.displayName ? `, ${currentUser.displayName}` : ""}!
            Select a navigation item from the sidebar or a news source tab.
          </p>

          <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
            {["hindu", "hindustan-times", "toi", "ie", "dna"].map((source) => (
              <button
                key={source}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap
                                    ${
                                      activeTab === source
                                        ? "bg-app-blue-main text-app-text-primary"
                                        : "bg-app-bg-secondary text-app-text-secondary hover:bg-app-bg-secondary"
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

          <NewsFeed
            key={activeTab}
            mainActiveTab={activeTab}
            userId={userId}
            userBookmarks={userBookmarks}
            onBookmarkToggleSuccess={handleBookmarkToggleSuccess}
            currentUser={currentUser} // Continue passing currentUser to NewsFeed if it needs it
            newsData={activeTab === "bookmarks" ? userBookmarks : undefined}
          />
        </div>
      </div>
    </div>
  );
}
