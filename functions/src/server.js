const express = require("express");
const cors = require("cors");
const { firebaseApp } = require("../services/firebaseService");

const app = express();
app.use(cors());
app.use(express.json());

// Example simple route to test server is working
app.get("/api/status", (req, res) => {
  res.json({ status: "ok" });
});

// Import and use routes
const matchRoutes = require("../routes/matchRoutes");
app.use("/api/match", matchRoutes);

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});