const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema({
  title: String,
  link: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TimesOfIndia", articleSchema);
