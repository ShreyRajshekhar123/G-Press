// src/contexts/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from "react";

// Create the context
const ThemeContext = createContext();

// Create a provider component
export const ThemeProvider = ({ children }) => {
  // State to hold the current theme, initialized from localStorage or defaults to 'dark'
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem("theme");
    return storedTheme || "dark"; // Default to 'dark' if no theme is stored
  });

  // Effect to apply the theme class to the <html> element
  useEffect(() => {
    const root = window.document.documentElement; // This is the <html> tag

    // Remove the old theme class and add the new one
    root.classList.remove(theme === "dark" ? "light" : "dark"); // Remove the opposite theme
    root.classList.add(theme); // Add the current theme

    // Store the current theme in localStorage for persistence
    localStorage.setItem("theme", theme);
  }, [theme]); // Re-run effect whenever the 'theme' state changes

  // Function to toggle the theme
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  // Provide the theme and toggle function to children components
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to easily consume the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
