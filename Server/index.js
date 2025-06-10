// C:\Users\OKKKK\Desktop\G-Press\G-Press\Server\index.js

require("dotenv").config(); // <<<--- ADD THIS LINE: To load environment variables from .env

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const cron = require("node-cron");

// IMPORTANT: Import newsRoutes and the exported functions/objects from news.js
const {
  router: newsRoutes,
  sourceConfig,
  runAllScrapers,
  cleanupOldNews,
} = require("./routes/news");

// <<<--- ADD THIS LINE: Import the AI router
const aiRouter = require("./routes/ai");

const app = express();

app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
// <<<--- MODIFIED LINE: Use MONGODB_URI from .env
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/newsDB")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// =========================================================
// Automated Scraping and Cleanup Scheduling
// =========================================================

// Schedule the scraping task to run every 2 hours
// '0 */2 * * *' means "at 0 minutes past every 2nd hour"
cron.schedule("0 */2 * * *", () => {
  console.log("Running scheduled scrape job...");
  runAllScrapers(); // Call the exported function from news.js
});

// Schedule the cleanup task to run once a day (e.g., at 3:00 AM)
// '0 3 * * *' means "at 3:00 AM every day"
cron.schedule("0 3 * * *", () => {
  console.log("Running scheduled cleanup job...");
  cleanupOldNews(10); // Call the exported function from news.js, keeping 10 days of news
});

// =========================================================
// END Automated Scheduling
// =========================================================

// API Routes
app.use("/api/news", newsRoutes);
app.use("/api/ai", aiRouter); // <<<--- ADD THIS LINE: Mount the AI router

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`); // Optional: Run scrapers once immediately when the server starts for initial data. // This is good for development, but in production, cron will handle it.
  runAllScrapers();
});
