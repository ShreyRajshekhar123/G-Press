// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Overview from "./pages/Overview";
import SearchPage from "./pages/SearchPage";
import "./index.css"; // For Tailwind CSS imports

// Add these two imports for react-toastify
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // This is the CSS for react-toastify

function App() {
  return (
    <Router>
      {/* Changed BrowserRouter to Router for common convention */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        {/* News routes, handled by Home component's logic */}
        <Route path="/news/:source" element={<Home />} />
        <Route path="/news/current-affairs" element={<Home />} />
        <Route path="/news/all" element={<Home />} />
        <Route path="/news/bookmarks" element={<Home />} />
      </Routes>
      {/* Add ToastContainer here, typically at the root of your application */}
      <ToastContainer
        position="bottom-right" // Where the toasts will appear
        autoClose={3000} // How long toasts stay (in ms)
        hideProgressBar={false} // Show or hide progress bar
        newestOnTop={false} // Stack new toasts on top of old ones
        closeOnClick // Close toast when clicked
        rtl={false} // Right-to-left support
        pauseOnFocusLoss // Pause toast autoClose when window loses focus
        draggable // Allow dragging toasts
        pauseOnHover // Pause toast autoClose on hover
      />
    </Router>
  );
}

export default App;
