import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";

export default function NewsCard({
  news,
  userId,
  userBookmarks, // This prop contains the array of bookmarked article references
  onBookmarkToggleSuccess,
}) {
  // --- DEBUGGING LOGS (keep these for now, they help us understand what's happening) ---
  console.log("--- NewsCard Render ---");
  console.log("Article Title:", news ? news.title : "N/A");
  console.log("Article ID:", news ? news._id : "N/A");
  console.log("Article Source (news.source):", news ? news.source : "N/A");
  console.log("userBookmarks received in NewsCard:", userBookmarks);
  // ----------------------------------------------------------------------------------

  // This function determines if the current 'news' item is present in 'userBookmarks'
  const calculateIsBookmarked = useCallback(() => {
    // Safety checks: ensure 'news' object exists and 'userBookmarks' is a valid array
    if (!news || !userBookmarks || !Array.isArray(userBookmarks)) {
      return false;
    }

    const isBookmarkedNow = userBookmarks.some((bookmark) => {
      // --- DEBUGGING LOG INSIDE THE COMPARISON ---
      // These logs will now correctly display the bookmark properties
      console.log(
        `  Comparing bookmark: ID=${bookmark._id}, Source=${bookmark.source}`
      );
      console.log(`  with news: ID=${news._id}, Source=${news.source}`);
      // ------------------------------------------

      // **CRUCIAL: Match _id from the bookmark (which is the news article's _id)
      // and 'source' from the bookmark (which is the news article's source)
      // against the current 'news' object's _id and source.**
      return bookmark._id === news._id && bookmark.source === news.source;
    });
    console.log(
      `Calculated isBookmarked for "${news.title}": ${isBookmarkedNow}`
    ); // DEBUG
    return isBookmarkedNow;
  }, [news, userBookmarks]); // This function re-runs if 'news' or 'userBookmarks' changes

  // State to store if this specific article is bookmarked
  const [isBookmarked, setIsBookmarked] = useState(calculateIsBookmarked);
  // State to prevent multiple clicks while an API call is in progress
  const [isBookmarking, setIsBookmarking] = useState(false);

  // This useEffect hook runs whenever 'userBookmarks' or 'news' changes
  // It ensures the 'isBookmarked' state is always up-to-date
  useEffect(() => {
    // We call calculateIsBookmarked here to re-evaluate the state
    // whenever userBookmarks or news changes (e.g., after a bookmark is added/removed)
    setIsBookmarked(calculateIsBookmarked());
  }, [userBookmarks, news, calculateIsBookmarked]); // Dependencies that trigger this effect

  // If news object is somehow missing, don't render anything
  if (!news) return null;

  // Function to handle clicking the bookmark button
  const handleBookmarkToggle = async (event) => {
    event.stopPropagation(); // Stop click from affecting parent elements (e.g., if card is a link)
    event.preventDefault(); // Stop default link behavior (if card is a link)

    if (isBookmarking) return; // If already busy, do nothing

    setIsBookmarking(true); // Set busy state to prevent rapid multiple clicks

    try {
      // Payload to send to the backend for adding/removing a bookmark
      const payload = {
        articleRefId: news._id, // The unique ID of the article (from frontend news object)
        sourceModelName: news.source, // The source identifier (e.g., 'hindu', 'toi') (from frontend news object)
      };

      let response;
      // Decide whether to ADD or REMOVE based on current 'isBookmarked' state
      if (isBookmarked) {
        // If it's currently bookmarked, send a DELETE request to remove it
        response = await axios.delete(
          "http://localhost:5000/api/news/bookmarks/remove",
          { data: payload } // For DELETE, payload goes in 'data' property
        );
        console.log("Backend response for removal:", response.data.message);
      } else {
        // If it's NOT bookmarked, send a POST request to add it
        response = await axios.post(
          "http://localhost:5000/api/news/bookmarks/add",
          payload
        );
        console.log("Backend response for addition:", response.data.message);
      }

      // If the API call was successful, update the UI state
      setIsBookmarked((prev) => !prev); // Optimistically toggle the bookmark state in UI
      console.log(
        `Bookmark toggle successful for "${
          news.title
        }". New UI state: ${!isBookmarked}`
      );

      // Tell the parent component (Home.jsx) to re-fetch bookmarks
      // This is crucial to keep the `userBookmarks` prop (passed to all NewsCards) up-to-date
      if (onBookmarkToggleSuccess) {
        onBookmarkToggleSuccess();
      }
    } catch (error) {
      // --- ERROR HANDLING ---
      console.error(
        `Error during bookmark toggle for "${news.title}":`,
        error.response ? error.response.data : error.message
      );

      let errorMessage = "Failed to update bookmark. Please try again.";
      if (error.response && error.response.status === 409) {
        // If backend says 409 Conflict, it means we tried to ADD but it's already there
        if (!isBookmarked) {
          // If frontend thought it was NOT bookmarked but backend says 409
          errorMessage = "This article was already bookmarked. UI Syncing.";
          setIsBookmarked(true); // Force UI to show it as bookmarked
        } else {
          // This case theoretically shouldn't happen if frontend thought it was bookmarked
          // and tried to DELETE, but got 409. It implies a mismatch.
          errorMessage = "Unexpected conflict. UI Syncing.";
          // Optionally, you might want to re-fetch all bookmarks here to ensure full sync
          if (onBookmarkToggleSuccess) {
            onBookmarkToggleSuccess();
          }
        }
      } else if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message; // Use specific error message from backend if available
      }
      alert(errorMessage); // Show alert to user
    } finally {
      setIsBookmarking(false); // Always reset busy state when the API call is done
    }
  };

  // --- JSX (what the component displays) ---
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-md transition hover:shadow-lg relative">
      <a href={news.link} target="_blank" rel="noopener noreferrer">
        <h2 className="text-xl font-semibold text-blue-400 hover:underline">
          {news.title}
        </h2>
      </a>

      {/* Bookmark Icon */}
      <div
        className={`absolute top-4 right-4 cursor-pointer text-2xl transition-all duration-300 ease-in-out ${
          isBookmarked
            ? "text-blue-500 hover:text-blue-400" // **HIGHLIGHTED COLOR for bookmarked**
            : "text-gray-500 hover:text-gray-400" // Default color when not bookmarked
        }`}
        onClick={handleBookmarkToggle}
        aria-label={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
        title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
      >
        {isBookmarking ? (
          <span className="animate-spin text-gray-400">🔄</span> // Loading spinner
        ) : isBookmarked ? (
          <FaBookmark /> // Solid bookmark icon (for bookmarked)
        ) : (
          <FaRegBookmark /> // Outline bookmark icon (for not bookmarked)
        )}
      </div>

      {news.description && (
        <p className="text-gray-300 mt-2 text-sm">{news.description}</p>
      )}
      <div className="mt-4 text-gray-400 text-xs flex justify-between">
        {news.source && <span>{news.source}</span>}
        {news.publishedAt && (
          <span>{new Date(news.publishedAt).toLocaleString()}</span>
        )}
      </div>
    </div>
  );
}
