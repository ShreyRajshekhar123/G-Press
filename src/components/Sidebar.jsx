import React from "react";
import { Link } from "react-router-dom";
import {
  FaHome,
  FaBookmark,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa"; // Added FaBars, FaTimes if you wanted them here

export default function Sidebar({
  activeTab,
  setActiveTab,
  onLogout,
  isSidebarOpen, // NEW PROP
  toggleSidebar, // NEW PROP (though we won't use it directly inside sidebar for its own toggle)
}) {
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    // Optional: Close sidebar on small screens after clicking a tab
    // if (window.innerWidth < 768) { // Example breakpoint for small screens
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
        {/* All News Tab */}
        <button
          className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200
            ${
              activeTab === "all"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          onClick={() => handleTabClick("all")}
        >
          <FaHome className="mr-3 text-lg" />
          <span>All News</span>
        </button>

        {/* Bookmarks Tab (always available, but only shows content if logged in) */}
        <button
          className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200
            ${
              activeTab === "bookmarks"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          onClick={() => handleTabClick("bookmarks")}
        >
          <FaBookmark className="mr-3 text-lg" />
          <span>Bookmarks</span>
        </button>

        {/* REMOVED: News Source Tabs and the "Sources" heading */}
        {/*
        <h2 className="text-gray-400 text-sm uppercase tracking-wider mt-6 mb-2">
          Sources
        </h2>
        <button
          className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200
            ${
              activeTab === "hindu"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          onClick={() => handleTabClick("hindu")}
        >
          <span>The Hindu</span>
        </button>
        <button
          className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200
            ${
              activeTab === "hindustan-times"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          onClick={() => handleTabClick("hindustan-times")}
        >
          <span>Hindustan Times</span>
        </button>
        <button
          className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200
            ${
              activeTab === "toi"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          onClick={() => handleTabClick("toi")}
        >
          <span>Times of India</span>
        </button>
        <button
          className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200
            ${
              activeTab === "ie"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          onClick={() => handleTabClick("ie")}
        >
          <span>Indian Express</span>
        </button>
        <button
          className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200
            ${
              activeTab === "dna"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          onClick={() => handleTabClick("dna")}
        >
          <span>DNA India</span>
        </button>
        */}
        {/* Add more source buttons here as needed if you decide to put them back */}
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
