// C:\Users\OKKKK\Desktop\G-Press\G-Press\Server\models\dna.js

const mongoose = require("mongoose");

const dnaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    link: { type: String, unique: true, required: true },
    description: { type: String },
    imageUrl: { type: String },
    content: { type: String },
    // Removed: createdAt: { type: Date, default: Date.now }, // Redundant with timestamps: true
    // --- ADDED FIELD: Source Identifier ---
    source: {
      type: String,
      required: true,
      trim: true,
      lowercase: true, // Ensure source is stored consistently (e.g., 'dna')
    },
    // --- END ADDED FIELD ---
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

// Changed model name to "Dna" from "DNA" for consistency.
// Mongoose will automatically create a collection named 'dnas'
// based on this model name.
const Dna = mongoose.model("Dna", dnaSchema);

module.exports = Dna;
