// C:\Users\OKKKK\Desktop\G-Press\G-Press\Server\models\User.js

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      default: "defaultUser",
    },
    bookmarkedArticles: [
      {
        articleRefId: {
          type: mongoose.Schema.Types.ObjectId, // THIS MUST BE ObjectId
          required: true,
        },
        sourceModelName: {
          type: String,
          required: true,
        },
        bookmarkedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
