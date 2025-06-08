// C:\Users\OKKKK\Desktop\G-Press\G-Press\Server\models\indianexpress.js

const mongoose = require("mongoose");

const indianExpressSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    link: {
      type: String,
      unique: true,
      required: true,
    },
    // --- Existing and Correct: Source Identifier ---
    source: {
      type: String,
      required: true,
      trim: true,
      lowercase: true, // Ensure source is stored consistently (e.g., 'ie')
    },
    // --- ADDED OPTIONAL FIELDS (if your scraper provides them) ---
    description: { type: String },
    imageUrl: { type: String },
    content: { type: String },
    // --- END ADDED OPTIONAL FIELDS ---
    categories: [
      {
        type: String,
        enum: [
          "Polity & Governance",
          "Economy",
          "Environment & Ecology",
          "Science & Technology",
          "International Relations",
          "Art & Culture",
          "History",
          "Social Issues",
          "Defence & Security",
          "Awards, Persons & Places in News",
          "Sports",
          "Miscellaneous",
        ],
        default: [],
      },
    ],
  },
  { timestamps: true }
);

// Preserve the explicit collection name, and ensure model name is "IndianExpress".
module.exports = mongoose.model(
  "IndianExpress", // Consistent model name (capitalized)
  indianExpressSchema,
  "indianexpress" // Explicit collection name (lowercase)
);
