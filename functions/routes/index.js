const express = require("express");
const authRoutes = require("./authRoutes"); // ✅ Ensure this exists

const router = express.Router();

// ✅ Test API
router.get("/", (req, res) => {
  res.json({ message: "API is running successfully!" });
});

// ✅ Attach authentication routes
router.use("/auth", authRoutes); // Example usage

module.exports = router;
