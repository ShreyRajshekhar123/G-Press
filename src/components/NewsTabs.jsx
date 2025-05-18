import { useState, useEffect } from "react";
import axios from "axios";

const newspapers = [
  { id: "hindu", name: "The Hindu" },
<<<<<<< HEAD:global_press/src/components/NewsTabs.jsx
  { id: "hindustan-times", name: "Hindustan Times" },
=======
  { id: "ht", name: "Hindustan Times" },
>>>>>>> 409c0aa83d05f3892a88266de6b624c86731f2e6:src/components/NewsTabs.jsx
  { id: "toi", name: "Times of India" },
  { id: "ie", name: "Indian Express" },
  { id: "dna", name: "DNA India" },
];

export default function NewsTabs() {
  const [activeTab, setActiveTab] = useState("hindu");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNews = async (source) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/news/${source}`
      );
      setArticles(response.data.articles);
    } catch (error) {
      console.error("Error fetching news:", error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(activeTab);
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-3 justify-center">
        {newspapers.map((paper) => (
          <button
            key={paper.id}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === paper.id
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
            onClick={() => setActiveTab(paper.id)}
          >
            {paper.name}
          </button>
        ))}
      </div>

      {/* News Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-gray-400 col-span-full text-center">Loading...</p>
        ) : articles.length === 0 ? (
          <p className="text-gray-400 col-span-full text-center">
            No articles found.
          </p>
        ) : (
          articles.map((article, index) => (
            <div
              key={index}
              className="bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition"
            >
              <h2 className="text-lg font-semibold mb-2">{article.title}</h2>
              <p className="text-sm text-gray-400 mb-2">{article.summary}</p>
              {article.link && (
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-sm"
                >
                  Read more →
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
