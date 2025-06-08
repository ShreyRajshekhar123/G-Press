// C:\Users\OKKKK\Desktop\G-Press\G-Press\src\components\Sidebar.jsx
import React from "react";
import { FaHome, FaBookmark, FaSignOutAlt } from "react-icons/fa";

// Helper function (can be moved to a utilities file if used elsewhere)
const formatSourceName = (sourceSlug) => {
  if (!sourceSlug) return "";
  if (sourceSlug === "all") return "All News";
  if (sourceSlug === "bookmarks") return "My Bookmarks";
  // This is for internal formatting if needed, but not used in this Sidebar anymore for specific newspapers
  return sourceSlug
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  // These are the main navigation items in the sidebar
  const navItems = [
    { id: "all", name: "All News", icon: <FaHome className="mr-2" /> },
    {
      id: "bookmarks",
      name: "My Bookmarks",
      icon: <FaBookmark className="mr-2" />,
    },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col p-4 shadow-lg h-screen fixed top-0 left-0">
      <h2 className="text-2xl font-bold text-blue-400 mb-8 mt-4">NewsHub</h2>
      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.id} className="mb-2">
              <button
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center w-full px-4 py-3 rounded-lg text-lg font-medium transition duration-200 ease-in-out
                                    ${
                                      activeTab === item.id
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "hover:bg-gray-700 text-gray-300 hover:text-white"
                                    }`}
              >
                {item.icon}
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button at the bottom */}
      <button
        onClick={onLogout}
        className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg text-lg font-medium transition duration-200 ease-in-out mt-auto"
      >
        <FaSignOutAlt className="mr-2" />
        Logout
      </button>
    </div>
  );
}
