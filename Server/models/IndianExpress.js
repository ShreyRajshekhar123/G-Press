const mongoose = require("mongoose");

const indianExpressSchema = new mongoose.Schema(
  {
    title: String,
    link: {
      type: String,
      unique: true, // IMPORTANT: Ensures no duplicate articles based on their link
      required: true, // Ensures a link is always present for uniqueness check
    },
    source: String, // Keep this if your IndianExpress scraper outputs a 'source' field
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Define the model, explicitly telling Mongoose to use the 'indianexpress' collection.
// 'IndianExpress' is the model name (conventionally capitalized).
// 'indianExpressSchema' is the schema defined above.
// 'indianexpress' (as a string) is the exact collection name to use in MongoDB.
module.exports = mongoose.model(
  "IndianExpress",
  indianExpressSchema,
  "indianexpress"
);
