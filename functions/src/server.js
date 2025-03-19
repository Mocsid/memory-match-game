const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const fs = require("fs");
const rateLimit = require("express-rate-limit").default || require("express-rate-limit");
const helmet = require("helmet");

dotenv.config();

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests. Please try again later." },
});
app.use(limiter);

// Firebase Admin Initialization
const serviceAccountPath = process.env.FIREBASE_CREDENTIALS || "./firebase-service-account.json";
if (!fs.existsSync(serviceAccountPath)) {
  throw new Error("🔥 Firebase service account file is missing!");
}
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

// Logging Middleware for Debugging
app.use((req, res, next) => {
  console.log(`📌 Request from IP: ${req.ip}, Route: ${req.originalUrl}`);
  next();
});

// Import Routes
try {
  const authRoutes = require("../routes/authRoutes"); // Ensure this file exists or adjust as needed
  const indexRoutes = require("../routes"); // Your index route (if any)
  const gameRoutes = require("../routes/gameRoutes");

  // Mount routes
  app.use("/", indexRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/game", gameRoutes);
} catch (error) {
  console.error("❌ Error loading routes:", error.message);
}

// Catch-all for undefined routes (optional, for debugging)
app.use((req, res) => {
  res.status(404).send("Route not found.");
});

// Start Server
const PORT = process.env.EXPRESS_PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
