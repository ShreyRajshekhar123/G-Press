// C:\Users\OKKKK\Desktop\G-Press\G-Press\Server\index.js

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors"); // <--- ADD THIS LINE: Import the cors package
const newsRoutes = require("./routes/news"); // adjust path if different

const app = express();

app.use(bodyParser.json());
app.use(cors()); // <--- ADD THIS LINE: Enable CORS for all routes

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
