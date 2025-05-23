const mongoose = require("mongoose");

const dnaSchema = new mongoose.Schema(
  {
    title: String,
    link: { type: String, unique: true }, // prevent duplicate articles
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Dna = mongoose.model("DNA", dnaSchema);

module.exports = Dna;
