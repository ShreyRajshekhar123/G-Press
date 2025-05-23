// C:\Users\OKKKK\Desktop\G-Press\G-Press\Server\routes\news.js

const express = require("express");
const router = express.Router();
const { spawn } = require("child_process"); // Still needed for the /:source/run API route

// Import all your news models
// IMPORTANT: Ensure these paths and casing match your actual filenames in Server/models/ !!!
const Hindu = require("../models/thehindu"); // Corrected to lowercase 'thehindu' based on common practice
const HindustanTimes = require("../models/hindustantimes"); // Corrected to lowercase
const TimesOfIndia = require("../models/timesofindia"); // Corrected to lowercase
const IndianExpress = require("../models/indianexpress"); // Corrected to lowercase
const Dna = require("../models/dna"); // Corrected to lowercase

// Centralized mapping for models and scraper scripts
// The keys (e.g., 'ie', 'dna') MUST match the slugs you'll use in your frontend URLs and buttons.
const sourceConfig = {
  ie: {
    // Indian Express
    model: IndianExpress,
    scriptPath: "indian_express.py", // Assuming direct file name in 'scrapers' folder
  },
  dna: {
    // DNA India
    model: Dna,
    scriptPath: "dna_scraper.py",
  },
  hindu: {
    // The Hindu
    model: Hindu,
    scriptPath: "hindu_scraper.py", // Double-check this matches your file (e.g., 'the_hindu.py'?)
  },
  "hindustan-times": {
    // Hindustan Times (note the hyphen)
    model: HindustanTimes,
    scriptPath: "hindustan_scraper.py",
  },
  toi: {
    // Times of India
    model: TimesOfIndia,
    scriptPath: "times_of_india_scraper.py",
  },
  // Add more sources here if you expand your scrapers later
};

// Route to get latest 20 articles from a specific source
// Example usage: GET /api/news/ie or /api/news/hindu
router.get("/:source", async (req, res) => {
  try {
    const source = req.params.source.toLowerCase(); // Ensure lowercase for consistent lookup
    const config = sourceConfig[source];

    if (!config || !config.model) {
      console.warn(`Attempted to fetch from invalid source: ${source}`);
      return res.status(400).json({ error: "Invalid news source provided." });
    }

    const Model = config.model;
    // Fetch latest 20 articles, sorted by creation date (newest first)
    // Assumes your models have a 'createdAt' field (from { timestamps: true })
    const articles = await Model.find().sort({ createdAt: -1 }).limit(20);
    console.log(`Workspaceed ${articles.length} articles from ${source}`);
    res.json({ source, articles }); // Respond with an object containing source and articles
  } catch (error) {
    console.error(`Error fetching articles from ${req.params.source}:`, error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// Route to trigger scraper for a given source (your existing scraper logic)
// Example usage: GET /api/news/ie/run or /api/news/dna/run
// NOTE: This API route will now be less critical as cron job handles auto-scraping
// but useful for manual triggers or debugging.
router.get("/:source/run", (req, res) => {
  const source = req.params.source.toLowerCase(); // Ensure lowercase for consistent lookup
  const config = sourceConfig[source];

  if (!config || !config.scriptPath || !config.model) {
    console.warn(`Attempted to run scraper for invalid source: ${source}`);
    return res
      .status(400)
      .json({ error: "Invalid news source or script configuration." });
  }

  const { model: Model, scriptPath } = config; // Destructure Model and scriptPath from config

  console.log(
    `Attempting to run scraper for source: ${source} using script: ${scriptPath}`
  );

  // Construct full path for spawn
  const fullScriptPath = `./scrapers/${scriptPath}`; // Correct relative path from routes/news.js

  const pythonProcess = spawn("python", [fullScriptPath]);

  let data = ""; // Accumulates stdout from the Python script
  let errorOutput = ""; // Accumulates stderr from the Python script

  pythonProcess.stdout.on("data", (chunk) => {
    data += chunk.toString();
  });

  pythonProcess.stderr.on("data", (chunk) => {
    errorOutput += chunk.toString();
    console.error(`[${source} Scraper stderr]:`, chunk.toString()); // Always log stderr for debugging
  });

  pythonProcess.on("close", async (code) => {
    console.log(`[${source} Scraper] Process exited with code: ${code}`);

    if (code !== 0) {
      console.error(
        `[${source} Scraper] Scraper process failed for ${source}.`
      );
      console.error(
        `[<span class="math-inline">\{source\} Scraper\] Full stderr output\:\\n</span>{errorOutput}`
      );
      return res.status(500).json({
        error: "Scraper failed",
        details: errorOutput || "No error output from scraper.",
      });
    }

    try {
      console.log(
        `[${source} Scraper] Attempting to parse JSON output. Data length: ${data.length}`
      );

      const scrapedArticles = JSON.parse(data);

      if (!Array.isArray(scrapedArticles)) {
        return res.status(500).json({
          error: "Failed to parse scraper output",
          details: "Scraper output is not a JSON array.",
        });
      }

      console.log(
        `[${source} Scraper] Successfully parsed ${scrapedArticles.length} articles from scraper output.`
      );

      const validArticles = scrapedArticles.filter(
        (article) => article.title && article.link // Ensure articles have title and link
      );
      console.log(
        `[${source} Scraper] Filtered articles (title and link present): ${validArticles.length}`
      );

      let newlyInsertedCount = 0; // Initialize a counter for newly inserted articles
      if (validArticles.length > 0) {
        try {
          // Delete existing articles for this source before inserting new ones (for this manual run)
          await Model.deleteMany({}); // <-- CAUTION: This clears the collection!
          const insertedDocs = await Model.insertMany(validArticles, {
            ordered: false, // Continue inserting even if some fail (e.g., duplicates)
          });
          newlyInsertedCount = insertedDocs.length;
          console.log(
            `[${source} Scraper] Successfully inserted ${newlyInsertedCount} new articles into MongoDB for ${source}.`
          );
        } catch (insertError) {
          // Check for E11000 duplicate key error (MongoDB unique constraint violation)
          if (
            insertError.code === 11000 ||
            (insertError.writeErrors &&
              insertError.writeErrors.some((err) => err.code === 11000))
          ) {
            console.warn(
              `[${source} Scraper] InsertMany error for ${source}: E11000 duplicate key error collection:`,
              insertError.message
            );
            console.warn(
              `[${source} Scraper] Some articles for ${source} may have been duplicates or failed validation.`
            );
            if (insertError.insertedDocs) {
              newlyInsertedCount = insertError.insertedDocs.length;
            }
          } else {
            console.error(
              `[${source} Scraper] Unexpected InsertMany error for ${source}:`,
              insertError
            );
            return res.status(500).json({
              error: "Failed to insert articles into database",
              details: insertError.message,
            });
          }
        }
      } else {
        console.warn(
          `[${source} Scraper] No valid articles to insert for ${source}.`
        );
      }

      res.json({
        message: `Scraped and stored successfully for ${source}`,
        totalParsed: scrapedArticles.length,
        newlyInserted: newlyInsertedCount,
      });
    } catch (e) {
      console.error(
        `[${source} Scraper] JSON parse error for ${source}:`,
        e.message
      );
      console.error(
        `[${source} Scraper] Problematic data for ${source}:\n`,
        data.substring(0, Math.min(data.length, 500)) +
          (data.length > 500 ? "..." : "")
      ); // Log up to first 500 chars
      res
        .status(500)
        .json({ error: "Failed to parse scraper output", details: e.message });
    }
  });
});

// Optional: Route to get all news from all sources (latest 20 from each, combined and sorted)
router.get("/all", async (req, res) => {
  try {
    const allArticles = [];
    const sources = Object.keys(sourceConfig); // Dynamically get sources from config

    for (const source of sources) {
      const config = sourceConfig[source];
      if (config && config.model) {
        // Fetch the latest 20 from each source to prevent overwhelming data for 'all' view
        const articles = await config.model
          .find({})
          .sort({ createdAt: -1 })
          .limit(20);
        allArticles.push(...articles);
      }
    }
    // Sort all articles globally by creation date (newest first)
    allArticles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    res.json(allArticles);
  } catch (error) {
    console.error("Error fetching all news:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch all news", details: error.message });
  }
});

module.exports = router;
module.exports.sourceConfig = sourceConfig; // <--- NEW: Export sourceConfig here!
