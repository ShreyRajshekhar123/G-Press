// C:\Users\OKKKK\Desktop\G-Press\G-Press\Server\routes\news.js

const express = require("express");
const mongoose = require("mongoose");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs"); // Although fs is imported, it's not used in this snippet.
const User = require("../models/User"); // Import the User model

const router = express.Router();

// =========================================================
// Newspaper-specific Mongoose Models
// IMPORT ALL YOUR NEWSPAPER MODELS HERE
// Make sure these paths and model names are correct.
// =========================================================
const Hindu = require("../models/TheHindu");
const HindustanTimes = require("../models/HindustanTimes");
const TOI = require("../models/TimesOfIndia");
const IndianExpress = require("../models/IndianExpress");
const Dna = require("../models/DNA");
// ... import other models as you create them following the same pattern

// Map scraper names to their Mongoose models and file paths
const sourceConfig = {
  hindu: {
    model: Hindu,
    filePath: path.join(__dirname, "../scrapers/hindu_scraper.py"),
  },
  "hindustan-times": {
    model: HindustanTimes,
    filePath: path.join(__dirname, "../scrapers/hindustan_scraper.py"),
  },
  toi: {
    model: TOI,
    filePath: path.join(__dirname, "../scrapers/times_of_india_scraper.py"),
  },
  ie: {
    model: IndianExpress,
    filePath: path.join(__dirname, "../scrapers/indian_express.py"),
  },
  dna: {
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
  const categories = new Set();

  for (const category in CATEGORY_KEYWORDS) {
    const keywords = CATEGORY_KEYWORDS[category];
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        categories.add(category);
        break;
      }
    }
  }
  return Array.from(categories);
}

// =========================================================
// Helper function to run a single scraper
// =========================================================
async function runScraperAndStore(sourceName) {
  console.log(
    `[${sourceName} Scraper] Starting scraper: ${sourceConfig[sourceName].filePath}`
  );
  const Model = sourceConfig[sourceName].model;
  const scraperPath = sourceConfig[sourceName].filePath;

  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [scraperPath]);
    let rawData = "";
    let errorData = "";

    pythonProcess.stdout.on("data", (data) => {
      rawData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorData += data.toString();
    });

    pythonProcess.on("close", async (code) => {
      console.log(`[${sourceName} Scraper] Process exited with code: ${code}`);
      if (code !== 0) {
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
        const articles = JSON.parse(rawData);
        console.log(
          `[${sourceName} Scraper] Successfully parsed ${articles.length} articles from scraper output.`
        );

        let newArticlesCount = 0;
        let updatedArticlesCount = 0;
        let skippedArticlesCount = 0;

        for (const articleData of articles) {
          try {
            if (!articleData.link || !articleData.title) {
              console.warn(
                `[${sourceName} Scraper] Skipping article due to missing link or title:`,
                articleData
              );
              skippedArticlesCount++;
              continue;
            }

            const categories = assignCategories(
              articleData.title,
              articleData.summary || "",
              articleData.content || ""
            );

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
              categories: categories,
              source: sourceName,
              lastScrapedAt: new Date(),
            };

            const result = await Model.findOneAndUpdate(
              { link: articleData.link },
              { $set: updateData },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            if (result.isNew) {
              newArticlesCount++;
            } else {
              updatedArticlesCount++;
            }
          } catch (dbErr) {
            console.error(
              `[${sourceName} Scraper] Database operation error for article: ${
                articleData.link || articleData.title
              }. Error:`,
              dbErr
            );
            skippedArticlesCount++;
          }
        }
        console.log(
          `[${sourceName} Scraper] Finished processing articles. New: ${newArticlesCount}, Updated: ${updatedArticlesCount}, Skipped/Existing: ${skippedArticlesCount}. Total processed: ${articles.length}`
        );
        resolve();
      } catch (jsonErr) {
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
      await runScraperAndStore(sourceName);
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
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  for (const sourceName in sourceConfig) {
    try {
      const Model = sourceConfig[sourceName].model;
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
// Middleware to identify user
// =========================================================
async function identifyUser(req, res, next) {
  let userId = req.headers["x-user-id"] || "defaultUser";
  try {
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId });
      await user.save();
      console.log(`Created new user: ${userId}`);
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Error identifying user:", error);
    res
      .status(500)
      .json({ message: "Internal server error during user identification" });
  }
}

// =========================================================
// API Routes
// IMPORTANT: Order matters here! Specific routes before general ones.
// Changes:
// 1. Added console.logs for debugging within routes.
// 2. Renamed specific source route to match frontend expectation (likely /:source)
//    If your frontend sends requests like `/api/news/hindu` then use `/:source`
//    If your frontend sends requests like `/api/news/source/hindu` then keep `/source/:source`
//    Based on the previous network tab, it looks like it's just `/:source`.
// =========================================================

// NEW SEARCH ROUTE - Always put more specific routes first.
router.get("/search", async (req, res) => {
  const searchQuery = req.query.q;

  if (!searchQuery) {
    return res.status(400).json({ message: "Search query 'q' is required." });
  }

  try {
    let searchResults = [];
    const regex = new RegExp(searchQuery, "i");

    for (const sourceName in sourceConfig) {
      const Model = sourceConfig[sourceName].model;
      if (Model) {
        const articles = await Model.find({
          $or: [
            { title: { $regex: regex } },
            { description: { $regex: regex } },
            { content: { $regex: regex } },
          ],
        })
          .sort({ publishedAt: -1 })
          .limit(20);

        const articlesWithSource = articles.map((article) => ({
          ...article.toObject(),
          source: sourceName,
        }));
        searchResults = searchResults.concat(articlesWithSource);
      }
    }

    searchResults.sort((a, b) => b.publishedAt - a.publishedAt);
    res.json(searchResults.slice(0, 100));
  } catch (error) {
    console.error("Error during news search:", error);
    res.status(500).json({ message: "Failed to perform search." });
  }
});

// Route to get all news (aggregated from all configured sources)
router.get("/all", async (req, res) => {
  try {
    let allArticles = [];
    const limitPerSource = 10;

    for (const sourceName in sourceConfig) {
      const Model = sourceConfig[sourceName].model;
      const articles = await Model.find()
        .sort({ publishedAt: -1 })
        .limit(limitPerSource);
      // ADDED LOG:
      console.log(
        `[Backend /all] Fetched ${articles.length} articles from ${sourceName} from DB.`
      );
      allArticles = allArticles.concat(articles);
    }

    allArticles.sort((a, b) => b.publishedAt - a.publishedAt);

    const finalLimit = 50;
    // ADDED LOG:
    console.log(
      `[Backend /all] Preparing to send ${allArticles.length} total articles (limited to ${finalLimit}).`
    );
    res.json(allArticles.slice(0, finalLimit));
  } catch (error) {
    console.error("Error fetching all articles:", error);
    res.status(500).json({ message: "Failed to fetch all articles" });
  }
});

// Route to get all bookmarked articles for a user
router.get("/user/:userId/bookmarks", identifyUser, async (req, res) => {
  try {
    const user = req.user;
    const bookmarkedArticles = [];

    for (const bookmark of user.bookmarkedArticles) {
      const Model = sourceConfig[bookmark.sourceModelName]
        ? sourceConfig[bookmark.sourceModelName].model
        : null;
      if (Model) {
        const article = await Model.findById(bookmark.articleRefId);
        if (article) {
          bookmarkedArticles.push({
            ...article.toObject(),
            source: bookmark.sourceModelName,
          });
        }
      }
    }
    // ADDED LOG:
    console.log(
      `[Backend /bookmarks] Sending ${bookmarkedArticles.length} bookmarked articles.`
    );
    res.json(bookmarkedArticles);
  } catch (error) {
    console.error("Error fetching user bookmarks:", error);
    res.status(500).json({ message: "Failed to fetch bookmarks." });
  }
});

// Route to get news for a specific source (e.g., /api/news/hindu)
// THIS IS THE ROUTE I AM CHANGING BASED ON YOUR FRONTEND NETWORK REQUESTS
// PREVIOUSLY: router.get("/source/:source", ... )
// NOW: router.get("/:source", ... ) - this assumes your frontend calls /api/news/hindu directly
router.get("/:source", async (req, res) => {
  // CHANGED THIS LINE
  const sourceName = req.params.source;
  const Model = sourceConfig[sourceName]
    ? sourceConfig[sourceName].model
    : null;

  if (!Model) {
    // ADDED LOG for debugging unknown source
    console.log(
      `[Backend /:source] Source '${sourceName}' not found in config.`
    );
    return res.status(404).json({ message: "News source not found." });
  }

  try {
    const articles = await Model.find().sort({ publishedAt: -1 }).limit(50);
    // ADDED LOG:
    console.log(
      `[Backend /${sourceName}] Fetched ${articles.length} articles from DB.`
    );
    res.json(articles);
  } catch (error) {
    console.error(`Error fetching articles for ${sourceName}:`, error);
    res
      .status(500)
      .json({ message: `Failed to fetch articles for ${sourceName}` });
  }
});

// Route to add an article to a user's bookmarks
router.post("/bookmarks/add", identifyUser, async (req, res) => {
  const { articleRefId, sourceModelName } = req.body;
  if (!articleRefId || !sourceModelName) {
    return res
      .status(400)
      .json({ message: "Article ID and Source Model Name are required." });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(articleRefId)) {
      return res.status(400).json({ message: "Invalid articleRefId format." });
    }

    const user = req.user;

    const isBookmarked = user.bookmarkedArticles.some(
      (bookmark) =>
        bookmark.articleRefId.equals(articleRefId) &&
        bookmark.sourceModelName === sourceModelName
    );

    if (isBookmarked) {
      return res.status(409).json({ message: "Article already bookmarked." });
    }

    user.bookmarkedArticles.push({ articleRefId, sourceModelName });
    await user.save();
    res.status(200).json({ message: "Article bookmarked successfully!" });
  } catch (error) {
    console.error("Error adding bookmark:", error);
    res.status(500).json({ message: "Failed to add bookmark." });
  }
});

// Route to remove an article from a user's bookmarks
router.delete("/bookmarks/remove", identifyUser, async (req, res) => {
  const { articleRefId, sourceModelName } = req.body;
  if (!articleRefId || !sourceModelName) {
    return res.status(400).json({
      message: "Article ID and Source Model Name are required for removal.",
    });
  }

  try {
    const user = req.user;
    const initialLength = user.bookmarkedArticles.length;

    user.bookmarkedArticles = user.bookmarkedArticles.filter(
      (bookmark) =>
        !(
          bookmark.articleRefId.equals(articleRefId) &&
          bookmark.sourceModelName === sourceModelName
        )
    );

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

// =========================================================
// Export Modules
// =========================================================
module.exports = {
  router,
  sourceConfig,
  runAllScrapers,
  cleanupOldNews,
};
