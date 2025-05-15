const express = require("express");
const cors = require("cors");
const newsRoutes = require("./routes/news");

const app = express();
const PORT = 5000;

app.use(cors());
app.use("/api/news", newsRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
