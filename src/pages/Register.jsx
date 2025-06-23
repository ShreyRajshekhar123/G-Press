// src/pages/Register.jsx
import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // For password confirmation
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate("/home");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("Registration Successful:", user);

      const token = await user.getIdToken();

      // Sync new user with backend
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URI}api/news/sync-user`,
        {
          firebaseUid: user.uid,
          email: user.email,
          // You might prompt for displayName later or leave it null for now
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Account created successfully! You are now logged in.");
      navigate("/home");
    } catch (error) {
      console.error("Registration Error:", error);
      let errorMessage = "Registration failed. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already in use.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Must be at least 6 characters.";
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Google Sign-Up/Login Successful:", user);

      const token = await user.getIdToken();

      // Sync user data with your backend
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
      toast.success("Successfully registered/logged in with Google!");
      navigate("/home");
    } catch (error) {
      console.error("Google Sign-Up/Login Error:", error);
      toast.error(`Google sign-up failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-app-bg-primary text-app-text-primary">
      <div className="bg-app-bg-secondary p-8 rounded-xl shadow-lg w-full max-w-md text-center border border-app-gray-border">
        <h1 className="text-3xl font-bold text-app-blue-main mb-6">
          Create G-PRESS Account
        </h1>
        <form onSubmit={handleRegister}>
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
          <div className="mb-4">
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-app-bg-primary text-app-text-primary border border-app-gray-border focus:outline-none focus:ring-2 focus:ring-app-blue-main"
              required
              minLength="6"
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-app-bg-primary text-app-text-primary border border-app-gray-border focus:outline-none focus:ring-2 focus:ring-app-blue-main"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg font-bold text-white bg-app-blue-main hover:bg-app-blue-light transition-colors duration-200"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register Account"}
          </button>
        </form>
        <div className="my-6 text-app-text-secondary">or</div>
        <button
          onClick={handleGoogleRegister}
          className="w-full py-3 px-4 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 transition-colors duration-200 flex items-center justify-center"
          disabled={loading}
        >
          <img
            src="https://img.icons8.com/color/24/000000/google-logo.png"
            alt="Google logo"
            className="mr-2"
          />
          {loading ? "Signing up with Google..." : "Sign up with Google"}
        </button>

        <p className="mt-6 text-app-text-secondary text-sm">
          Already have an account?{" "}
          <Link to="/" className="text-app-blue-main hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
