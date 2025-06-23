// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import { toast } from "react-toastify";
import axios from "axios";

export default function Login() {
  // Renamed from Auth to Login as per your App.js
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate("/home");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Google Sign-In Successful:", user);

      const token = await user.getIdToken();

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URI}api/news/sync-user`,
        {
          firebaseUid: user.uid,
          displayName: user.displayName,
          email: user.email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Successfully logged in with Google!");
      // Check localStorage for 'visited' flag to decide navigation
      const firstTime = localStorage.getItem("visited");
      if (!firstTime) {
        localStorage.setItem("visited", "true");
        navigate("/overview"); // Navigate to overview for first-time users
      } else {
        navigate("/home"); // Navigate to home for returning users
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      toast.error(`Google login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("Email/Password Sign-In Successful:", user);

      const token = await user.getIdToken();

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URI}api/news/sync-user`,
        {
          firebaseUid: user.uid,
          displayName: user.displayName,
          email: user.email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Successfully logged in with Email!");
      // Check localStorage for 'visited' flag to decide navigation
      const firstTime = localStorage.getItem("visited");
      if (!firstTime) {
        localStorage.setItem("visited", "true");
        navigate("/overview"); // Navigate to overview for first-time users
      } else {
        navigate("/home"); // Navigate to home for returning users
      }
    } catch (error) {
      console.error("Email/Password Sign-In Error:", error);
      let errorMessage = "Login failed. Please check your credentials.";
      if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "Your account has been disabled.";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "No user found with this email. Please sign up.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password.";
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-app-bg-primary text-app-text-primary">
      <div className="bg-app-bg-secondary p-8 rounded-xl shadow-lg w-full max-w-md text-center border border-app-gray-border">
        <h1 className="text-3xl font-bold text-app-blue-main mb-6">
          Login to G-PRESS
        </h1>
        <form onSubmit={handleEmailLogin}>
          <div className="mb-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-app-bg-primary text-app-text-primary border border-app-gray-border focus:outline-none focus:ring-2 focus:ring-app-blue-main"
              required
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-app-bg-primary text-app-text-primary border border-app-gray-border focus:outline-none focus:ring-2 focus:ring-app-blue-main"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg font-bold text-white bg-app-blue-main hover:bg-app-blue-light transition-colors duration-200"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login with Email"}
          </button>
        </form>
        <div className="my-6 text-app-text-secondary">or</div>
        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 px-4 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 transition-colors duration-200 flex items-center justify-center"
          disabled={loading}
        >
          <img
            src="https://img.icons8.com/color/24/000000/google-logo.png"
            alt="Google logo"
            className="mr-2"
          />
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>

        {/* New "Create an Account" link */}
        <p className="mt-6 text-app-text-secondary text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-app-blue-main hover:underline">
            Create one here
          </Link>
        </p>
      </div>
    </div>
  );
}
