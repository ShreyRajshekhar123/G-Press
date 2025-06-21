// src/App.js - No changes needed here, it's already correct for the updates.
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Overview from "./pages/Overview";
import SearchPage from "./pages/SearchPage";
import QuestionsPage from "./pages/QuestionsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsHelpPage from "./pages/SettingsHelpPage";
import PrivateRoute from "./components/PrivateRoute";
import FAQPage from "./pages/FAQPage";

import "./index.css";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      {/* Wrap your entire application with ThemeProvider */}
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/overview" element={<Overview />} />

          <Route element={<PrivateRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/news/all" element={<Home />} />
            <Route path="/news/bookmarks" element={<Home />} />
            <Route path="/news/current-affairs" element={<Home />} />
            <Route path="/news/:source" element={<Home />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/questions/:articleId" element={<QuestionsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings-help" element={<SettingsHelpPage />} />
            <Route path="/faq" element={<FAQPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Router>
    </ThemeProvider>
  );
}

export default App;
