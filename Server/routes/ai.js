// Server/routes/ai.js

const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const path = require("path");
const axios = require("axios"); // Import axios for direct API calls

router.post("/generate-questions", async (req, res) => {
  const { articleId, articleLink, articleSource, articleTitle } = req.body;

  // --- Input Validation ---
  if (!articleLink || !articleSource || !articleTitle) {
    return res
      .status(400)
      .json({ message: "Article link, source, and title are required." });
  }

  let articleContent = null;
  let scrapingError = null;

  // --- Step 1: Scrape article content using the Python script (Unchanged) ---
  try {
    const pythonScriptPath = path.join(
      __dirname,
      "..",
      "scrapers",
      "content_scraper.py"
    );
    console.log(`Attempting to spawn Python scraper: ${pythonScriptPath}`);

    const pythonProcess = spawn("python", [
      pythonScriptPath,
      articleLink,
      articleSource,
    ]);

    let pythonOutput = "";
    let pythonErrorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      pythonOutput += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      pythonErrorOutput += data.toString();
    });

    await new Promise((resolve, reject) => {
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const parsedOutput = JSON.parse(pythonOutput);
            articleContent = parsedOutput.content;
            if (!articleContent) {
              scrapingError = "Scraper returned empty content.";
              console.error("Scraping Error:", scrapingError);
            }
          } catch (e) {
            scrapingError = `Failed to parse Python output: ${e.message}. Raw output: ${pythonOutput}`;
            console.error("Parsing Error:", scrapingError);
          }
          resolve();
        } else {
          scrapingError = `Python scraping failed with code ${code}. Error: ${
            pythonErrorOutput || "No specific error from Python."
          }`;
          console.error("Python Script Error:", scrapingError);
          resolve();
        }
      });
      pythonProcess.on("error", (err) => {
        scrapingError = `Failed to start Python process: ${err.message}`;
        console.error("Spawn Error:", scrapingError);
        reject(err);
      });
    });

    if (scrapingError) {
      return res
        .status(500)
        .json({
          message: `Failed to scrape article content: ${scrapingError}`,
        });
    }
    if (!articleContent) {
      return res
        .status(500)
        .json({ message: "Scraped article content is empty or invalid." });
    }
    console.log(`Scraped content length: ${articleContent.length} characters.`);
  } catch (error) {
    console.error("Error during content scraping process:", error);
    return res
      .status(500)
      .json({
        message: `Internal server error during scraping: ${error.message}`,
      });
  }

  // --- Step 2: Send scraped content to Gemini API (Direct Axios Call) ---
  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    const MODEL_NAME = "gemini-1.5-flash"; // A good, fast model for general use

    const prompt = `Based on the following news article, generate 5 concise, relevant, and objective questions that a reader might ask to test their understanding. Focus on key facts, events, and implications. Format each question with a question mark at the end, and separate them with newlines. Do not include answers or explanations.\n\nArticle Title: ${articleTitle}\n\nArticle Content:\n${articleContent}\n\nQuestions:`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
      },
    };

    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Extract the generated text from the direct API response
    let text = response.data.candidates[0].content.parts[0].text;

    // Clean up text: remove leading/trailing whitespace, split into array, filter empty lines
    const questions = text
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0 && q.endsWith("?"));

    if (questions.length === 0) {
      console.warn("AI generated no valid questions or output was malformed.");
      return res
        .status(200)
        .json({
          questions: [],
          message: "AI could not generate questions for this article.",
        });
    }

    res.json({ questions });
  } catch (error) {
    console.error(
      "Error generating questions with Gemini (direct API):",
      error.response ? error.response.data : error.message
    );
    if (error.response?.data) {
      console.error(
        "Gemini API Error Details (direct API):",
        error.response.data
      );
    }
    res.status(500).json({ message: "Failed to generate questions using AI." });
  }
});

module.exports = router;
