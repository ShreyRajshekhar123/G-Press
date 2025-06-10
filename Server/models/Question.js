// C:\Users\OKKKK\Desktop\G-Press\G-Press\Server\models\Question.js

const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "articleSourceModel", // Dynamic reference to the correct article collection
  },
  articleSource: {
    // Store the source name (e.g., 'hindu', 'toi')
    type: String,
    required: true,
  },
  articleSourceModel: {
    // This will dynamically hold the actual model name string for refPath
    type: String,
    required: true,
    enum: [
      "TheHindu",
      "HindustanTimes",
      "TimesOfIndia",
      "IndianExpress",
      "DNA",
    ], // List all your article model names here
  },
  articleTitle: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String], // Array of strings for options
    required: true,
  },
  correctAnswer: {
    type: String, // The correct option string (e.g., "C) Paris")
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Question", questionSchema);
