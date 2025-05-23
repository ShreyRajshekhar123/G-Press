// import { useState, useEffect } from "react";
// import axios from "axios";

// const newspapers = [
//   { id: "hindu", name: "The Hindu" },
//   { id: "hindustan-times", name: "Hindustan Times" },
//   { id: "toi", name: "Times of India" },
//   { id: "ie", name: "Indian Express" },
//   { id: "dna", name: "DNA India" },
// ];

// export default function NewsTabs() {
//   const [activeTab, setActiveTab] = useState("hindu");
//   const [articles, setArticles] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const fetchNews = async (source) => {
//     try {
//       setLoading(true);
//       const response = await axios.get(
//         `http://localhost:5000/api/news/${source}`
//       );
//       setArticles(response.data.articles);
//     } catch (error) {
//       console.error("Error fetching news:", error);
//       setArticles([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchNews(activeTab);
//   }, [activeTab]);

//   return (
//     <div className="space-y-6">
//       {/* Tabs */}
//       <div className="flex flex-wrap gap-3 justify-center">
//         {newspapers.map((paper) => (
//           <button
//             key={paper.id}
//             className={`px-4 py-2 rounded-md text-sm font-medium transition ${
//               activeTab === paper.id
//                 ? "bg-blue-600 text-white"
//                 : "bg-gray-800 text-gray-300 hover:bg-gray-700"
//             }`}
//             onClick={() => setActiveTab(paper.id)}
//           >
//             {paper.name}
//           </button>
//         ))}
//       </div>

//       {/* News Cards */}
//       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
//         {loading ? (
//           <p className="text-gray-400 col-span-full text-center">Loading...</p>
//         ) : articles.length === 0 ? (
//           <p className="text-gray-400 col-span-full text-center">
//             No articles found.
//           </p>
//         ) : (
//           articles.map((article, index) => (
//             <div
//               key={index}
//               className="bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition"
//             >
//               <h2 className="text-lg font-semibold mb-2">{article.title}</h2>
//               <p className="text-sm text-gray-400 mb-2">{article.summary}</p>
//               {article.link && (
//                 <a
//                   href={article.link}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-blue-400 hover:underline text-sm"
//                 >
//                   Read more →
//                 </a>
//               )}
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// C:\Users\OKKKK\Desktop\G-Press\G-Press\src\components\NewsTabs.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import NewsCard from "./NewsCard"; // <--- IMPORT YOUR NEWSCARED COMPONENT HERE

const newspapers = [
  { id: "hindu", name: "The Hindu" },
  { id: "hindustan-times", name: "Hindustan Times" },
  { id: "toi", name: "Times of India" },
  { id: "ie", name: "Indian Express" },
  { id: "dna", name: "DNA India" },
];

// Helper function to format source slugs for display
const formatSourceName = (sourceSlug) => {
  if (!sourceSlug) return "";
  if (sourceSlug === "ie") return "Indian Express";
  if (sourceSlug === "dna") return "DNA India";
  if (sourceSlug === "toi") return "Times of India";
  if (sourceSlug === "hindu") return "The Hindu";
  if (sourceSlug === "hindustan-times") return "Hindustan Times";
  // For other sources, replace hyphens and capitalize words
  return sourceSlug
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function NewsTabs() {
  const [activeTab, setActiveTab] = useState("hindu");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Added error state

  const fetchNews = async (source) => {
    setLoading(true);
    setError(null); // Clear any previous error
    setArticles([]); // Clear articles when fetching new ones

    try {
      const response = await axios.get(
        `http://localhost:5000/api/news/${source}`
      );
      // Backend for /api/news/:source sends { articles: [...] }
      // Backend for /api/news/all sends a direct array of articles
      const fetchedArticles =
        source === "all" ? response.data : response.data.articles;
      setArticles(fetchedArticles);
    } catch (err) {
      // Changed error to err for consistency with console.error
      console.error("Error fetching news:", err);
      setError(
        `Failed to load news from ${formatSourceName(
          source
        )}. Please ensure backend is running and data exists.`
      );
      setArticles([]); // Clear articles on error as well
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(activeTab);
  }, [activeTab]);

  return (
    <div className="space-y-6 container mx-auto px-4 py-8">
      {" "}
      {/* Added container for better layout */}
      {/* Tabs */}
      <div className="flex flex-wrap gap-3 justify-center">
        {newspapers.map((paper) => (
          <button
            key={paper.id}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === paper.id
                ? "bg-blue-600 text-white shadow-lg" // More prominent active state
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
            onClick={() => setActiveTab(paper.id)}
          >
            {paper.name}
          </button>
        ))}
      </div>
      {/* News Cards / Loading / Error / No Articles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-gray-400 col-span-full text-center text-lg py-10">
            Loading {formatSourceName(activeTab)} news...
          </p>
        ) : error ? ( // Display error message if present
          <p className="text-red-400 col-span-full text-center text-lg py-10 border border-red-600 p-4 rounded-md bg-red-900 bg-opacity-20 mx-auto max-w-xl">
            {error}
          </p>
        ) : articles.length === 0 ? (
          <p className="text-gray-400 col-span-full text-center text-lg py-10 bg-gray-700 bg-opacity-50 rounded-md mx-auto max-w-xl">
            No articles found for {formatSourceName(activeTab)}. Run the scraper
            for this source if needed.
          </p>
        ) : (
          // <--- THIS IS THE MAIN CHANGE: Render NewsCard component for each article
          articles.map((article) => (
            <NewsCard key={article._id} news={article} />
          ))
        )}
      </div>
    </div>
  );
}
