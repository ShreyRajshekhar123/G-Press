// src/pages/BookmarkPage.jsx
import React, { useEffect, useState, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext"; // Assuming you have an AuthContext
import { NotificationContext } from "../context/NotificationContext"; // For user feedback
import NewsCard from "../components/NewsCard"; // Your existing NewsCard component
import api from "../api"; // Your Axios instance

export default function BookmarkPage() {
  const { currentUser } = useContext(AuthContext);
  const { showNotification } = useContext(NotificationContext);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch bookmarks
  const fetchBookmarks = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      setError("Please log in to view bookmarks.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/news/bookmarks", {
        headers: {
          Authorization: `Bearer ${await currentUser.getIdToken()}`,
        },
      });
      setBookmarks(response.data);
      console.log("Fetched bookmarks:", response.data); // Inspect this!
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
      setError("Failed to load bookmarks. Please try again.");
      showNotification("Failed to load bookmarks.", "error");
    } finally {
      setLoading(false);
    }
  }, [currentUser, showNotification]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Handler for unbookmarking from this page
  const handleUnbookmark = useCallback(
    async (articleId, articleSourceModel) => {
      if (!currentUser) {
        showNotification("Please log in to unbookmark.", "error");
        return;
      }
      try {
        // The DELETE request expects articleId and articleSourceModel in params
        const token = await currentUser.getIdToken();
        await api.delete(`/news/bookmark/${articleId}/${articleSourceModel}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        showNotification("Bookmark removed successfully!", "success");
        // Re-fetch bookmarks to update the list
        await fetchBookmarks();
      } catch (err) {
        console.error("Error removing bookmark:", err);
        const errorMessage =
          err.response?.data?.message || "Failed to remove bookmark.";
        showNotification(errorMessage, "error");
      }
    },
    [currentUser, fetchBookmarks, showNotification]
  );

  if (loading)
    return (
      <div className="text-center p-4 text-app-text-primary">
        Loading bookmarks...
      </div>
    );
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>; // Keep specific error color if desired
  if (bookmarks.length === 0)
    return (
      <div className="text-center p-4 text-app-text-primary">
        No bookmarks yet.
      </div>
    );

  return (
    <div className="container mx-auto p-4 bg-app-bg-primary min-h-screen text-app-text-primary">
      <h1 className="text-2xl font-bold mb-6 text-app-blue-main">
        Your Bookmarks
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookmarks.map((bookmark) => (
          <NewsCard
            key={bookmark._id} // Use the bookmark's _id as key
            news={bookmark.articleDetails} // Pass the embedded article details
            isBookmarked={true} // It's always bookmarked on this page
            onBookmarkToggle={() =>
              handleUnbookmark(bookmark.articleId, bookmark.articleSourceModel)
            }
            // Optionally pass the original bookmark ID if your toggle needs it
            bookmarkSubdocumentId={bookmark._id}
          />
        ))}
      </div>
    </div>
  );
}
