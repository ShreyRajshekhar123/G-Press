const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    link: { type: String, unique: true, required: true },
    source: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: { type: String, default: null },
    imageUrl: { type: String, default: null },
    content: { type: String, default: null }, // Stores full article content
    // ADDED: questions array - now storing references to questions in a separate 'Question' collection
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],

    lastGeneratedQuestionsAt: {
      // Timestamp when questions were last generated
      type: Date,
    },
    questionsGenerationFailed: {
      // Flag if question generation failed
      type: Boolean,
      default: false,
    },
    lastScrapedContentAt: { type: Date, default: null }, // Timestamp when full content was last successfully scraped
    contentScrapeFailed: { type: Boolean, default: false },
    isCurrentAffair: {
      type: Boolean,
      default: false,
      index: true, // Add index for faster queries
    },
    currentAffairsCategory: {
      type: String,
      enum: [
        "Politics",
        "Economy",
        "International Relations",
        "Science & Technology",
        "Environment",
        "Sports",
        "Awards & Honors",
        "Defence",
        "Judiciary",
        "Social Issues",
        "Miscellaneous",
        "General",
      ], // Define your categories
      default: "General",
    },
    aiCategorizationTimestamp: {
      type: Date,
      default: null, // To track when AI categorization happened
    },
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
          "Technology",
          "World",
          "National",
          "Sports",
          "Miscellaneous",
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("TheHindu", articleSchema, "hindus"); // Changed model name to "TheHindu" for consistency with contentScraper.js 'modelName' enum, and specify collection 'hindus'
