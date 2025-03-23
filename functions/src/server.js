const express = require("express");
const cors = require("cors");
const { firebaseApp } = require("../services/firebaseService");

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get("/api/status", (req, res) => {
  res.json({ status: "ok" });
});

// Match routes
const matchRoutes = require("../routes/matchRoutes");
app.use("/api/match", matchRoutes);

// ✅ No app.listen() here
module.exports = app;
