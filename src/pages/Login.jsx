import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const provider = new GoogleAuthProvider();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      const firstTime = localStorage.getItem("visited");

      if (!firstTime) {
        localStorage.setItem("visited", "true");
        navigate("/overview");
      } else navigate("/home");
    } catch (err) {
      setError("Google sign-in failed");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
      <form
        onSubmit={handleEmailLogin}
        className="bg-gray-800 p-8 rounded-xl shadow-xl space-y-4 w-96"
      >
        <h1 className="text-2xl font-bold text-center text-white">
          Login to NewsHub
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Login with Email
        </button>

        <div className="text-center text-gray-400">or</div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 flex justify-center items-center gap-2 transition"
        >
          <img
            src="https://img.icons8.com/color/16/000000/google-logo.png"
            alt="Google logo"
          />
          Sign in with Google
        </button>
      </form>
    </div>
  );
}
