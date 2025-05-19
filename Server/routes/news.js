const express = require("express");
const { spawn } = require("child_process");
const router = express.Router();
const path = require("path");

router.get("/hindu", (req, res) => {
  const scriptPath = path.join(__dirname, "../scrapers/hindu_scraper.py");

  const python = spawn("python", [scriptPath]);

  let output = "";
  python.stdout.on("data", (data) => {
    output += data.toString();
  });

  python.stderr.on("data", (err) => {
    console.error("❌ Python Error:", err.toString());
  });

  python.on("close", (code) => {
    try {
      const articles = JSON.parse(output);
      res.json({ source: "The Hindu", articles });
    } catch (err) {
      console.error("❌ JSON Parse Error:", err.message);
      res.status(500).json({ error: "Failed to parse scraper output" });
    }
  });
});

router.get("/hindustan-times", (req, res) => {
  const scriptPath = path.join(__dirname, "../scrapers/hindustan_scraper.py");

  const python = spawn("python", [scriptPath]);

  let output = "";
  python.stdout.on("data", (data) => {
    output += data.toString();
  });

  python.stderr.on("data", (err) => {
    console.error("❌ Python Error:", err.toString());
  });

  python.on("close", (code) => {
    try {
      const articles = JSON.parse(output);
      res.json({ source: "Hindustan Times", articles });
    } catch (err) {
      console.error("❌ JSON Parse Error:", err.message);
      res.status(500).json({ error: "Failed to parse scraper output" });
    }
  });
});

router.get("/toi", (req, res) => {
  const scriptPath = path.join(
    __dirname,
    "../scrapers/times_of_india_scraper.py"
  );

  const python = spawn("python", [scriptPath]);

  let output = "";
  python.stdout.on("data", (data) => {
    output += data.toString();
  });

  python.stderr.on("data", (err) => {
    console.error("❌ Python Error:", err.toString());
  });

  python.on("close", (code) => {
    try {
      const articles = JSON.parse(output);
      res.json({ source: "Times of India", articles });
    } catch (err) {
      console.error("❌ JSON Parse Error:", err.message);
      res.status(500).json({ error: "Failed to parse scraper output" });
    }
  });
});

router.get("/ie", (req, res) => {
  const scriptPath = path.join(__dirname, "../scrapers/indian_express.py");

  const python = spawn("python", [scriptPath]);

  let output = "";
  python.stdout.on("data", (data) => {
    output += data.toString();
  });

  python.stderr.on("data", (err) => {
    console.error("❌ Python Error:", err.toString());
  });

  python.on("close", (code) => {
    try {
      const articles = JSON.parse(output);
      res.json({ source: "Indian Express", articles });
    } catch (err) {
      console.error("❌ JSON Parse Error:", err.message);
      res.status(500).json({ error: "Failed to parse scraper output" });
    }
  });
});

router.get("/dna", (req, res) => {
  const scriptPath = path.join(__dirname, "../scrapers/dna_scraper.py");

  const python = spawn("python", [scriptPath]);

  let output = "";
  python.stdout.on("data", (data) => {
    output += data.toString();
  });

  python.stderr.on("data", (err) => {
    console.error("❌ Python Error:", err.toString());
  });

  python.on("close", (code) => {
    try {
      const articles = JSON.parse(output);
      res.json({ source: "Times of India", articles });
    } catch (err) {
      console.error("❌ JSON Parse Error:", err.message);
      res.status(500).json({ error: "Failed to parse scraper output" });
    }
  });
});
module.exports = router;
