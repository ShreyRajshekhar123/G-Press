// src/components/NewsCard.jsx

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { toast } from "react-toastify";
// Import FaSpinner for a nice loading icon
import { FaSpinner } from "react-icons/fa";

export default function NewsCard({
  news,
  userId,
  userBookmarks,
  onBookmarkToggleSuccess,
  currentUser,
}) {
  // --- Existing Debugging Logs (keep for now if needed) ---
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

  // --- NEW STATE FOR AI QUESTION GENERATION ---
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [questionsError, setQuestionsError] = useState(null);
  // ------------------------------------------------------------------

  const calculateIsBookmarked = useCallback(() => {
    if (!news || !userBookmarks || !Array.isArray(userBookmarks)) {
      return false;
    }

    const isBookmarkedNow = userBookmarks.some((bookmarkedArticle) => {
      const articleIdString = String(news._id);
      const bookmarkedArticleIdString = bookmarkedArticle._id
        ? String(bookmarkedArticle._id)
        : "";

      const idMatch = articleIdString === bookmarkedArticleIdString;
      const sourceMatch = bookmarkedArticle.source === news.source;

      return idMatch && sourceMatch;
    });
    console.log(
      `Calculated isBookmarked for "${news.title}": ${isBookmarkedNow}`
    );
    return isBookmarkedNow;
  }, [news, userBookmarks]);

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
        articleRefId: news._id,
        sourceModelName: news.source,
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
          setIsBookmarked(true);
          onBookmarkToggleSuccess();
        } else if (error.response.status === 404) {
          errorMessage =
            "Bookmark not found on server for removal. UI Syncing.";
          setIsBookmarked(false);
          onBookmarkToggleSuccess();
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      toast.error(errorMessage);
    } finally {
      setIsBookmarking(false);
    }
  };

  // --- NEW: Function to handle AI question generation ---
  const handleGenerateQuestions = async () => {
    if (isGeneratingQuestions) return; // Prevent multiple clicks

    setIsGeneratingQuestions(true);
    setQuestionsError(null);
    setGeneratedQuestions([]); // Clear previous questions

    try {
      // No need for authentication token for this endpoint, as it's not user-specific
      // Unless you later decide to limit AI calls to logged-in users.
      const response = await axios.post(
        "http://localhost:5000/api/ai/generate-questions",
        {
          articleId: news._id, // Send ID for potential future storage
          articleLink: news.link, // CRITICAL: This is what the backend will scrape
          articleSource: news.source, // CRITICAL: To pick the right scraper function
          articleTitle: news.title,
        }
      );

      if (
        response.data &&
        Array.isArray(response.data.questions) &&
        response.data.questions.length > 0
      ) {
        setGeneratedQuestions(response.data.questions);
        setShowQuestionsModal(true);
        toast.success("Questions generated successfully!");
      } else {
        setQuestionsError("No questions could be generated for this article.");
        toast.warn("No questions generated.");
      }
    } catch (err) {
      console.error(
        "Error generating questions:",
        err.response ? err.response.data : err.message
      );
      setQuestionsError(
        err.response?.data?.message ||
          "Failed to generate questions. Please try again."
      );
      toast.error(
        err.response?.data?.message || "Failed to generate questions."
      );
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // --- New Function to format source name for display ---
  const formatSourceName = (source) => {
    if (!source) return "N/A";
    const formatted = source
      .replace(/-/g, " ") // Replace hyphens with spaces
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
      .join(" ");
    // Specific replacements for common short forms
    switch (formatted) {
      case "Toi":
        return "Times of India";
      case "Ie":
        return "Indian Express";
      case "Dna":
        return "DNA India";
      case "Hindu":
        return "The Hindu";
      case "Hindustan Times":
        return "Hindustan Times"; // Keep as is
      default:
        return formatted;
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-md transition hover:shadow-lg relative flex flex-col justify-between">
      <div>
        {" "}
        {/* Wrapper for content above buttons */}
        <a href={news.link} target="_blank" rel="noopener noreferrer">
          <h2 className="text-xl font-semibold text-blue-400 hover:underline line-clamp-3">
            {news.title}
          </h2>
        </a>
        {/* Bookmark Button */}
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
      </div>

      {/* Source and Publish Date */}
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
          <span className="whitespace-nowrap">
            {new Date(news.publishedAt).toLocaleString()}
          </span>
        )}
      </div>

      {/* Display formatted source name */}
      <div className="mt-2 text-blue-300 text-sm font-medium">
        Source: {formatSourceName(news.source)}
      </div>

      {/* --- NEW: Generate Questions Button --- */}
      <button
        onClick={handleGenerateQuestions}
        className={`mt-4 w-full py-2 px-4 rounded-lg font-bold transition-colors duration-200 flex items-center justify-center
                    ${
                      isGeneratingQuestions
                        ? "bg-blue-800 text-blue-200 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
        disabled={isGeneratingQuestions}
      >
        {isGeneratingQuestions ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Generating Questions...
          </>
        ) : (
          "Generate Questions (AI)"
        )}
      </button>
      {/* --- END NEW BUTTON --- */}

      {/* --- NEW: Questions Modal --- */}
      {showQuestionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto relative border border-gray-700 shadow-xl">
            <h3 className="text-2xl font-bold text-blue-400 mb-4">
              Questions for "{news.title}"
            </h3>
            {questionsError ? (
              <p className="text-red-400">{questionsError}</p>
            ) : generatedQuestions.length > 0 ? (
              <ol className="list-decimal list-inside text-gray-200 space-y-2">
                {generatedQuestions.map((q, index) => (
                  <li key={index}>{q}</li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-400">No questions generated.</p>
            )}
            <button
              onClick={() => setShowQuestionsModal(false)}
              className="mt-6 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* --- END NEW MODAL --- */}
    </div>
  );
}
