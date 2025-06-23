import { useNavigate } from "react-router-dom";

export default function Overview() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center px-6 text-white">
      <h1 className="text-4xl font-bold text-blue-400 mb-6">
        Welcome to G-PRESS
      </h1>
      <p className="text-gray-300 text-center max-w-2xl mb-6 text-lg">
        G-PRESS brings you top headlines from major newspapers like The Hindu,
        Hindustan Times, and Times of India — all in one place.
      </p>
      <ul className="text-left text-gray-400 list-disc list-inside mb-6 max-w-2xl space-y-2">
        <li>🔄 Daily updated headlines from trusted sources</li>
        <li>🗂️ Tab-based newspaper selection</li>
        <li>📰 Responsive card-based layout for readability</li>
        <li>🔐 Login with Google or Email</li>
      </ul>
      <button
        onClick={() => navigate("/home")}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition"
      >
        Go to Dashboard
      </button>
    </div>
  );
}
