const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Admin Initialization
const serviceAccount = JSON.parse(fs.readFileSync("./firebase-service-account.json", "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

// Import Routes
const authRoutes = require("../routes/authRoutes");

app.use("/api/auth", authRoutes);

const PORT = process.env.EXPRESS_PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
