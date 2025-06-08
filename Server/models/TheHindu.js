const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    link: { type: String, unique: true, required: true },
    // --- NEW FIELD: Source Identifier ---
    source: {
      type: String,
      required: true, // Make sure it's always present
      trim: true,
      lowercase: true, // Store as lowercase for consistency (e.g., 'hindu')
    },
    // --- END NEW FIELD ---
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
    // You might also want to add these fields if your scraper provides them
    // description: { type: String },
    // imageUrl: { type: String },
    // publishedAt: { type: Date, default: Date.now },
    // author: { type: String },
    // content: { type: String } // Full content of the article
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hindu", articleSchema); // Changed model name to "Hindu" for consistency
