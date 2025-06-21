const mongoose = require("mongoose");

const indianExpressSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    link: {
      type: String,
      unique: true,
      required: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
      lowercase: true, // Ensure source is stored consistently (e.g., 'indianexpress')
    },
    description: { type: String, default: null },
    imageUrl: { type: String, default: null },
    content: { type: String, default: null }, // Ensures content field is present and defaults to null
    // ADDED: questions array - now storing references to questions in a separate 'Question' collection
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],

    lastGeneratedQuestionsAt: {
      type: Date,
    },
    questionsGenerationFailed: {
      type: Boolean,
      default: false,
    },
    lastScrapedContentAt: { type: Date, default: null },
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

// Model name should be "IndianExpress" (capitalized) for consistency with Question.js modelSourceModel.
// Explicitly define collection name 'indianexpress'
module.exports = mongoose.model(
  "IndianExpress",
  indianExpressSchema,
  "indianexpress"
);
