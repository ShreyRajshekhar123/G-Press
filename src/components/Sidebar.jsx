// src/components/Sidebar.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Sidebar({
  activeTab,
  setActiveTab,
  onLogout,
  isSidebarOpen,
}) {
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  // Inline SVG icons to replace react-icons/fa due to import issues
  const HomeIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-3 text-lg"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );

  const BookmarkIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-3 text-lg"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>
  );

  const LogoutIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-3 text-lg"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  );

  const NewspaperIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-3 text-lg"
    >
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4"></path>
      <path d="M8 6h8"></path>
      <path d="M8 10h8"></path>
      <path d="M8 14h8"></path>
      <path d="M8 18h8"></path>
    </svg>
  );

  const SearchIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-3 text-lg"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );

  const SettingsIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-3 text-lg"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.08.15a2 2 0 0 1 0 2.73l-.08.15a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.08-.15a2 2 0 0 1 0-2.73l.08-.15a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );

  const UserIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-3 text-lg"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );

  return (
    <div
      className={`
        bg-app-sidebar-bg text-app-sidebar-text p-6 shadow-lg
        flex flex-col justify-between border-r border-app-gray-border
        transition-all duration-300 ease-in-out
        overflow-y-auto

        /* Base styling (mobile-first): fixed, full height, initially off-screen to allow sliding in */
        fixed inset-y-0 left-0 w-64 z-40 /* Default width for mobile, z-40 ensures it overlays content */
        transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}

        /* Desktop (md and up) overrides: maintains fixed position and width, with slightly lower z-index */
        /* The sliding behavior is now inherited from the base 'transform' property above */
        md:flex md:fixed md:top-0 md:bottom-0 md:left-0 md:w-64 md:z-30
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
              (activeTab === "all" && window.location.pathname === "/home")
                ? "bg-app-sidebar-active-bg text-app-text-primary"
                : "hover:bg-app-bg-secondary text-app-sidebar-text"
            }`}
          onClick={() => handleTabClick("current-affairs")}
        >
          <NewspaperIcon />
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
          <HomeIcon />
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
          <BookmarkIcon />
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
          <SearchIcon />
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
          <SettingsIcon />
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
          <UserIcon />
          <span>Profile</span>
        </Link>
      </nav>

      <div className="mt-auto pt-4 border-t border-app-gray-border">
        <button
          className="w-full text-left py-2 px-4 rounded-lg flex items-center bg-red-600 hover:bg-red-700 text-white transition-colors duration-200" // Logout button still hardcoded red/white for emphasis
          onClick={onLogout}
        >
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
