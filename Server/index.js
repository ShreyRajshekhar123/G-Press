// C:\Users\OKKKK\Desktop\G-Press\G-Press\Server\index.js

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const cron = require("node-cron");
const { spawn } = require("child_process");
const path = require("path");

// IMPORTANT: Import newsRoutes and sourceConfig from routes/news.js
const newsRoutes = require("./routes/news");
const { sourceConfig } = require("./routes/news"); // Now importing centralized sourceConfig

const app = express();

app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/newsDB", {
    // useNewUrlParser: true, // Deprecated, can remove
    // useUnifiedTopology: true, // Deprecated, can remove
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// =========================================================
// Automated Scraping Logic (using centralized sourceConfig)
// This section handles fetching new news periodically.
// =========================================================

/**
 * Runs a single Python scraper script and inserts its output into the database.
 * @param {string} sourceId - The identifier for the news source (e.g., 'dna', 'hindu').
 * @param {object} sourceDetails - Contains the Mongoose model and script path for the source.
 */
async function runScraper(sourceId, sourceDetails) {
  const { model, scriptPath } = sourceDetails;
  // Construct the full path to the Python scraper script
  const scraperFilePath = path.join(__dirname, "scrapers", scriptPath);

  console.log(`\n[${sourceId} Scraper] Starting scraper: ${scraperFilePath}`);

  return new Promise((resolve, reject) => {
    // Spawn a child process to run the Python script
    const pythonProcess = spawn("python", [scraperFilePath]);

    let scriptOutput = ""; // Accumulates stdout from the Python script
    let scriptError = ""; // Accumulates stderr from the Python script

    pythonProcess.stdout.on("data", (data) => {
      scriptOutput += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      scriptError += data.toString();
    });

    pythonProcess.on("close", async (code) => {
      if (code === 0) {
        // If Python script executed successfully
        console.log(`[${sourceId} Scraper] Process exited with code: ${code}`);
        try {
          // Attempt to parse the captured output as JSON
          const articles = JSON.parse(scriptOutput);

          if (articles.length > 0) {
            // Delete all existing articles for this source before inserting new ones
            // This ensures a clean slate and avoids duplicates for the same source.
            await model.deleteMany({}); // <-- CAUTION: This clears the collection for this source!
            await model.insertMany(articles);
            console.log(
              `[${sourceId} Scraper] Inserted ${articles.length} new articles.`
            );
          } else {
            console.log(
              `[${sourceId} Scraper] No new articles found from scraper.`
            );
          }
          resolve({
            success: true,
            message: `Scraped and saved ${articles.length} articles for ${sourceId}`,
          });
        } catch (parseError) {
          console.error(
            `[${sourceId} Scraper] Error parsing JSON output:`,
            parseError
          );
          console.error(
            `[${sourceId} Scraper] Raw output (might indicate Python error): \n${scriptOutput}`
          );
          reject({
            success: false,
            message: `Failed to parse scraper output for ${sourceId}`,
            error: parseError,
          });
        }
      } else {
        // If Python script exited with an error code
        console.error(
          `[${sourceId} Scraper] Process exited with code: ${code}`
        );
        console.error(
          `[${sourceId} Scraper] Python Error output: \n${scriptError}`
        );
        reject({
          success: false,
          message: `Scraper process failed for ${sourceId}`,
          error: scriptError,
        });
      }
    });

    // Handle errors if the Python process itself couldn't be spawned
    pythonProcess.on("error", (err) => {
      console.error(
        `[${sourceId} Scraper] Failed to start Python process:`,
        err
      );
      reject({
        success: false,
        message: `Failed to start Python process for ${sourceId}`,
        error: err,
      });
    });
  });
}

/**
 * Runs all configured scrapers sequentially.
 */
async function runAllScrapers() {
  console.log(
    `\n--- Starting Scheduled Scrape Cycle (${new Date().toLocaleString()}) ---`
  );
  for (const sourceId in sourceConfig) {
    if (sourceConfig.hasOwnProperty(sourceId)) {
      const sourceDetails = sourceConfig[sourceId];
      try {
        await runScraper(sourceId, sourceDetails);
      } catch (error) {
        console.error(
          `--- Error running scraper for ${sourceId}:`,
          error.message
        );
      }
    }
  }
  console.log(
    `--- Finished Scheduled Scrape Cycle (${new Date().toLocaleString()}) ---\n`
  );
}

// Schedule the scraping task to run every 2 hours
// Cron string format: 'minute hour day_of_month month day_of_week'
// '0 */2 * * *' means "at 0 minutes past every 2nd hour"
cron.schedule("0 */2 * * *", () => {
  console.log("Running scheduled scrape job...");
  runAllScrapers();
});

// =========================================================
// END Automated Scraping Logic
// =========================================================

// =========================================================
// NEW: Automated Cleanup Logic
// This section handles removing old news articles from the database.
// =========================================================

// Create an array of all your Mongoose news models
// This uses the models directly from the sourceConfig for consistency.
const allNewsModels = Object.values(sourceConfig).map((config) => config.model);

/**
 * Deletes news articles older than 2 days from all configured news collections.
 */
async function cleanupOldNews() {
  console.log(
    `\n--- Starting Scheduled Cleanup Cycle (${new Date().toLocaleString()}) ---`
  );
  // Calculate the date/time 2 days ago
  // Example for testing: `new Date(Date.now() - 5 * 60 * 1000);` for 5 minutes ago
  const twoDaysAgo = new Date(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)); // 2 days ago in milliseconds

  for (const Model of allNewsModels) {
    try {
      // Delete documents where 'createdAt' is less than (older than) 'twoDaysAgo'
      // This relies on `timestamps: true` in your Mongoose schemas.
      const result = await Model.deleteMany({ createdAt: { $lt: twoDaysAgo } });
      console.log(
        `[Cleanup] Deleted ${result.deletedCount} old articles from ${Model.modelName}.`
      );
    } catch (error) {
      console.error(
        `[Cleanup] Error deleting old articles from ${Model.modelName}:`,
        error
      );
    }
  }
  console.log(
    `--- Finished Scheduled Cleanup Cycle (${new Date().toLocaleString()}) ---\n`
  );
}

// Schedule the cleanup task to run once a day (e.g., at 3:00 AM)
// Cron string: 'minute hour day_of_month month day_of_week'
// '0 3 * * *' means "at 0 minutes past 3 o'clock in the morning, every day"
// For testing, you can temporarily set this to '*/1 * * * *' to run every minute.
cron.schedule("0 3 * * *", () => {
  console.log("Running scheduled cleanup job...");
  cleanupOldNews();
});

// =========================================================
// END Automated Cleanup Logic
// =========================================================

// API Routes (your existing news routes)
// This must come AFTER any cron jobs or other logic that uses sourceConfig
// but before app.listen
app.use("/api/news", newsRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
  // Optional: Run scrapers once immediately when the server starts for initial data.
  // This is good for populating the DB right away without waiting for the first cron schedule.
  // Keep uncommented if you want immediate scrape on server start:
  runAllScrapers();
});
