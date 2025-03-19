const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const fs = require("fs");
const rateLimit = require("express-rate-limit").default || require("express-rate-limit"); // Ensure compatibility
const helmet = require("helmet");

dotenv.config();

const app = express();

// ✅ Security Middleware
app.use(helmet()); // Adds security headers
app.use(cors());
app.use(express.json());

// ✅ Rate Limiting - Prevents API abuse & brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: "Too many requests. Please try again later." },
});
app.use(limiter);

// ✅ Firebase Admin Initialization
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

// ✅ Middleware for Logging IP Address of Each Request
app.use((req, res, next) => {
  console.log(`📌 Request from IP: ${req.ip}, Route: ${req.originalUrl}`);
  next();
});

// ✅ Import Routes
try {
  const authRoutes = require("../routes/authRoutes");
  const indexRoutes = require("../routes"); // Import index.js which registers all routes
  const gameRoutes = require("../routes/gameRoutes"); // new

  // ✅ Add Routes
  app.use("/", indexRoutes); // ✅ Root API route
  app.use("/api/auth", authRoutes); // ✅ Authentication routes
  app.use("/api/game", gameRoutes); // For game endpoints
} catch (error) {
  console.error("❌ Error loading routes:", error.message);
}

// ✅ Start Server
const PORT = process.env.EXPRESS_PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
