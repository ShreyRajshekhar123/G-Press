import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut(auth).then(() => navigate("/"));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-400">
          📰 NewsHub Dashboard
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition"
        >
          Logout
        </button>
      </div>

      <p className="text-lg text-gray-300 mb-6">
        👋 Welcome! Select a newspaper tab to view the latest headlines.
      </p>

      {/* Placeholder for upcoming features */}
      <div className="border border-gray-700 rounded-lg p-6 text-center text-gray-400">
        Your newspaper tabs and news cards will be displayed here.
      </div>
    </div>
  );
}
