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
  // The rest of your specific format checks are good.
  // This fall-through logic handles them fine.
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
          // *** FIX 1: Corrected Bookmark API Endpoint ***
          apiEndpoint = `http://localhost:5000/api/news/user/${userId}/bookmarks`;
        } else {
          apiEndpoint = `http://localhost:5000/api/news/${sourceToFetch}`;
        }

        const response = await axios.get(apiEndpoint);

        if (sourceToFetch === "bookmarks") {
          // Backend for bookmarks now directly returns an array of articles
          fetchedArticles = response.data || [];
        } else {
          // *** FIX 2: Backend for sources directly returns an array of articles ***
          fetchedArticles = response.data || []; // No `.articles` property
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
    [userId] // userId is a dependency for the bookmark endpoint
  );

  useEffect(() => {
    if (mainActiveTab === "all") {
      // When "All News" is selected, default to the first newspaper
      setActiveSubTab(newspapers[0].id);
      fetchNews(newspapers[0].id);
    } else if (mainActiveTab === "bookmarks") {
      // When "Bookmarks" is selected, clear sub-tab and fetch bookmarks
      setActiveSubTab(null); // No sub-tabs for bookmarks
      fetchNews("bookmarks");
    }
  }, [mainActiveTab, fetchNews]); // Re-run when main tab or fetchNews callback changes

  useEffect(() => {
    // This effect runs when activeSubTab changes, but only if mainActiveTab is "all"
    if (mainActiveTab === "all" && activeSubTab) {
      fetchNews(activeSubTab);
    }
  }, [activeSubTab, mainActiveTab, fetchNews]); // Re-run when sub-tab, main tab, or fetchNews callback changes

  // Determine the name to display in the "No articles found" message
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
          // Render NewsCard for each article
          articles.map((article) => (
            <NewsCard
              key={article._id} // Use article._id as the unique key
              news={article} // Pass the entire article object as 'news' prop
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
