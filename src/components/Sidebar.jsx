// src/components/Sidebar.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  FaHome,
  FaBookmark,
  FaSignOutAlt,
  FaNewspaper,
  FaSearch,
} from "react-icons/fa"; // ✅ Added FaSearch

export default function Sidebar({
  activeTab,
  setActiveTab,
  onLogout,
  isSidebarOpen,
  toggleSidebar,
}) {
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    // Optional: Close sidebar on small screens after clicking a tab
    // if (window.innerWidth < 768) {
    //   toggleSidebar();
    // }
  };

  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-gray-800 text-white p-6
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        z-50 border-r border-gray-700
      `}
    >
      <div className="flex items-center mb-10">
        <img src="/logo.png" alt="G-Press Logo" className="h-8 w-8 mr-3" />
        <h1 className="text-2xl font-bold text-blue-400">G-Press</h1>
      </div>

      <nav className="space-y-4">
        {/* Current Affairs Link (typically the default home/dashboard view) */}
        <Link
          to="/home" // Link to the home route
          className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200
            ${
              // Highlight if current-affairs tab is active, or if the path is /home and no specific tab is selected
              activeTab === "current-affairs"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          onClick={() => handleTabClick("current-affairs")} // Still update activeTab for highlighting
        >
          <FaNewspaper className="mr-3 text-lg" />
          <span>Current Affairs</span>
        </Link>

        {/* All News Link */}
        <Link
          to="/news/all" // Link to the all news route
          className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200
            ${
              activeTab === "all"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          onClick={() => handleTabClick("all")} // Still update activeTab for highlighting
        >
          <FaHome className="mr-3 text-lg" />
          <span>All News</span>
        </Link>

        {/* Bookmarks Link */}
        <Link
          to="/news/bookmarks" // Link to the bookmarks route
          className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200
            ${
              activeTab === "bookmarks"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          onClick={() => handleTabClick("bookmarks")} // Still update activeTab for highlighting
        >
          <FaBookmark className="mr-3 text-lg" />
          <span>Bookmarks</span>
        </Link>

        {/* ✅ New Search Link */}
        <Link
          to="/search" // Link to the new dedicated search page
          className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200
            ${
              activeTab === "search" // Set this to "search" in SearchPage.jsx to highlight
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          onClick={() => handleTabClick("search")} // Update activeTab to highlight "Search"
        >
          <FaSearch className="mr-3 text-lg" />
          <span>Search News</span>
        </Link>
      </nav>

      {/* Logout button positioned at the bottom */}
      <div className="absolute bottom-6 left-0 w-full px-6">
        <button
          className="w-full text-left py-2 px-4 rounded-lg flex items-center bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
          onClick={onLogout}
        >
          <FaSignOutAlt className="mr-3 text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
