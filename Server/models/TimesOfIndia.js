// C:\Users\OKKKK\Desktop\G-Press\G-Press\Server\models\timesofindia.js

const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        link: { type: String, unique: true, required: true },
        description: { type: String }, // Assuming scraper extracts this
        imageUrl: { type: String }, // Assuming scraper extracts this
        content: { type: String }, // Assuming scraper extracts this
        // --- ADDED FIELD: Source Identifier ---
        source: {
            type: String,
            required: true,
            trim: true,
            lowercase: true // Ensure source is stored consistently (e.g., 'toi')
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

// Model name should be "TimesOfIndia" for consistency with sourceConfig and User model lookup.
// Mongoose will automatically create a collection named 'timesofindias' from this.
module.exports = mongoose.model("TimesOfIndia", articleSchema);