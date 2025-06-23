import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import NewsCard from "./NewsCard";
import { toast } from "react-toastify";

// Reusing the formatSourceForBackend helper logic to ensure consistency
// This helper might already be defined in NewsCard.jsx, but for NewsFeed's
// specific URL construction, we can create a simpler version or reuse a more
// general one if available in a shared utility file.
// For now, let's include a local version adjusted for this component's needs.
const formatSourceForURL = (source) => {
  if (!source) return "";
  const lowerSource = source.toLowerCase();

  // This map should directly correspond to your backend's /api/news/:sourceKey routes
  const urlMap = {
    "the hindu": "hindu",
    hindu: "hindu",
    "dna india": "dna",
    dna: "dna",
    "hindustan times": "hindustan-times",
    "hindustan-times": "hindustan-times",
    "times of india": "toi",
    toi: "toi",
    "indian express": "ie",
    ie: "ie",
    // Add any other sources you have in your backend routes
  };

  return urlMap[lowerSource] || lowerSource.replace(/ /g, "-"); // Fallback for new sources
};

export default function NewsFeed({
  mainActiveTab, // 'all', 'current-affairs', 'bookmarks', 'hindu', 'search', etc.
  userId,
  userBookmarks, // This is the up-to-date list of bookmarks from Home/SearchPage
  onBookmarkToggleSuccess,
  searchTerm, // Passed from Home or SearchPage (though not directly used in fetchNews anymore)
  currentUser,
  newsData, // <--- IMPORTANT: Optional pre-fetched news data (used by SearchPage and now Bookmarks)
}) {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Removed the local sourceMap as formatSourceForURL handles it dynamically
  // and directly provides the URL-friendly key expected by the backend.

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    // If newsData is provided (e.g., from Home for bookmarks or SearchPage for search results),
    // use it directly and skip internal fetch.
    if (newsData !== undefined) {
      setNewsItems(Array.isArray(newsData) ? newsData : []);
      setLoading(false);
      return;
    }

    let url = "";
    let requestHeaders = {};

    // Only add authorization header if a currentUser exists
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        requestHeaders = { Authorization: `Bearer ${token}` };
      } catch (tokenError) {
        console.error("Error getting ID token:", tokenError);
        setError("Authentication error. Please try logging in again.");
        setLoading(false);
        return;
      }
    }

    // Determine the URL based on mainActiveTab
    if (mainActiveTab === "all") {
      url = `${process.env.REACT_APP_BACKEND_URI}api/news/all`;
    } else if (mainActiveTab === "current-affairs") {
      // Assuming 'current-affairs' maps to an actual endpoint
      url = `${process.env.REACT_APP_BACKEND_URI}api/news/current-affairs`;
    } else if (
      mainActiveTab &&
      mainActiveTab !== "search" && // Search is handled by newsData prop if there's a searchTerm
      mainActiveTab !== "bookmarks" // Bookmarks are handled by newsData prop
    ) {
      // Use the helper to get the correct URL segment for the backend
      const backendSourceKey = formatSourceForURL(mainActiveTab); // <--- CRITICAL CHANGE
      if (backendSourceKey) {
        url = `${process.env.REACT_APP_BACKEND_URI}api/news/${backendSourceKey}`; // <--- URL now correctly formed
      } else {
        console.warn(
          `NewsFeed: Unrecognized mainActiveTab for URL construction: '${mainActiveTab}'.`
        );
        setError("Invalid news category or source configuration.");
        setNewsItems([]);
        setLoading(false);
        return;
      }
    } else {
      // This path should ideally not be hit if newsData is correctly passed for 'search' and 'bookmarks'.
      console.warn(
        `NewsFeed: No explicit fetch URL for activeTab '${mainActiveTab}' when newsData is undefined.`
      );
      setNewsItems([]);
      setLoading(false);
      return;
    }

    if (!url) {
      setNewsItems([]);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(url, { headers: requestHeaders });
      // All news endpoints (including /all and /:sourceKey) return data under the 'news' key.
      let fetchedData = response.data.news || [];

      setNewsItems(fetchedData);
      console.log(`Fetched news for ${mainActiveTab}:`, fetchedData);
    } catch (err) {
      console.error(
        `Error fetching news for ${mainActiveTab}:`,
        err.response ? err.response.data : err.message
      );
      setError("Failed to fetch news. Please try again later.");
      toast.error(`Failed to load news articles for ${mainActiveTab}.`); // More specific toast
      setNewsItems([]);
    } finally {
      setLoading(false);
    }
  }, [mainActiveTab, newsData, currentUser]);

  useEffect(() => {
    // This useEffect will now properly react to mainActiveTab AND newsData changes.
    // It will prioritize newsData if provided (e.g., for bookmarks, search).
    // If newsData is undefined, it will trigger an internal fetch based on mainActiveTab.
    if (newsData !== undefined) {
      setNewsItems(Array.isArray(newsData) ? newsData : []);
      setLoading(false);
    } else {
      fetchNews(); // Only call fetchNews if newsData is undefined for this tab
    }
  }, [mainActiveTab, newsData, fetchNews]);

  if (loading) {
    return (
      <div className="text-center text-app-blue-main text-xl mt-10">
        Loading news...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-app-red-feedback text-xl mt-10">
        {error}
      </div>
    );
  }

  if (newsItems.length === 0) {
    return (
      <div className="text-center text-app-text-secondary text-xl mt-10">
        No articles found for this category or source.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {newsItems.map((newsItem) => (
        <NewsCard
          key={newsItem._id}
          news={newsItem}
          userId={userId}
          userBookmarks={userBookmarks}
          onBookmarkToggleSuccess={onBookmarkToggleSuccess}
          currentUser={currentUser}
        />
      ))}
    </div>
  );
}
