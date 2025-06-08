import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import NewsCard from "./NewsCard";

const newspapers = [
  { id: "hindu", name: "The Hindu" },
  { id: "hindustan-times", name: "Hindustan Times" },
  { id: "toi", name: "Times of India" },
  { id: "ie", name: "Indian Express" },
  { id: "dna", name: "DNA India" },
];

const formatSourceName = (sourceSlug) => {
  if (!sourceSlug) return "";
  if (sourceSlug === "all") return "All News";
  if (sourceSlug === "bookmarks") return "Your Bookmarks";
  if (sourceSlug === "ie") return "Indian Express";
  if (sourceSlug === "dna") return "DNA India";
  if (sourceSlug === "toi") return "Times of India";
  if (sourceSlug === "hindu") return "The Hindu";
  if (sourceSlug === "hindustan-times") return "Hindustan Times";
  return sourceSlug
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function NewsTabs({
  mainActiveTab,
  userId,
  userBookmarks,
  onBookmarkToggleSuccess,
}) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activeSubTab, setActiveSubTab] = useState(newspapers[0].id);

  const fetchNews = useCallback(
    async (sourceToFetch) => {
      setLoading(true);
      setError(null);
      setArticles([]); // Clear previous articles while loading

      try {
        let apiEndpoint;
        let fetchedArticles = [];

        if (sourceToFetch === "bookmarks") {
          apiEndpoint = `http://localhost:5000/api/news/user/${userId}/bookmarks`;
        } else {
          apiEndpoint = `http://localhost:5000/api/news/${sourceToFetch}`;
        }

        const response = await axios.get(apiEndpoint);

        if (sourceToFetch === "bookmarks") {
          fetchedArticles = response.data || [];
        } else {
          // *** THIS IS THE CRUCIAL FIX ***
          // Backend for sources directly returns an array of articles
          fetchedArticles = response.data || [];

          // *** ADD THIS MAPPING HERE ***
          // Attach the source ID to each article so NewsCard knows its origin
          fetchedArticles = fetchedArticles.map((article) => ({
            ...article,
            source: sourceToFetch, // This will be 'hindu', 'toi', etc.
          }));
        }
        setArticles(fetchedArticles);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError(
          `Failed to load news from ${formatSourceName(
            sourceToFetch
          )}. Please ensure backend is running and data exists.`
        );
        setArticles([]); // Ensure articles are empty on error
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (mainActiveTab === "all") {
      setActiveSubTab(newspapers[0].id);
      fetchNews(newspapers[0].id);
    } else if (mainActiveTab === "bookmarks") {
      setActiveSubTab(null);
      fetchNews("bookmarks");
    }
  }, [mainActiveTab, fetchNews]);

  useEffect(() => {
    if (mainActiveTab === "all" && activeSubTab) {
      fetchNews(activeSubTab);
    }
  }, [activeSubTab, mainActiveTab, fetchNews]);

  const displaySourceName =
    mainActiveTab === "all" ? activeSubTab : mainActiveTab;

  return (
    <div className="space-y-6 container mx-auto px-4 py-8">
      {mainActiveTab === "all" && (
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          {newspapers.map((paper) => (
            <button
              key={paper.id}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeSubTab === paper.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
              onClick={() => setActiveSubTab(paper.id)}
            >
              {paper.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-gray-400 col-span-full text-center text-lg py-10">
            Loading {formatSourceName(displaySourceName)} news...
          </p>
        ) : error ? (
          <p className="text-red-400 col-span-full text-center text-lg py-10 border border-red-600 p-4 rounded-md bg-red-900 bg-opacity-20 mx-auto max-w-xl">
            {error}
          </p>
        ) : articles.length === 0 ? (
          <p className="text-gray-400 col-span-full text-center text-lg py-10 bg-gray-700 bg-opacity-50 rounded-md mx-auto max-w-xl">
            No articles found for {formatSourceName(displaySourceName)}.
            {displaySourceName !== "bookmarks" &&
              " Run the scraper for this source if needed."}
          </p>
        ) : (
          articles.map((article) => (
            <NewsCard
              key={article._id}
              news={article}
              userId={userId}
              userBookmarks={userBookmarks}
              onBookmarkToggleSuccess={onBookmarkToggleSuccess}
            />
          ))
        )}
      </div>
    </div>
  );
}
