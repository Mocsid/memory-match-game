const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Import Routes
const authRoutes = require("../routes/authRoutes");

// ✅ Use Routes
app.use("/auth", authRoutes);

// ✅ Test API Route
app.get("/", (req, res) => {
  res.send("Backend is running! Use API endpoints!");
});

// ✅ Start Express Server
const PORT = process.env.EXPRESS_PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
