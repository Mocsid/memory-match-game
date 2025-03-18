const express = require("express");
const { signupUser, loginUser, getUserProfile } = require("../controllers/authController");

const router = express.Router();

// Route for user signup
router.post("/signup", signupUser);

// Route for user login
router.post("/login", loginUser);

// Route for fetching user profile
router.get("/profile/:userId", getUserProfile);

module.exports = router;
