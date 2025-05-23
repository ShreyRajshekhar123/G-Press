const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const mongoose = require("mongoose");

const Hindu = require("../models/TheHindu");
const HindustanTimes = require("../models/hindustanTimes");
const TimesOfIndia = require("../models/timesOfIndia");
const IndianExpress = require("../models/indianExpress");
const Dna = require("../models/dna");

const modelMap = {
  hindu: Hindu,
  "hindustan-times": HindustanTimes,
  toi: TimesOfIndia,
  ie: IndianExpress,
  dna: Dna,
};

// Generic route to get latest 20 articles from a source
router.get("/:source", async (req, res) => {
  try {
    const source = req.params.source;
    const model = modelMap[source];

    if (!model) {
      console.warn(`Attempted to fetch from invalid source: ${source}`);
      return res.status(400).json({ error: "Invalid source" });
    }

    const articles = await model.find().sort({ _id: -1 }).limit(20);
    console.log(`Workspaceed ${articles.length} articles from ${source}`);
    res.json({ source, articles });
  } catch (error) {
    console.error(`Error fetching articles from ${req.params.source}:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Generic route to insert articles into the database for a source
router.post("/:source", async (req, res) => {
  try {
    const source = req.params.source;
    const model = modelMap[source];

    if (!model) {
      console.warn(`Attempted to post to invalid source: ${source}`);
      return res.status(400).json({ error: "Invalid source" });
    }

    const articles = req.body.articles;
    if (!Array.isArray(articles)) {
      console.error(`Invalid articles format for ${source}: Expected array.`);
      return res.status(400).json({ error: "Invalid articles format" });
    }
    console.log(`Received ${articles.length} articles for POST to ${source}.`);

    const insertedArticles = await model
      .insertMany(articles, { ordered: false }) // ordered: false means it will continue on duplicates
      .catch((err) => {
        console.error(
          `Insert error for ${source} (some may be duplicates):`,
          err.message
        );
        // If there's an error, it might be due to all being duplicates, return empty array
        return [];
      });

    console.log(
      `Successfully inserted ${insertedArticles.length} articles into ${source}.`
    );
    res.json({ message: "Articles inserted successfully", insertedArticles });
  } catch (error) {
    console.error(`Error inserting articles for ${req.params.source}:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Generic route to run scraper for a given source
router.get("/:source/run", (req, res) => {
  const source = req.params.source;
  const scriptMap = {
    hindu: "scrapers/hindu_scraper.py", // Changed from scripts/ to scrapers/
    "hindustan-times": "scrapers/hindustan_scraper.py", // Changed
    toi: "scrapers/times_of_india_scraper.py", // Note: Your file is times_of_india_scraper.py, not toi_scraper.py
    ie: "scrapers/indian_express.py", // Changed
    dna: "scrapers/dna_scraper.py", // Changed
  };

  const scriptPath = scriptMap[source];

  if (!scriptPath) {
    console.warn(`Attempted to run scraper for invalid source: ${source}`);
    return res.status(400).json({ error: "Invalid source" });
  }

  console.log(
    `Attempting to run scraper for source: ${source} using script: ${scriptPath}`
  );

  // Use 'python' or 'python3' based on your system setup
  // You might need to specify the full path if 'python' isn't in your PATH
  const pythonProcess = spawn("python", [scriptPath]);

  let data = ""; // Accumulates stdout from the Python script
  let error = ""; // Accumulates stderr from the Python script

  pythonProcess.stdout.on("data", (chunk) => {
    data += chunk.toString();
    // console.log(`[${source} Scraper stdout chunk]:`, chunk.toString()); // Uncomment for very verbose logging
  });

  pythonProcess.stderr.on("data", (chunk) => {
    error += chunk.toString();
    console.error(`[${source} Scraper stderr]:`, chunk.toString()); // Always log stderr for debugging
  });

  pythonProcess.on("close", async (code) => {
    console.log(`[${source} Scraper] Process exited with code: ${code}`);

    if (code !== 0) {
      console.error(
        `[${source} Scraper] Scraper process failed for ${source}.`
      );
      console.error(`[${source} Scraper] Full stderr output:\n${error}`);
      return res.status(500).json({
        error: "Scraper failed",
        details: error || "No error output from scraper.",
      });
    }

    try {
      console.log(
        `[${source} Scraper] Attempting to parse JSON output. Data length: ${data.length}`
      );
      // console.log(`[${source} Scraper] Full raw stdout data:\n${data}`); // Uncomment to see the full raw output

      const articles = JSON.parse(data);
      console.log(
        `[${source} Scraper] Successfully parsed ${articles.length} articles from scraper output.`
      );

      const model = modelMap[source]; // Get the Mongoose model for the source

      const filtered = articles.filter(
        (article) => article.title && article.link // Ensure articles have title and link
      );
      console.log(
        `[${source} Scraper] Filtered articles (title and link present): ${filtered.length}`
      );

      if (filtered.length === 0) {
        console.warn(
          `[${source} Scraper] No valid articles to insert after filtering.`
        );
        return res.json({
          message:
            "Scraped successfully, but no valid articles found to store.",
          count: 0,
          articles: [],
        });
      }

      const inserted = await model
        .insertMany(filtered, { ordered: false })
        .catch((err) => {
          // err.message will often contain "E11000 duplicate key error collection" if unique index is hit
          console.error(
            `[${source} Scraper] InsertMany error for ${source}: ${err.message}`
          );
          console.warn(
            `[${source} Scraper] Some articles for ${source} may have been duplicates or failed validation.`
          );
          // If all are duplicates, err.result.nInserted will be 0, so we return empty array
          return [];
        });

      console.log(
        `[${source} Scraper] Successfully inserted ${inserted.length} new articles into MongoDB for ${source}.`
      );
      res.json({
        message: "Scraped and stored successfully",
        count: inserted.length,
        articles: inserted, // Return inserted articles (which won't include duplicates)
      });
    } catch (e) {
      console.error(
        `[${source} Scraper] JSON parse error for ${source}:`,
        e.message
      );
      console.error(
        `[${source} Scraper] Problematic data for ${source}:\n`,
        data.substring(0, 500) + "..."
      ); // Log first 500 chars
      res
        .status(500)
        .json({ error: "Failed to parse scraper output", details: e.message });
    }
  });
});

module.exports = router;
