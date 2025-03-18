const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const { db } = require("../services/firebaseService");  // ✅ Import Firebase without re-initializing

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Test API Route
app.get("/", (req, res) => {
    res.send("Backend is running correctly!");
});

// ✅ Firebase Write Test Route
app.post("/write", async (req, res) => {
    try {
        await db.ref("testData").set({ message: "Hello from Firebase!" });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Firebase Read Test Route
app.get("/read", async (req, res) => {
    try {
        const snapshot = await db.ref("testData").once("value");
        res.json(snapshot.val());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Start Express Server
const PORT = process.env.EXPRESS_PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
