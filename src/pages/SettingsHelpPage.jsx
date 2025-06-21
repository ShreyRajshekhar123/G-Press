// src/pages/SettingsHelpPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useTheme } from "../contexts/ThemeContext"; // NEW: Import useTheme hook

export default function SettingsHelpPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme(); // NEW: Get theme and toggleTheme from context

  const handleGoBack = () => {
    navigate(-1);
  };

  // NEW: State for Notification Toggle
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(() => {
    return localStorage.getItem("notificationsEnabled") === "true";
  });

  // NEW: Handle Notification Toggle
  const handleNotificationToggle = () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    localStorage.setItem("notificationsEnabled", newState);
    // Optionally, show a toast notification
    // toast.success(`Notifications ${newState ? 'enabled' : 'disabled'}`);
  };

  return (
    // Updated main container background and text
    <div className="flex-1 flex flex-col items-center justify-center bg-app-bg-primary text-app-text-primary p-6">
      {/* Updated card background and text */}
      <div className="bg-app-bg-secondary p-8 rounded-lg shadow-xl max-w-lg w-full text-center relative">
        <button
          onClick={handleGoBack}
          // Updated button colors
          className="absolute top-4 left-4 p-2 rounded-full hover:bg-app-bg-secondary text-app-text-primary focus:outline-none focus:ring-2 focus:ring-app-blue-main"
          aria-label="Go back"
          title="Go back"
        >
          <FaArrowLeft className="text-2xl" />
        </button>

        {/* Updated title color */}
        <h2 className="text-4xl font-bold text-app-blue-main mb-6">
          Settings & Help
        </h2>
        {/* Updated paragraph text color */}
        <p className="text-xl text-app-text-secondary mb-8">
          Manage your app settings and find help here.
        </p>
        <div className="space-y-6 text-left">
          {/* Updated section background and text */}
          <div className="bg-app-bg-secondary p-4 rounded-md">
            {/* Updated heading color */}
            <h3 className="text-2xl font-semibold text-app-blue-main mb-2">
              Settings
            </h3>
            {/* Updated list item text color */}
            <ul className="list-disc list-inside text-lg text-app-text-secondary space-y-3">
              {/* Theme Preference */}
              <li className="flex items-center justify-between">
                <span>Theme Preference:</span>
                <button
                  onClick={toggleTheme}
                  // Updated button colors
                  className="ml-4 py-1 px-3 rounded-full text-sm font-semibold
                                               bg-app-blue-main hover:bg-app-blue-main text-app-text-primary transition-colors duration-200"
                >
                  Switch to {theme === "dark" ? "Light" : "Dark"}
                </button>
              </li>
              {/* Notification Settings */}
              <li className="flex items-center justify-between">
                <span>Notification Settings:</span>
                {/* Simple toggle switch (can be styled further with Tailwind) */}
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    value=""
                    className="sr-only peer"
                    checked={notificationsEnabled}
                    onChange={handleNotificationToggle}
                  />
                  {/* Updated toggle switch colors - pay attention to peer-checked states */}
                  <div className="w-11 h-6 bg-app-text-secondary rounded-full peer peer-focus:ring-4 peer-focus:ring-app-blue-light dark:peer-focus:ring-app-blue-main peer-checked:after:translate-x-full peer-checked:after:border-app-text-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-app-text-primary after:border after:border-app-gray-border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-app-gray-border peer-checked:bg-app-blue-main"></div>
                  {/* Updated toggle text color */}
                  <span className="ml-3 text-sm font-medium text-app-text-primary dark:text-app-text-secondary">
                    {notificationsEnabled ? "On" : "Off"}
                  </span>
                </label>
              </li>
              <li>Privacy Controls (Coming Soon)</li>
            </ul>
          </div>
          {/* Updated section background and text */}
          <div className="bg-app-bg-secondary p-4 rounded-md">
            {/* Updated heading color */}
            <h3 className="text-2xl font-semibold text-app-blue-main mb-2">
              Help & Support
            </h3>
            {/* Updated list item text color and link colors */}
            <ul className="list-disc list-inside text-lg text-app-text-secondary space-y-3">
              <li>
                <a href="/faq" className="text-app-blue-main hover:underline">
                  Read our FAQ
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@yourdomain.com"
                  className="text-app-blue-main hover:underline"
                >
                  Contact Support
                </a>
              </li>{" "}
              <li>User Manual (Coming Soon)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
