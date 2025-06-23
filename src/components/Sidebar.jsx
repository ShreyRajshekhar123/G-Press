// src/components/Sidebar.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  FaHome,
  FaBookmark,
  FaSignOutAlt,
  FaNewspaper,
  FaSearch,
  FaCog, // Icon for Settings
  FaUser, // Icon for Profile
} from "react-icons/fa";

export default function Sidebar({
  activeTab,
  setActiveTab,
  onLogout,
  isSidebarOpen,
}) {
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  return (
    <div
      className={`
                bg-app-sidebar-bg text-app-sidebar-text p-6 shadow-lg
                flex flex-col justify-between border-r border-app-gray-border
                transition-all duration-300 ease-in-out
                overflow-y-auto

                hidden
                md:flex
                md:fixed md:top-0 md:bottom-0 md:left-0 md:w-64 md:z-30
                ${isSidebarOpen ? "md:translate-x-0" : "md:-translate-x-full"}
            `}
    >
      <div className="flex items-center mb-10">
        <h1 className="text-2xl font-bold text-app-blue-main">G-Press</h1>
      </div>

      <nav className="space-y-4 flex-grow">
        <Link
          to="/home"
          className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200
                         ${
                           activeTab === "current-affairs" ||
                           (activeTab === "all" &&
                             window.location.pathname === "/home")
                             ? "bg-app-sidebar-active-bg text-app-text-primary"
                             : "hover:bg-app-bg-secondary text-app-sidebar-text"
                         }`}
          onClick={() => handleTabClick("current-affairs")}
        >
          <FaNewspaper className="mr-3 text-lg" />
          <span>Current Affairs</span>
        </Link>

        <Link
          to="/news/all"
          className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200
                         ${
                           activeTab === "all"
                             ? "bg-app-sidebar-active-bg text-app-text-primary"
                             : "hover:bg-app-bg-secondary text-app-sidebar-text"
                         }`}
          onClick={() => handleTabClick("all")}
        >
          <FaHome className="mr-3 text-lg" />
          <span>All News</span>
        </Link>

        <Link
          to="/news/bookmarks"
          className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200
                         ${
                           activeTab === "bookmarks"
                             ? "bg-app-sidebar-active-bg text-app-text-primary"
                             : "hover:bg-app-bg-secondary text-app-sidebar-text"
                         }`}
          onClick={() => handleTabClick("bookmarks")}
        >
          <FaBookmark className="mr-3 text-lg" />
          <span>Bookmarks</span>
        </Link>

        <Link
          to="/search"
          className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200
                         ${
                           activeTab === "search"
                             ? "bg-app-sidebar-active-bg text-app-text-primary"
                             : "hover:bg-app-bg-secondary text-app-sidebar-text"
                         }`}
          onClick={() => handleTabClick("search")}
        >
          <FaSearch className="mr-3 text-lg" />
          <span>Search News</span>
        </Link>

        <Link
          to="/settings-help"
          className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200
                         ${
                           activeTab === "settings-help"
                             ? "bg-app-sidebar-active-bg text-app-text-primary"
                             : "hover:bg-app-bg-secondary text-app-sidebar-text"
                         }`}
          onClick={() => handleTabClick("settings-help")}
        >
          <FaCog className="mr-3 text-lg" />
          <span>Settings & Help</span>
        </Link>

        <Link
          to="/profile"
          className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200
                         ${
                           activeTab === "profile"
                             ? "bg-app-sidebar-active-bg text-app-text-primary"
                             : "hover:bg-app-bg-secondary text-app-sidebar-text"
                         }`}
          onClick={() => handleTabClick("profile")}
        >
          <FaUser className="mr-3 text-lg" />
          <span>Profile</span>
        </Link>
      </nav>

      <div className="mt-auto pt-4 border-t border-app-gray-border">
        <button
          className="w-full text-left py-2 px-4 rounded-lg flex items-center bg-red-600 hover:bg-red-700 text-white transition-colors duration-200" // Logout button still hardcoded red/white for emphasis
          onClick={onLogout}
        >
          <FaSignOutAlt className="mr-3 text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
