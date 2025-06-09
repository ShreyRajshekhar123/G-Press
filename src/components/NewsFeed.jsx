// src/components/NewsFeed.jsx

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import NewsCard from "./NewsCard"; // Your NewsCard
import { ClipLoader } from "react-spinners";

export default function NewsFeed({
  mainActiveTab,
  userId,
  userBookmarks, // This is the array of bookmarked articles for the current user
  onBookmarkToggleSuccess,
  searchTerm,
  currentUser,
}) {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNewsItems([]); // Clear previous news items when fetching new ones

    let apiUrl = "http://localhost:5000/api/news/"; // Base API URL

    if (searchTerm) {
      apiUrl += `search?q=${encodeURIComponent(searchTerm)}`;
    } else if (mainActiveTab === "bookmarks") {
      if (!userId) {
        setError("Please log in to view bookmarks.");
        setNewsItems([]);
        setLoading(false);
        return;
      }
      apiUrl += `user/${userId}/bookmarks`;
    } else if (mainActiveTab === "all") {
      // Assuming "all" tab fetches all news
      apiUrl += "all";
    } else if (mainActiveTab === "current-affairs") {
      // If "Current Affairs" is a special tab
      apiUrl += "all"; // Or adjust if you have a specific backend route for current affairs
    } else {
      // For specific newspaper tabs (e.g., "hindu", "hindustan-times", "toi", "ie", "dna")
      apiUrl += `${mainActiveTab}`; // No need for '/source/'
    }

    console.log(`[NewsFeed] Constructed API URL: ${apiUrl}`);

    try {
      const token = await currentUser?.getIdToken();

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": userId || "",
        },
      });
      setNewsItems(response.data);
      console.log(
        "Fetched news for tab:",
        mainActiveTab,
        "Data:",
        response.data
      );
    } catch (err) {
      console.error(`Error fetching news for ${mainActiveTab}:`, err);
      setError("Failed to fetch news. Please try again later.");
      setNewsItems([]);
    } finally {
      setLoading(false);
    }
  }, [mainActiveTab, userId, searchTerm, currentUser]);

  useEffect(() => {
    if (
      currentUser ||
      searchTerm ||
      mainActiveTab === "all" ||
      mainActiveTab === "current-affairs"
    ) {
      fetchNews();
    } else {
      setNewsItems([]);
      setLoading(false);
      if (mainActiveTab === "bookmarks" && !userId) {
        setError("Please log in to view bookmarks.");
      }
    }
  }, [fetchNews, currentUser, searchTerm, mainActiveTab, userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader size={50} color={"#123abc"} loading={loading} />
        <p className="text-blue-400 ml-4">Loading news...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  if (newsItems.length === 0 && !loading) {
    return (
      <div className="text-gray-400 text-center py-8">
        No news found for this category or search term.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {newsItems.map((newsItem) => {
        // Ensure newsItem and its _id are defined before passing
        if (!newsItem || !newsItem._id) {
          console.warn(
            "Skipping NewsCard due to incomplete article data:",
            newsItem
          );
          return null;
        }

        return (
          <NewsCard
            key={newsItem._id}
            news={newsItem} // CRUCIAL: Pass as 'news' prop, not 'article'
            userId={userId}
            userBookmarks={userBookmarks} // Pass the entire userBookmarks array
            onBookmarkToggleSuccess={onBookmarkToggleSuccess}
            currentUser={currentUser}
          />
        );
      })}
    </div>
  );
}
