// C:\Users\OKKKK\Desktop\G-Press\G-Press\src\components\NewsCard.jsx
import React from "react";

export default function NewsCard({ news }) {
  if (!news) return null; // Defensive check

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-md transition hover:shadow-lg">
      <a href={news.link} target="_blank" rel="noopener noreferrer">
        <h2 className="text-xl font-semibold text-blue-400 hover:underline">
          {news.title}
        </h2>
      </a>
      {/* Check if description exists before rendering */}
      {news.description && (
        <p className="text-gray-300 mt-2 text-sm">{news.description}</p>
      )}
      <div className="mt-4 text-gray-400 text-xs flex justify-between">
        {news.source && <span>{news.source}</span>}{" "}
        {/* Check if source exists */}
        {news.publishedAt && (
          <span>{new Date(news.publishedAt).toLocaleString()}</span>
        )}{" "}
        {/* Check if publishedAt exists */}
      </div>
    </div>
  );
}
