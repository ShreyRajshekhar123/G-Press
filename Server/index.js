// const express = require("express");
// const cors = require("cors");
// const mongoose = require("mongoose");
// const newsRoutes = require("./routes/news");

// const app = express();
// const PORT = 5000;

// app.use(cors());
// app.use(express.json()); // ✅ Needed for JSON POST requests

// app.use("/api/news", newsRoutes);

// mongoose
//   .connect("mongodb://127.0.0.1:27017/gpress")
//   .then(() => {
//     console.log("✅ Connected to MongoDB");
//   })
//   .catch((err) => {
//     console.error("❌ MongoDB connection error:", err);
//   });

// app.listen(PORT, () => {
//   console.log(`✅ Server running at http://localhost:${PORT}`);
// });

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const newsRoutes = require("./routes/news"); // adjust path if different

const app = express();

app.use(bodyParser.json());

// Connect to MongoDB (make sure this matches your config)
mongoose
  .connect("mongodb://localhost:27017/newsDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err));

app.use("/api/news", newsRoutes);

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
