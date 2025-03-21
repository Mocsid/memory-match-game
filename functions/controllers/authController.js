// ./functions/controllers/authController.js (RTDB version with lowercase color_fruit usernames)
const admin = require("firebase-admin");
const db = admin.database();
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

// Rate limiter to prevent abuse
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { error: "Too many login attempts. Please try again later." },
});

// Generate secure session token
const generateSessionToken = () => crypto.randomBytes(32).toString("hex");

// Create session object
const createSession = () => {
  const sessionToken = generateSessionToken();
  const sessionExpires = Date.now() + 24 * 60 * 60 * 1000;
  return { sessionToken, sessionExpires };
};

// List of colors and fruits for username generation
const colors = [
  "red", "blue", "green", "yellow", "orange", "purple", "pink",
  "cyan", "lime", "teal", "brown", "gray", "black", "white"
];

const fruits = [
  "apple", "banana", "mango", "grape", "peach", "cherry", "plum",
  "kiwi", "lemon", "melon", "berry", "papaya", "orange", "fig"
];

// Helper to generate a username like "blue_apple"
const generateUsername = () => {
  const color = colors[Math.floor(Math.random() * colors.length)];
  const fruit = fruits[Math.floor(Math.random() * fruits.length)];
  return `${color}_${fruit}`;
};

// Signup with unique generated username
exports.signupUser = async (req, res) => {
  const { deviceId, ipAddress } = req.body;

  if (!deviceId || !ipAddress) {
    return res.status(400).json({ error: "Missing device or IP" });
  }

  try {
    const usersRef = db.ref("users");
    let username;
    let attempts = 0;
    let isTaken = true;

    while (isTaken && attempts < 20) {
      attempts++;
      username = generateUsername();
      const snap = await usersRef.orderByChild("username").equalTo(username).once("value");
      if (!snap.exists()) {
        isTaken = false;
      }
    }

    if (isTaken) {
      return res.status(500).json({ error: "Could not generate unique username" });
    }

    const newUserRef = usersRef.push();
    const userId = newUserRef.key;
    const { sessionToken, sessionExpires } = createSession();

    const newUser = {
      username,
      deviceId,
      ipAddress,
      sessionToken,
      sessionExpires,
      createdAt: Date.now(),
    };

    await newUserRef.set(newUser);

    return res.json({
      success: true,
      userId,
      username,
      sessionToken,
      sessionExpires,
    });
  } catch (err) {
    console.error("Signup Error (RTDB):", err);
    res.status(500).json({ error: "An error occurred during signup." });
  }
};

// Login using device and IP matching
exports.loginUser = async (req, res) => {
  loginLimiter(req, res, async () => {
    const { username, deviceId, ipAddress } = req.body;

    if (!username || !deviceId || !ipAddress) {
      return res.status(400).json({ error: "Missing fields" });
    }

    try {
      const usersRef = db.ref("users");
      const snapshot = await usersRef.orderByChild("username").equalTo(username).once("value");

      if (!snapshot.exists()) {
        return res.status(404).json({ error: "User not found" });
      }

      const userId = Object.keys(snapshot.val())[0];
      const userData = snapshot.val()[userId];

      if (userData.deviceId !== deviceId || userData.ipAddress !== ipAddress) {
        return res.status(403).json({ error: "Login not allowed from this device or IP" });
      }

      const { sessionToken, sessionExpires } = createSession();
      await db.ref(`users/${userId}`).update({
        sessionToken,
        sessionExpires,
        deviceId,
        ipAddress,
      });

      return res.json({
        success: true,
        userId,
        username,
        sessionToken,
        sessionExpires,
      });
    } catch (err) {
      console.error("Login Error (RTDB):", err);
      res.status(500).json({ error: "An error occurred during login." });
    }
  });
};

// Get profile by user ID and token
exports.getUserProfile = async (req, res) => {
  const { userId } = req.params;
  const { authorization } = req.headers;

  if (!userId || !authorization) {
    return res.status(400).json({ error: "User ID and authorization token are required" });
  }

  const tokenParts = authorization.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    return res.status(401).json({ error: "Invalid authorization format" });
  }

  const sessionToken = tokenParts[1];

  try {
    const snapshot = await db.ref(`users/${userId}`).once("value");
    if (!snapshot.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = snapshot.val();

    if (userData.sessionToken !== sessionToken) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    if (Date.now() > userData.sessionExpires) {
      return res.status(401).json({ error: "Session expired" });
    }

    return res.json({
      success: true,
      user: {
        userId,
        username: userData.username,
        createdAt: userData.createdAt,
      },
    });
  } catch (err) {
    console.error("Get User Profile Error (RTDB):", err);
    res.status(500).json({ error: "An error occurred while fetching the profile." });
  }
};

// Logout clears session values
exports.logoutUser = async (req, res) => {
  const { userId } = req.params;
  const { authorization } = req.headers;

  if (!userId || !authorization) {
    return res.status(400).json({ error: "User ID and authorization token are required" });
  }

  const tokenParts = authorization.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    return res.status(401).json({ error: "Invalid authorization format" });
  }

  const sessionToken = tokenParts[1];

  try {
    const userRef = db.ref(`users/${userId}`);
    const snapshot = await userRef.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = snapshot.val();
    if (userData.sessionToken !== sessionToken) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    await userRef.update({
      sessionToken: "",
      sessionExpires: 0,
    });

    return res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout Error (RTDB):", err);
    res.status(500).json({ error: "An internal server error occurred during logout." });
  }
};
