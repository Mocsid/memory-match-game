const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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

// ✅ Import Routes
const authRoutes = require("../routes/authRoutes");
const indexRoutes = require("../routes"); // Import index.js which registers all routes

// ✅ Add Routes
app.use("/", indexRoutes);  // ✅ Root API route
app.use("/api/auth", authRoutes); // ✅ Authentication routes

const PORT = process.env.EXPRESS_PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
