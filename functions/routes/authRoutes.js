const express = require("express");
const { signupUser, loginUser, getUserProfile, logoutUser } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.get("/profile/:userId", getUserProfile);
router.post("/logout/:userId", logoutUser); //  <-- MUST be a POST request

module.exports = router;