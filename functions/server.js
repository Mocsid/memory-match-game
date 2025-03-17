const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Load Firebase credentials from JSON file
const serviceAccount = JSON.parse(fs.readFileSync("./firebase-service-account.json", "utf8"));

// ✅ Initialize Firebase Admin SDK using the JSON file
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();

// ✅ Sample API route to check if backend is running
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// ✅ API to test Firebase write
app.post("/write", async (req, res) => {
  try {
    await db.ref("testData").set({ message: "Hello from Docker + Firebase!" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ API to test Firebase read
app.get("/read", async (req, res) => {
  try {
    const snapshot = await db.ref("testData").once("value");
    res.json(snapshot.val());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
