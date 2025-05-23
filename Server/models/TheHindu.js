const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: String,
    link: String,
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TheHindu", articleSchema);
