// C:\Users\OKKKK\Desktop\G-Press\G-Press\Server\routes\news.js

const express = require("express");
const mongoose = require("mongoose");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
// REMOVED: const Article = require('../models/Article'); // This line was problematic and is now gone.
const User = require("../models/User"); // Import the User model

const router = express.Router();

// =========================================================
// Newspaper-specific Mongoose Models
// IMPORT ALL YOUR NEWSPAPER MODELS HERE
// Make sure these paths and model names are correct.
// =========================================================
const Hindu = require("../models/TheHindu");
const HindustanTimes = require("../models/Hindustantimes"); // Assuming this is your model file name
const TOI = require("../models/TimesOfIndia"); // Assuming this is your model file name
const IndianExpress = require("../models/IndianExpress"); // Assuming this is your model file name
const Dna = require("../models/DNA"); // Assuming this is your model file name
// ... import other models as you create them following the same pattern

// Map scraper names to their Mongoose models and file paths
// The 'model' property refers to the imported Mongoose model (e.g., Hindu, HindustanTimes)
// The 'filePath' refers to the actual Python scraper script.
const sourceConfig = {
  hindu: {
    model: Hindu,
    filePath: path.join(__dirname, "../scrapers/hindu_scraper.py"),
  },
  "hindustan-times": {
    // Key must match the `source` parameter used in frontend requests and scraper output
    model: HindustanTimes,
    filePath: path.join(__dirname, "../scrapers/hindustan_scraper.py"),
  },
  toi: {
    // Key must match the `source` parameter used in frontend requests and scraper output
    model: TOI,
    filePath: path.join(__dirname, "../scrapers/times_of_india_scraper.py"),
  },
  ie: {
    // Key must match the `source` parameter used in frontend requests and scraper output
    model: IndianExpress,
    filePath: path.join(__dirname, "../scrapers/indian_express.py"),
  },
  dna: {
    // Key must match the `source` parameter used in frontend requests and scraper output
    model: Dna,
    filePath: path.join(__dirname, "../scrapers/dna_scraper.py"),
  },
  // Add other sources here as you implement their scrapers and models
};

// =========================================================
// CATEGORY KEYWORDS - THIS IS IMPORTANT!
// This object MUST be defined here and ONLY here in news.js.
// =========================================================
const CATEGORY_KEYWORDS = {
  Technology: [
    "tech",
    "software",
    "innovation",
    "digital",
    "gadget",
    "cyber",
    "internet",
    "AI",
    "artificial intelligence",
    "startup",
    "robotics",
    "metaverse",
    "blockchain",
    "app",
    "website",
    "computing",
  ],
  Business: [
    "business",
    "economy",
    "market",
    "finance",
    "company",
    "investment",
    "shares",
    "stock",
    "corporate",
    "trade",
    "GDP",
    "inflation",
    "revenue",
    "profit",
    "merger",
    "acquisition",
    "industry",
  ],
  Politics: [
    "politics",
    "government",
    "election",
    "parliament",
    "congress",
    "policy",
    "bill",
    "vote",
    "democracy",
    "leader",
    "diplomacy",
    "minister",
    "party",
    "protest",
    "legislation",
    "constitution",
  ],
  Sports: [
    "sport",
    "cricket",
    "football",
    "tennis",
    "olympics",
    "game",
    "match",
    "athlete",
    "championship",
    "league",
    "cup",
    "tournament",
    "team",
    "score",
    "player",
  ],
  Entertainment: [
    "entertainment",
    "movie",
    "film",
    "bollywood",
    "hollywood",
    "music",
    "celebrity",
    "art",
    "culture",
    "show",
    "series",
    "actor",
    "actress",
    "director",
    "song",
    "album",
    "concert",
  ],
  Health: [
    "health",
    "medical",
    "disease",
    "hospital",
    "doctor",
    "wellness",
    "fitness",
    "medicine",
    "virus",
    "pandemic",
    "vaccine",
    "cure",
    "treatment",
    "therapy",
    "nutrition",
    "mental health",
  ],
  Science: [
    "science",
    "research",
    "discovery",
    "astronomy",
    "biology",
    "physics",
    "chemistry",
    "space",
    "environment",
    "climate",
    "quantum",
    "experiment",
    "study",
    "data",
  ],
  World: [
    "world",
    "international",
    "global",
    "conflict",
    "crisis",
    "un",
    "nation",
    "country",
    "foreign",
    "geopolitics",
    "summit",
    "treaty",
  ],
  National: [
    "national",
    "india",
    "domestic",
    "indian",
    "government",
    "delhi",
    "mumbai",
    "kolkata",
    "chennai",
    "bangalore",
  ], // Broad category for India-specific news
  Education: [
    "education",
    "school",
    "university",
    "college",
    "student",
    "study",
    "learning",
    "academic",
    "syllabus",
    "exam",
    "admission",
    "literacy",
  ],
  Environment: [
    "environment",
    "climate",
    "pollution",
    "sustainability",
    "ecology",
    "nature",
    "conservation",
    "wildlife",
    "disaster",
    "warming",
    "renewable",
  ],
  Crime: [
    "crime",
    "police",
    "court",
    "arrest",
    "investigation",
    "illegal",
    "justice",
    "murder",
    "theft",
    "fraud",
    "case",
    "convict",
  ],
  Lifestyle: [
    "lifestyle",
    "fashion",
    "food",
    "travel",
    "home",
    "living",
    "wellness",
    "hobby",
    "culture",
    "trend",
    "cuisine",
    "vacation",
    "design",
  ],
  // Add more categories and keywords as needed to improve categorization accuracy
};

// Function to assign categories based on keywords
function assignCategories(articleTitle, articleSummary, articleContent = "") {
  const text = (
    articleTitle +
    " " +
    articleSummary +
    " " +
    articleContent
  ).toLowerCase();
  const categories = new Set(); // Use a Set to avoid duplicate categories

  for (const category in CATEGORY_KEYWORDS) {
    const keywords = CATEGORY_KEYWORDS[category];
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        categories.add(category);
        break; // Found a keyword for this category, move to next category
      }
    }
  }
  return Array.from(categories); // Convert Set to Array
}

// =========================================================
// Helper function to run a single scraper
// This function encapsulates the logic for running a Python scraper
// and storing its output into the corresponding MongoDB model.
// =========================================================
async function runScraperAndStore(sourceName) {
  console.log(
    `[${sourceName} Scraper] Starting scraper: ${sourceConfig[sourceName].filePath}`
  );
  const Model = sourceConfig[sourceName].model; // Get the Mongoose Model for this source
  const scraperPath = sourceConfig[sourceName].filePath; // Get the Python scraper path

  return new Promise((resolve, reject) => {
    // Spawn a Python child process to run the scraper script
    const pythonProcess = spawn("python", [scraperPath]);
    let rawData = ""; // To collect stdout from the Python script
    let errorData = ""; // To collect stderr from the Python script

    // Listen for data from the Python script's stdout
    pythonProcess.stdout.on("data", (data) => {
      rawData += data.toString();
    });

    // Listen for data from the Python script's stderr
    pythonProcess.stderr.on("data", (data) => {
      errorData += data.toString();
    });

    // Listen for the Python process to close
    pythonProcess.on("close", async (code) => {
      console.log(`[${sourceName} Scraper] Process exited with code: ${code}`);
      if (code !== 0) {
        // If the Python script exited with an error code, log and reject
        console.error(
          `[${sourceName} Scraper] Scraper error output:\n${errorData}`
        );
        return reject(
          new Error(
            `Scraper process for ${sourceName} exited with code ${code}`
          )
        );
      }

      try {
        // Attempt to parse the collected stdout data as JSON
        const articles = JSON.parse(rawData);
        console.log(
          `[${sourceName} Scraper] Successfully parsed ${articles.length} articles from scraper output.`
        );

        let newArticlesCount = 0;
        let updatedArticlesCount = 0;
        let skippedArticlesCount = 0;

        // Iterate over each article received from the scraper
        for (const articleData of articles) {
          try {
            // Basic validation: ensure essential fields exist
            if (!articleData.link || !articleData.title) {
              console.warn(
                `[${sourceName} Scraper] Skipping article due to missing link or title:`,
                articleData
              );
              skippedArticlesCount++;
              continue;
            }

            // Assign categories using the defined keywords
            const categories = assignCategories(
              articleData.title,
              articleData.summary || "",
              articleData.content || ""
            );

            // Prepare data for update/insert operation
            const updateData = {
              title: articleData.title,
              description:
                articleData.summary || articleData.description || null,
              content: articleData.content || null,
              imageUrl: articleData.imageUrl || null,
              publishedAt: articleData.publishedAt
                ? new Date(articleData.publishedAt)
                : null,
              author: articleData.author || null,
              categories: categories, // Add the assigned categories
              lastScrapedAt: new Date(), // Mark when this article was last scraped/updated
            };

            // Use findOneAndUpdate with upsert: true to insert if not found, update if found
            const result = await Model.findOneAndUpdate(
              { link: articleData.link }, // Find by unique link
              { $set: updateData }, // Update with new data
              { upsert: true, new: true, setDefaultsOnInsert: true } // Create if doesn't exist, return new doc
            );

            // Check if a new document was created or an existing one updated
            // Mongoose's `isNew` property on the returned document is useful here.
            if (result.isNew) {
              newArticlesCount++;
            } else {
              updatedArticlesCount++;
            }
          } catch (dbErr) {
            // Log specific database errors for individual articles to avoid stopping the whole scrape
            console.error(
              `[${sourceName} Scraper] Database operation error for article: ${
                articleData.link || articleData.title
              }. Error:`,
              dbErr
            );
            skippedArticlesCount++; // Count as skipped if DB operation fails
          }
        }
        console.log(
          `[${sourceName} Scraper] Finished processing articles. New: ${newArticlesCount}, Updated: ${updatedArticlesCount}, Skipped/Existing: ${skippedArticlesCount}. Total processed: ${articles.length}`
        );
        resolve(); // Resolve the promise once all articles for this source are processed
      } catch (jsonErr) {
        // Handle errors during JSON parsing or if initial database logic fails
        console.error(
          `[${sourceName} Scraper] JSON parse or database error for ${sourceName}:`,
          jsonErr.message
        );
        console.error(
          `[${sourceName} Scraper] Problematic raw data (first 500 chars):\n${rawData.substring(
            0,
            500
          )}`
        );
        reject(new Error(`Failed to process scraper output for ${sourceName}`));
      }
    });
  });
}

// =========================================================
// Function to run all scrapers sequentially
// =========================================================
async function runAllScrapers() {
  console.log(`--- Starting Scrape Cycle (${new Date().toLocaleString()}) ---`);
  for (const sourceName in sourceConfig) {
    try {
      await runScraperAndStore(sourceName); // Await each scraper to run them in sequence
    } catch (error) {
      console.error(
        `--- Error running scraper for ${sourceName}: ${error.message}`
      );
    }
  }
  console.log(`--- Finished Scrape Cycle (${new Date().toLocaleString()}) ---`);
}

// =========================================================
// Function to clean up old news articles from all sources
// =========================================================
async function cleanupOldNews(daysToKeep) {
  console.log(
    `--- Starting Cleanup Cycle (${new Date().toLocaleString()}) ---`
  );
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep); // Calculate the date before which articles should be deleted

  for (const sourceName in sourceConfig) {
    try {
      const Model = sourceConfig[sourceName].model;
      // Delete articles where 'publishedAt' is older than the cutoffDate
      const result = await Model.deleteMany({
        publishedAt: { $lt: cutoffDate },
      });
      console.log(
        `[Cleanup] Deleted ${result.deletedCount} old articles from ${sourceName}.`
      );
    } catch (error) {
      console.error(
        `[Cleanup] Error cleaning up old articles for ${sourceName}:`,
        error
      );
    }
  }
  console.log(
    `--- Finished Cleanup Cycle (${new Date().toLocaleString()}) ---`
  );
}

// =========================================================
// Middleware to identify user based on a default or provided userId
// This middleware will ensure a user document exists and attaches it to req.user.
// =========================================================
async function identifyUser(req, res, next) {
  // Attempt to get userId from 'x-user-id' header, fallback to 'defaultUser'
  let userId = req.headers["x-user-id"] || "defaultUser";
  try {
    let user = await User.findOne({ userId }); // Find the user in the database
    if (!user) {
      // If user doesn't exist, create a new one
      user = new User({ userId });
      await user.save();
      console.log(`Created new user: ${userId}`);
    }
    req.user = user; // Attach the found or created user object to the request for subsequent middleware/routes
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Error identifying user:", error);
    // If an error occurs during user identification, send a 500 status
    res
      .status(500)
      .json({ message: "Internal server error during user identification" });
  }
}

// =========================================================
// API Routes
// =========================================================

// Route to get news for a specific source (e.g., /api/news/hindu)
// This route does NOT require the identifyUser middleware.
router.get("/:source", async (req, res) => {
  const sourceName = req.params.source;
  // Get the Mongoose Model associated with the sourceName from sourceConfig
  const Model = sourceConfig[sourceName]
    ? sourceConfig[sourceName].model
    : null;

  if (!Model) {
    // If the source is not configured, send a 404
    return res.status(404).json({ message: "News source not found." });
  }

  try {
    // Fetch articles, sort by published date descending, and limit to 50
    const articles = await Model.find().sort({ publishedAt: -1 }).limit(50);
    res.json(articles); // Send the articles as JSON response
  } catch (error) {
    console.error(`Error fetching articles for ${sourceName}:`, error);
    res
      .status(500)
      .json({ message: `Failed to fetch articles for ${sourceName}` });
  }
});

// Route to get all news (aggregated from all configured sources)
// This route also does NOT require the identifyUser middleware.
router.get("/all", async (req, res) => {
  try {
    let allArticles = [];
    // Loop through all configured sources
    for (const sourceName in sourceConfig) {
      const Model = sourceConfig[sourceName].model;
      // Fetch a limited number of articles from each source
      const articles = await Model.find().sort({ publishedAt: -1 }).limit(10); // Limit per source to avoid massive data
      allArticles = allArticles.concat(articles); // Combine articles from different sources
    }

    // Sort all aggregated articles by publishedAt in descending order
    allArticles.sort((a, b) => b.publishedAt - a.publishedAt);

    // Send a limited number of combined articles (e.g., top 50)
    res.json(allArticles.slice(0, 50));
  } catch (error) {
    console.error("Error fetching all articles:", error);
    res.status(500).json({ message: "Failed to fetch all articles" });
  }
});

// Route to add an article to a user's bookmarks
// This route REQUIRES the identifyUser middleware to ensure req.user is available.
router.post("/bookmarks/add", identifyUser, async (req, res) => {
  const { articleRefId, sourceModelName } = req.body; // Extract article ID and source model name from request body
  if (!articleRefId || !sourceModelName) {
    return res
      .status(400)
      .json({ message: "Article ID and Source Model Name are required." });
  }

  try {
    // Validate if articleRefId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(articleRefId)) {
      return res.status(400).json({ message: "Invalid articleRefId format." });
    }

    const user = req.user; // Access the user object from the identifyUser middleware

    // Check if the article is already bookmarked by this user
    const isBookmarked = user.bookmarkedArticles.some(
      (bookmark) =>
        bookmark.articleRefId.equals(articleRefId) && // Use .equals() for ObjectId comparison
        bookmark.sourceModelName === sourceModelName
    );

    if (isBookmarked) {
      return res.status(409).json({ message: "Article already bookmarked." }); // 409 Conflict if already bookmarked
    }

    user.bookmarkedArticles.push({ articleRefId, sourceModelName }); // Add new bookmark
    await user.save(); // Save the updated user document
    res.status(200).json({ message: "Article bookmarked successfully!" });
  } catch (error) {
    console.error("Error adding bookmark:", error);
    res.status(500).json({ message: "Failed to add bookmark." });
  }
});

// Route to remove an article from a user's bookmarks
// This route REQUIRES the identifyUser middleware.
router.delete("/bookmarks/remove", identifyUser, async (req, res) => {
  const { articleRefId } = req.body;
  if (!articleRefId) {
    return res.status(400).json({ message: "Article ID is required." });
  }

  try {
    const user = req.user;
    const initialLength = user.bookmarkedArticles.length;

    // Filter out the bookmark to be removed
    user.bookmarkedArticles = user.bookmarkedArticles.filter(
      (bookmark) => !bookmark.articleRefId.equals(articleRefId) // Use .equals() for ObjectId comparison
    );

    // If the length hasn't changed, the bookmark wasn't found
    if (user.bookmarkedArticles.length === initialLength) {
      return res.status(404).json({ message: "Bookmark not found." });
    }

    await user.save();
    res.status(200).json({ message: "Bookmark removed successfully." });
  } catch (error) {
    console.error("Error removing bookmark:", error);
    res.status(500).json({ message: "Failed to remove bookmark." });
  }
});

// Route to get all bookmarked articles for a user
// This route REQUIRES the identifyUser middleware.
// The ':userId' parameter is largely illustrative here, as identifyUser handles the actual user identification.
router.get("/user/:userId/bookmarks", identifyUser, async (req, res) => {
  try {
    const user = req.user; // User object already attached by identifyUser middleware
    const bookmarkedArticles = [];

    // Iterate through each bookmark and fetch the full article details from its specific source model
    for (const bookmark of user.bookmarkedArticles) {
      const Model = sourceConfig[bookmark.sourceModelName]
        ? sourceConfig[bookmark.sourceModelName].model
        : null;
      if (Model) {
        const article = await Model.findById(bookmark.articleRefId); // Find the article by its ID
        if (article) {
          // Add the article to the list, including its original source name
          bookmarkedArticles.push({
            ...article.toObject(),
            source: bookmark.sourceModelName,
          });
        }
      }
    }
    res.json(bookmarkedArticles);
  } catch (error) {
    console.error("Error fetching user bookmarks:", error);
    res.status(500).json({ message: "Failed to fetch bookmarks." });
  }
});

// =========================================================
// Export Modules
// These functions and the router are exported to be used by index.js
// =========================================================
module.exports = {
  router,
  sourceConfig,
  runAllScrapers,
  cleanupOldNews,
  // identifyUser // Not strictly necessary to export if only used internally by routes, but harmless.
};
