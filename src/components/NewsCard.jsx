// src/components/NewsCard.jsx

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { toast } from "react-toastify";

export default function NewsCard({
  news,
  userId,
  userBookmarks, // This prop contains the array of bookmarked article objects
  onBookmarkToggleSuccess,
  currentUser,
}) {
  // --- DEBUGGING LOGS (keep these for now) ---
  console.log("--- NewsCard Render ---");
  console.log("Article Object received:", news);
  console.log("Article Title:", news ? news.title : "N/A");
  console.log(
    "Article ID (news._id):",
    news ? news._id : "N/A",
    "Type:",
    typeof news?._id
  );
  console.log(
    "Article Source (news.source):",
    news ? news.source : "N/A",
    "Type:",
    typeof news?.source
  );
  console.log("userBookmarks received in NewsCard:", userBookmarks);
  // ----------------------------------------------------------------------------------

  // This function determines if the current 'news' item is present in 'userBookmarks'
  const calculateIsBookmarked = useCallback(() => {
    if (!news || !userBookmarks || !Array.isArray(userBookmarks)) {
      return false;
    }

    const isBookmarkedNow = userBookmarks.some((bookmarkedArticle) => {
      // --- DEBUGGING LOG INSIDE THE COMPARISON ---
      console.log(
        `  Comparing bookmarkedArticle._id: ${
          bookmarkedArticle._id
        }, Type: ${typeof bookmarkedArticle._id}`
      );
      console.log(
        `  Comparing bookmarkedArticle.source: ${
          bookmarkedArticle.source
        }, Type: ${typeof bookmarkedArticle.source}`
      );
      console.log(`  with news._id: ${news._id}, Type: ${typeof news._id}`);
      console.log(
        `  with news.source: ${news.source}, Type: ${typeof news.source}`
      );
      // ------------------------------------------

      // CRUCIAL FIX: Compare news._id with bookmarkedArticle._id
      // AND news.source with bookmarkedArticle.source
      const articleIdString = String(news._id);
      const bookmarkedArticleIdString = bookmarkedArticle._id
        ? String(bookmarkedArticle._id)
        : "";

      const idMatch = articleIdString === bookmarkedArticleIdString;
      const sourceMatch = bookmarkedArticle.source === news.source;

      console.log(
        `  ID Match (${articleIdString} === ${bookmarkedArticleIdString}): ${idMatch}`
      );
      console.log(
        `  Source Match (${bookmarkedArticle.source} === ${news.source}): ${sourceMatch}`
      );
      console.log(
        `  Combined Match for this bookmarkedArticle: ${idMatch && sourceMatch}`
      );

      return idMatch && sourceMatch;
    });
    console.log(
      `Calculated isBookmarked for "${news.title}": ${isBookmarkedNow}`
    );
    return isBookmarkedNow;
  }, [news, userBookmarks]); // This function re-runs if 'news' or 'userBookmarks' changes

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  useEffect(() => {
    if (news && userBookmarks) {
      setIsBookmarked(calculateIsBookmarked());
    }
  }, [userBookmarks, news, calculateIsBookmarked]);

  if (!news || !news._id || !news.link || !news.source) {
    console.warn(
      "NewsCard skipping render due to missing essential news data:",
      news
    );
    return null;
  }

  const handleBookmarkToggle = async (event) => {
    event.stopPropagation();
    event.preventDefault();

    if (!userId) {
      toast.error("Please log in to manage bookmarks.");
      return;
    }
    if (isBookmarking) return;

    setIsBookmarking(true);

    try {
      const token = currentUser ? await currentUser.getIdToken() : null;
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        headers["x-user-id"] = userId;
      }

      const payload = {
        articleRefId: news._id, // This is the ID of the article to bookmark
        sourceModelName: news.source, // This is the source (e.g., 'hindu', 'toi')
      };

      let response;
      if (isBookmarked) {
        response = await axios.delete(
          "http://localhost:5000/api/news/bookmarks/remove",
          { data: payload, headers: headers }
        );
        console.log("Backend response for removal:", response.data.message);
        toast.success(response.data.message || "Bookmark removed!");
      } else {
        response = await axios.post(
          "http://localhost:5000/api/news/bookmarks/add",
          payload,
          { headers: headers }
        );
        console.log("Backend response for addition:", response.data.message);
        toast.success(response.data.message || "Bookmark added!");
      }

      setIsBookmarked((prev) => !prev);
      console.log(
        `Bookmark toggle successful for "${
          news.title
        }". New UI state: ${!isBookmarked}`
      );

      if (onBookmarkToggleSuccess) {
        onBookmarkToggleSuccess();
      }
    } catch (error) {
      console.error(
        `Error during bookmark toggle for "${news.title}":`,
        error.response ? error.response.data : error.message,
        error.response ? `Status: ${error.response.status}` : ""
      );

      let errorMessage = "Failed to update bookmark. Please try again.";
      if (error.response) {
        if (error.response.status === 409) {
          errorMessage =
            "This article was already bookmarked on the server. UI Syncing.";
          setIsBookmarked(true); // Force UI to show as bookmarked
          onBookmarkToggleSuccess(); // Trigger full re-fetch to sync
        } else if (error.response.status === 404) {
          errorMessage =
            "Bookmark not found on server for removal. UI Syncing.";
          setIsBookmarked(false); // Force UI to show as not bookmarked
          onBookmarkToggleSuccess(); // Trigger full re-fetch to sync
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      toast.error(errorMessage);
    } finally {
      setIsBookmarking(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-md transition hover:shadow-lg relative">
      <a href={news.link} target="_blank" rel="noopener noreferrer">
        <h2 className="text-xl font-semibold text-blue-400 hover:underline line-clamp-3">
          {news.title}
        </h2>
      </a>

      {userId && (
        <div
          className={`absolute top-4 right-4 cursor-pointer text-2xl transition-all duration-300 ease-in-out ${
            isBookmarking
              ? "text-gray-500"
              : isBookmarked
              ? "text-blue-500 hover:text-blue-400"
              : "text-gray-500 hover:text-gray-400"
          }`}
          onClick={handleBookmarkToggle}
          aria-label={
            isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"
          }
          title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
        >
          {isBookmarking ? (
            <span className="animate-spin text-gray-400">🔄</span>
          ) : isBookmarked ? (
            <FaBookmark />
          ) : (
            <FaRegBookmark />
          )}
        </div>
      )}

      {news.imageUrl && (
        <img
          src={news.imageUrl}
          alt={news.title}
          className="w-full h-48 object-cover rounded-md mt-3 mb-2"
        />
      )}

      {news.description && (
        <p className="text-gray-300 mt-2 text-sm line-clamp-4">
          {news.description}
        </p>
      )}
      <div className="mt-4 text-gray-400 text-xs flex justify-between items-center">
        <div className="flex flex-wrap gap-1">
          {news.categories && news.categories.length > 0 ? (
            news.categories.map((category, index) => (
              <span
                key={index}
                className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full text-xs font-medium"
              >
                {category}
              </span>
            ))
          ) : (
            <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full text-xs font-medium">
              General
            </span>
          )}
        </div>

        {news.publishedAt && (
          <span>{new Date(news.publishedAt).toLocaleString()}</span>
        )}
      </div>
    </div>
  );
}
