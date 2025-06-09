// src/components/NewsFeed.jsx

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import NewsCard from "./NewsCard";
import { toast } from "react-toastify";

export default function NewsFeed({
    mainActiveTab, // 'all', 'current-affairs', 'bookmarks', 'hindu', 'search', etc.
    userId,
    userBookmarks, // This is the up-to-date list of bookmarks from Home/SearchPage
    onBookmarkToggleSuccess,
    searchTerm,    // Passed from Home or SearchPage
    currentUser,
    newsData,      // <--- NEW PROP: Optional pre-fetched news data (used by SearchPage)
}) {
    // newsItems will either be the data fetched internally OR the newsData passed as prop
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNews = useCallback(async () => {
        setLoading(true);
        setError(null);

        // Priority 1: If newsData is provided (e.g., from SearchPage), use it directly
        if (newsData !== undefined && Array.isArray(newsData)) {
            setNewsItems(newsData);
            setLoading(false);
            return;
        }

        // Priority 2: Fetch based on mainActiveTab if newsData is not provided
        let url = "";
        let requestHeaders = {};

        if (mainActiveTab === "all") {
            url = `http://localhost:5000/api/news/all`;
        } else if (mainActiveTab === "current-affairs") {
            url = `http://localhost:5000/api/news/current-affairs`;
        } else if (mainActiveTab === "bookmarks") {
            if (!userId) {
                setNewsItems([]);
                setLoading(false);
                return; // Don't fetch bookmarks if no user
            }
            url = `http://localhost:5000/api/news/user/${userId}/bookmarks`;
            const token = currentUser ? await currentUser.getIdToken() : null;
            if (token) {
                requestHeaders = { Authorization: `Bearer ${token}`, "x-user-id": userId };
            }
        } else if (mainActiveTab && mainActiveTab !== "search") { // Specific news sources
            url = `http://localhost:5000/api/news/${mainActiveTab}`;
        }
        // Removed the searchTerm condition here, as SearchPage will pass newsData or handle its own fetching.
        // If NewsFeed was ever to fetch by search term itself, it would go here.
        // For now, SearchPage fetches and passes `newsData`.

        if (!url) {
            setNewsItems([]);
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(url, { headers: requestHeaders });
            setNewsItems(response.data);
            console.log(`Fetched news for ${mainActiveTab}:`, response.data);
        } catch (err) {
            console.error(`Error fetching news for ${mainActiveTab}:`, err.response ? err.response.data : err.message);
            setError("Failed to fetch news. Please try again later.");
            toast.error("Failed to load news articles for this category.");
            setNewsItems([]);
        } finally {
            setLoading(false);
        }
    }, [mainActiveTab, userId, currentUser, newsData]); // searchTerm removed as a direct trigger for internal fetch

    useEffect(() => {
        // Trigger fetch only if newsData is NOT provided, or if the mainActiveTab changes
        // This ensures NewsFeed either displays provided data or fetches its own based on tab.
        if (newsData === undefined) { // If newsData is not passed from parent
             fetchNews();
        } else {
            // If newsData is provided, just update state and stop loading
            setNewsItems(newsData);
            setLoading(false);
        }
    }, [mainActiveTab, newsData, fetchNews]); // Re-run effect if mainActiveTab or newsData changes

    if (loading) {
        return <div className="text-center text-blue-400 text-xl mt-10">Loading news...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 text-xl mt-10">{error}</div>;
    }

    // Special message if no news items after loading
    if (newsItems.length === 0) {
        // This message might need to be dynamic or specific per context
        // e.g., "No bookmarks found", "No news for this source", etc.
        // For now, a general message:
        return (
            <div className="text-center text-gray-400 text-xl mt-10">
                No articles found for this category or search.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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