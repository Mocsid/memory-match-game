const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const matchRoutes = require("../routes/matchRoutes"); // adjust path if needed

const app = express();

// ✅ Step 1: Apply CORS with correct origin
app.use(
  cors({
    origin: "https://memory-match-game-8bd4c.web.app", // ✅ no trailing slash
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  })
);

// ✅ Step 2: Handle OPTIONS (preflight) explicitly
app.options("*", cors());

// ✅ Step 3: Allow JSON parsing
app.use(express.json());

// ✅ Step 4: Mount your routes
app.use("/api/match", matchRoutes);

// ✅ Step 5: Export to Firebase
exports.match = functions.https.onRequest(app);
