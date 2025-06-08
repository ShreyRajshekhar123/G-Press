import React, { useState, useCallback } from "react"; // Removed useEffect
import axios from "axios";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";

export default function NewsCard({
  news,
  userId,
  userBookmarks, // This prop contains the array of bookmarked article references
  onBookmarkToggleSuccess,
}) {
  // news.source now consistently has the source slug (e.g., 'hindu', 'toi') from NewsTabs
  // news._id is the unique ID of the article in its specific collection

  // Calculate `isBookmarked` directly from props, no local state needed
  // This will re-calculate every time `news` or `userBookmarks` props change,
  // ensuring the icon and toggle logic is always up-to-date.
  const isBookmarked =
    news &&
    userBookmarks &&
    Array.isArray(userBookmarks) &&
    userBookmarks.some(
      (bookmark) =>
        bookmark.articleRefId === news._id &&
        bookmark.sourceModelName === news.source
    );

  const [isBookmarking, setIsBookmarking] = useState(false); // Only for preventing double clicks

  if (!news) return null; // Defensive check if news object is not passed

  const handleBookmarkToggle = async (event) => {
    event.stopPropagation();
    event.preventDefault();

    if (isBookmarking) return;

    setIsBookmarking(true);

    try {
      const payload = {
        articleRefId: news._id,
        sourceModelName: news.source,
      };

      let response;
      if (isBookmarked) {
        // If it's currently bookmarked (based on prop), try to remove it
        response = await axios.delete(
          "http://localhost:5000/api/news/bookmarks/remove",
          { data: payload }
        );
        console.log("Backend response for removal:", response.data.message);
      } else {
        // If it's currently NOT bookmarked (based on prop), try to add it
        response = await axios.post(
          "http://localhost:5000/api/news/bookmarks/add",
          payload
        );
        console.log("Backend response for addition:", response.data.message);
      }

      // On successful operation, re-fetch bookmarks to update `userBookmarks` prop in Home.jsx
      // This will then automatically update `isBookmarked` in NewsCard (due to prop change)
      if (onBookmarkToggleSuccess) {
        onBookmarkToggleSuccess();
      }
      console.log(`Bookmark toggle successful for "${news.title}".`);
    } catch (error) {
      console.error(
        `Error during bookmark toggle for "${news.title}":`,
        error.response ? error.response.data : error.message
      );

      let errorMessage = "Failed to update bookmark. Please try again.";
      if (error.response && error.response.status === 409) {
        // This means the frontend thought it was NOT bookmarked (sent POST /add)
        // but the backend says it IS. The UI is out of sync.
        // We just re-fetch bookmarks to fix it.
        errorMessage =
          "Bookmark status out of sync. Re-fetching bookmarks to correct.";
        if (onBookmarkToggleSuccess) {
          onBookmarkToggleSuccess(); // Re-fetch to sync
        }
      } else if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
      }
      alert(errorMessage);
    } finally {
      setIsBookmarking(false);
    }
  };

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
            ? "text-blue-500 hover:text-blue-400" // Highlighted color when bookmarked
            : "text-gray-500 hover:text-gray-400" // Default color when not bookmarked
        }`}
        onClick={handleBookmarkToggle}
        aria-label={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
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

      {news.description && (
        <p className="text-gray-300 mt-2 text-sm">{news.description}</p>
      )}
      <div className="mt-4 text-gray-400 text-xs flex justify-between">
        {news.source && <span>{news.source}</span>}{" "}
        {news.publishedAt && (
          <span>{new Date(news.publishedAt).toLocaleString()}</span>
        )}{" "}
      </div>
    </div>
  );
}
