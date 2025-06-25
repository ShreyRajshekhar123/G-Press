// src/components/NewsCard.jsx

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { toast } from "react-toastify";
import { FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// This helper function is CRITICAL for ensuring consistent source naming
// across frontend and backend.
// 'type' can be 'configKey' (for URL/sourceConfig lookup, e.g., 'hindu')
// or 'modelName' (for Mongoose model name/enum, e.g., 'TheHindu')
const formatSourceForBackend = (source, type) => {
  if (!source) return "";
  const lowerSource = source.toLowerCase();

  // Define explicit mappings for both configKey and modelName
  const sourceMap = {
    // Frontend news.source value (can be "The Hindu", "hindu", etc.)
    // Mapped to backend configKey and modelName
    "the hindu": { configKey: "hindu", modelName: "TheHindu" },
    hindu: { configKey: "hindu", modelName: "TheHindu" },
    "dna india": { configKey: "dna", modelName: "DNA" },
    dna: { configKey: "dna", modelName: "DNA" },
    "hindustan times": {
      configKey: "hindustan-times", // This matches your backend configKey in sourceConfig
      modelName: "HindustanTimes", // This is the CORRECT Mongoose model name for the User schema enum
    },
    // Adding an explicit map for the hyphenated version if it happens to be the input
    "hindustan-times": {
      // If news.source comes as "hindustan-times" directly
      configKey: "hindustan-times",
      modelName: "HindustanTimes",
    },
    "times of india": { configKey: "toi", modelName: "TimesOfIndia" },
    toi: { configKey: "toi", modelName: "TimesOfIndia" },
    "indian express": { configKey: "ie", modelName: "IndianExpress" },
    ie: { configKey: "ie", modelName: "IndianExpress" },
    // Add any other sources you have in your database/config
  };

  const entry = sourceMap[lowerSource];

  if (entry) {
    return type === "configKey" ? entry.configKey : entry.modelName;
  }

  // Fallback for cases not explicitly mapped:
  console.warn(
    `[formatSourceForBackend] No direct map for '${source}'. Falling back.`
  );
  if (type === "configKey") {
    return lowerSource.replace(/ /g, "-");
  } else if (type === "modelName") {
    return lowerSource
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  }
  return lowerSource; // Default if nothing matches
};

export default function NewsCard({
  news,
  userId, // This is firebaseUid
  userBookmarks, // This is the array of populated bookmark objects from the backend
  onBookmarkToggleSuccess,
  currentUser, // Firebase user object - THIS IS KEY FOR AUTHENTICATION
}) {
  console.log("--- NewsCard Render ---");
  console.log("NewsCard received currentUser:", currentUser); // DEBUG: Check currentUser on render
  console.log("Article Object received:", news);
  console.log("Article Title:", news ? news.title : "N/A");
  console.log(
    "Article ID (news._id):",
    news ? news._id : "N/A",
    "Type:",
    typeof news?._id
  );

  // Use the full article details for rendering, whether it's from the main feed or bookmarks
  // This ensures all displayed data comes from a consistent structure
  const displayNews = news.articleDetails ? news.articleDetails : news;

  // Determine the correct source string for the news object being displayed
  // If it's from main news feed, it's news.source (e.g., "hindu").
  // If it's a bookmarked article, it's nested in news.articleDetails.source (e.g., "The Hindu").
  const currentNewsSource = displayNews.source; // Simplified this line
  console.log(
    "Current News Source (raw):",
    currentNewsSource,
    "Type:",
    typeof currentNewsSource
  );
  console.log("userBookmarks received in NewsCard:", userBookmarks);

  const navigate = useNavigate();

  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState(null);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  // CRITICAL FIX: calculateIsBookmarked logic
  // This must correctly compare the current 'news' item with 'userBookmarks'
  // which are now populated from the backend.
  const calculateIsBookmarked = useCallback(() => {
    if (!displayNews || !userBookmarks || !Array.isArray(userBookmarks)) {
      return false;
    }

    const newsArticleId = String(displayNews._id); // The ID of the article in this card
    // Convert the news.source to the Mongoose Model Name for comparison with bookmark.articleSourceModel
    const newsSourceModelName = formatSourceForBackend(
      currentNewsSource,
      "modelName"
    );

    const isBookmarkedNow = userBookmarks.some((bookmarkedItem) => {
      // `bookmarkedItem` is now the full bookmark subdocument from the backend:
      // { _id: "bookmarkSubdocumentID", articleId: "articleMongoId", articleSourceModel: "TheHindu", bookmarkedAt: "date", articleDetails: { ...fullArticle... } }
      // So, compare newsArticleId with `bookmarkedItem.articleId`
      // and newsSourceModelName with `bookmarkedItem.articleSourceModel`

      const bookmarkedArticleId = bookmarkedItem.articleId
        ? String(bookmarkedItem.articleId)
        : null;
      const bookmarkedSourceModel = bookmarkedItem.articleSourceModel;

      const idMatch = newsArticleId === bookmarkedArticleId;
      const sourceMatch = newsSourceModelName === bookmarkedSourceModel;

      return idMatch && sourceMatch;
    });

    console.log(
      `Calculated isBookmarked for "${displayNews.title}" (ID: ${newsArticleId}, SourceModel: ${newsSourceModelName}): ${isBookmarkedNow}`
    );
    return isBookmarkedNow;
  }, [displayNews, userBookmarks, currentNewsSource]); // Add currentNewsSource to dependencies

  useEffect(() => {
    if (displayNews && userBookmarks) {
      setIsBookmarked(calculateIsBookmarked());
    }
  }, [userBookmarks, displayNews, calculateIsBookmarked]);

  // Essential check to prevent rendering issues if data is missing
  if (
    !displayNews ||
    !displayNews._id ||
    !displayNews.link ||
    !displayNews.source
  ) {
    console.warn(
      "NewsCard skipping render due to missing essential news data in displayNews:",
      displayNews
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
      // Define headers here to be used by axios
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        // If no token, and it's a protected route, it will fail.
        // It's good to provide user feedback.
        toast.error("Authentication token missing. Please re-login.");
        setIsBookmarking(false);
        return; // Exit early if no token
      }

      // Payload for adding a bookmark (for POST request)
      const payload = {
        articleId: displayNews._id, // This is the MongoDB _id of the article
        articleSourceModel: formatSourceForBackend(
          currentNewsSource,
          "modelName"
        ), // e.g., "TheHindu", "DNA", "HindustanTimes"
      };

      console.log("Payload being sent for bookmarking:", payload);

      let response;
      if (isBookmarked) {
        // --- START CRITICAL FIX FOR DELETE URL ---
        // Find the actual bookmark _id from the userBookmarks array
        // This is the _id of the subdocument in the User's bookmarks array
        const bookmarkToDelete = userBookmarks.find(
          (bookmarkedItem) =>
            String(bookmarkedItem.articleId) === String(displayNews._id) &&
            bookmarkedItem.articleSourceModel === payload.articleSourceModel
        );

        if (!bookmarkToDelete) {
          console.warn(
            `Bookmark to remove for article ID ${displayNews._id} not found in local userBookmarks. UI might be out of sync.`
          );
          toast.error(
            "Bookmark to remove not found locally. Re-syncing bookmarks."
          );
          setIsBookmarking(false);
          if (onBookmarkToggleSuccess) onBookmarkToggleSuccess(); // Force a re-sync from parent
          return;
        }

        const deleteUrl = `${process.env.REACT_APP_BACKEND_URI}api/news/bookmark/${bookmarkToDelete._id}`;
        console.log("Attempting to DELETE bookmark from URL:", deleteUrl);
        response = await axios.delete(deleteUrl, { headers: headers }); // Pass headers here
        // --- END CRITICAL FIX ---

        console.log("Backend response for removal:", response.data.message);
        toast.success(response.data.message || "Bookmark removed!");
      } else {
        // POST remains the same, as it correctly uses the request body
        console.log("Attempting to POST bookmark with payload:", payload);
        response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URI}api/news/bookmark`,
          payload,
          { headers: headers } // Pass headers here
        );
        console.log("Backend response for addition:", response.data.message);
        toast.success(response.data.message || "Bookmark added!");
      }

      // Optimistic UI update only if the operation succeeded
      setIsBookmarked((prev) => !prev);
      console.log(
        `Bookmark toggle successful for "${
          displayNews.title
        }". New UI state: ${!isBookmarked}`
      );

      if (onBookmarkToggleSuccess) {
        onBookmarkToggleSuccess(); // Trigger re-fetch of bookmarks in parent (Home.jsx)
      }
    } catch (error) {
      console.error(
        `Error during bookmark toggle for "${displayNews.title}":`,
        error.response ? error.response.data : error.message,
        error.response ? `Status: ${error.response.status}` : ""
      );

      let errorMessage = "Failed to update bookmark. Please try again.";
      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = "This article was already bookmarked. UI Syncing.";
          setIsBookmarked(true); // Ensure UI reflects bookmarked state
          if (onBookmarkToggleSuccess) onBookmarkToggleSuccess(); // Re-sync bookmarks
        } else if (error.response.status === 404) {
          // If we tried to delete and got 404, or the delete URL was wrong
          errorMessage =
            "Bookmark removal failed: Bookmark not found on server or incorrect URL. UI Syncing.";
          // If we got a 404 while trying to delete, it means it's probably already gone, so reflect unbookmarked state
          setIsBookmarked(false);
          if (onBookmarkToggleSuccess) onBookmarkToggleSuccess();
        } else if (
          error.response.status === 400 &&
          error.response.data.message?.includes("Invalid article ID format")
        ) {
          errorMessage = "Invalid article ID. Please try again.";
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 401) {
          // Added specific handling for 401
          errorMessage = "Unauthorized: Please log in again.";
          navigate("/login"); // Redirect to login page
        }
      }
      toast.error(errorMessage);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleGenerateQuestions = async (event) => {
    event.stopPropagation();
    event.preventDefault();

    console.log("handleGenerateQuestions clicked!"); // DEBUG: Log when button is clicked
    console.log("currentUser at click time:", currentUser); // DEBUG: Check currentUser at the moment of click

    if (isGeneratingQuestions) return;

    if (!currentUser) {
      console.log("currentUser is NULL, showing error toast."); // DEBUG: Log if currentUser is null
      toast.error("Please log in to generate questions.");
      navigate("/login"); // Redirect to login if user is not authenticated
      return;
    }

    setIsGeneratingQuestions(true);
    setQuestionsError(null);

    try {
      const token = await currentUser.getIdToken(); // Get the Firebase ID token
      console.log("Successfully got Firebase ID Token. Length:", token.length); // DEBUG: Log token existence
      // Define headers with the Authorization token
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Use 'configKey' type for the URL segment to match backend's sourceConfig keys (lowercase)
      const sourceKeyForURL = formatSourceForBackend(
        currentNewsSource,
        "configKey"
      );
      const url = `${process.env.REACT_APP_BACKEND_URI}api/questions/generate-on-demand/${sourceKeyForURL}/${displayNews._id}`;

      console.log(
        `[NewsCard] Attempting to trigger question generation from: ${url}`
      );
      console.log("Request Headers being sent:", headers); // DEBUG: Log headers being sent to API

      await axios.get(url, { headers: headers });

      console.log("API call for question generation successful!"); // DEBUG: Log success

      toast.success("Generating questions... Redirecting to questions page.");

      // Navigate to the questions page with necessary parameters
      navigate(
        `/questions/${
          displayNews._id
        }?source=${sourceKeyForURL}&title=${encodeURIComponent(
          displayNews.title
        )}`
      );
    } catch (err) {
      console.error(
        "Error triggering question generation (full object):",
        err // DEBUG: Log the full error object
      );
      console.error(
        "Error response data:",
        err.response?.data,
        "Status:",
        err.response?.status
      ); // DEBUG: Log response details

      let errorMessage =
        err.response?.data?.message ||
        "Failed to generate questions. Please try again.";

      if (err.response && err.response.status === 401) {
        errorMessage =
          "Unauthorized: Please log in again to generate questions.";
        navigate("/login"); // Redirect to login if unauthorized
      }

      setQuestionsError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Helper to format source name for display (e.g., "hindu" -> "The Hindu")
  const formatSourceName = (source) => {
    if (!source) return "N/A";
    const lowerSource = source.toLowerCase();
    switch (lowerSource) {
      case "hindu":
      case "the hindu": // Added for robustness if display name comes directly
        return "The Hindu";
      case "dna":
      case "dna india": // Added for robustness
        return "DNA India";
      case "hindustan-times":
      case "hindustan times": // Added for robustness
        return "Hindustan Times";
      case "toi":
      case "times of india": // Added for robustness
        return "Times of India";
      case "ie":
      case "indian express": // Added for robustness
        return "Indian Express";
      case "general": // Handle the "General" category if it's explicitly set as a source
        return "General";
      default:
        // Attempt to format gracefully if not explicitly mapped
        return source
          .replace(/-/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
    }
  };

  return (
    <div
      className="bg-app-bg-secondary border border-app-gray-border rounded-xl p-4 shadow-md transition-all duration-300 ease-in-out
                 relative z-0 hover:z-10 hover:scale-105 hover:shadow-2xl
                 flex flex-col justify-between"
    >
      <div>
        <a href={displayNews.link} target="_blank" rel="noopener noreferrer">
          {/* Adjusted title text color for better contrast on dark background */}
          <h2 className="text-xl font-semibold text-app-text-primary hover:underline line-clamp-3">
            {displayNews.title}
          </h2>
        </a>
        {userId && (
          <div
            className={`absolute top-4 right-4 cursor-pointer text-2xl transition-all duration-300 ease-in-out ${
              isBookmarking
                ? "text-app-text-secondary" // Spinner color
                : isBookmarked
                ? "text-app-blue-main hover:text-app-blue-light" // Bookmarked color
                : "text-gray-400 hover:text-app-blue-main" // Unbookmarked color, using a more visible gray
            }`}
            onClick={handleBookmarkToggle}
            aria-label={
              isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"
            }
            title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
          >
            {isBookmarking ? (
              <FaSpinner className="animate-spin text-app-text-secondary" />
            ) : isBookmarked ? (
              <FaBookmark />
            ) : (
              <FaRegBookmark />
            )}
          </div>
        )}
        {displayNews.imageUrl && (
          <img
            src={displayNews.imageUrl}
            alt={displayNews.title}
            className="w-full h-48 object-cover rounded-md mt-3 mb-2"
          />
        )}
        {displayNews.description && (
          <p className="text-app-text-secondary mt-2 text-sm line-clamp-4">
            {displayNews.description}
          </p>
        )}
      </div>
      <div className="mt-4 text-app-text-secondary text-xs flex justify-between items-center">
        <div className="flex flex-wrap gap-1">
          {displayNews.categories && displayNews.categories.length > 0 ? (
            displayNews.categories.map((category, index) => (
              <span
                key={index}
                // Adjusted category tag background and text color for better visibility
                className="bg-app-gray-border text-app-text-primary px-2 py-0.5 rounded-full text-xs font-medium"
              >
                {category}
              </span>
            ))
          ) : (
            <span className="bg-app-gray-border text-app-text-primary px-2 py-0.5 rounded-full text-xs font-medium">
              General
            </span>
          )}
        </div>
        {displayNews.publishedAt && (
          <span className="whitespace-nowrap">
            {new Date(displayNews.publishedAt).toLocaleString()}
          </span>
        )}
      </div>
      {/* Adjusted source text color for better visibility */}
      <div className="mt-2 text-app-text-secondary text-sm font-medium">
        Source: {formatSourceName(displayNews.source)}
      </div>
      <button
        onClick={handleGenerateQuestions}
        className={`mt-4 w-full py-2 px-4 rounded-lg font-bold transition-colors duration-200 flex items-center justify-center
                    ${
                      isGeneratingQuestions
                        ? "bg-app-bg-primary text-app-text-secondary cursor-not-allowed"
                        : "bg-app-blue-main text-white hover:bg-app-blue-light"
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
    </div>
  );
}
