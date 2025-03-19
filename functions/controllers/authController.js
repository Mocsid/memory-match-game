// ./functions/controllers/authController.js
const admin = require("firebase-admin");
const db = admin.firestore();
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

// ✅ Rate Limiting: Prevent brute-force attacks on login
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 100, // 10 minutes
  max: 50, // Max 5 login attempts per IP
  message: { error: "Too many login attempts. Please try again later." },
});

// ✅ Generates secure session token
const generateSessionToken = () => crypto.randomBytes(32).toString("hex");

// ✅ Creates a new session with expiration
const createSession = () => {
  const sessionToken = generateSessionToken();
  const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return { sessionToken, sessionExpires };
};

// ✅ Signup (New User)
exports.signupUser = async (req, res) => {
  const { username, deviceId, ipAddress } = req.body;

  if (!username || !deviceId || !ipAddress) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    // 🔹 Check if username is taken
    const users = await db.collection("users").where("username", "==", username).get();
    if (!users.empty) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // 🔹 Create user session
    const { sessionToken, sessionExpires } = createSession();
    const newUserProfile = {
      username,
      deviceId,
      ipAddress,
      sessionToken,
      sessionExpires: sessionExpires.toISOString(),
      createdAt: new Date().toISOString(),
    };

    // 🔹 Store user in Firestore
    const userRef = await db.collection("users").add(newUserProfile);

    return res.json({
      success: true,
      userId: userRef.id,
      sessionToken,
      sessionExpires: sessionExpires.toISOString(),
    });

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "An error occurred during signup." });
  }
};

// ✅ Login (Existing User)
exports.loginUser = async (req, res) => {
  loginLimiter(req, res, async () => { // Apply rate limiter
    const { username, deviceId, ipAddress } = req.body;

    if (!username || !deviceId || !ipAddress) {
      return res.status(400).json({ error: "Missing fields" });
    }

    try {
      const users = await db.collection("users").where("username", "==", username).get();
      if (users.empty) {
        return res.status(404).json({ error: "User not found" });
      }

      // 🔹 Ensure only one user exists
      const userDoc = users.docs[0];
      const userData = userDoc.data();
      const userId = userDoc.id;

      // 🔹 Validate device ID and IP
      if (userData.deviceId !== deviceId || userData.ipAddress !== ipAddress) {
        return res.status(403).json({ error: "Login not allowed from this device or IP" });
      }

      // 🔹 Create new session, invalidate old one
      const { sessionToken, sessionExpires } = createSession();
      await db.collection("users").doc(userId).update({
        sessionToken,
        sessionExpires: sessionExpires.toISOString(),
        deviceId, // Update device info
        ipAddress, // Update IP info
      });

      return res.json({
        success: true,
        userId: userId,
        sessionToken,
        sessionExpires: sessionExpires.toISOString(),
      });

    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ error: "An error occurred during login." });
    }
  });
};

// ✅ Get User Profile (Requires Authentication)
exports.getUserProfile = async (req, res) => {
  const { userId } = req.params;
  const { authorization } = req.headers;

  if (!userId || !authorization) {
    return res.status(400).json({ error: "User ID and authorization token are required" });
  }

  const tokenParts = authorization.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ error: "Invalid authorization format" });
  }
  const sessionToken = tokenParts[1];

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    // 🔹 Validate session token
    if (userData.sessionToken !== sessionToken) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    // 🔹 Check session expiration
    if (new Date(userData.sessionExpires) < new Date()) {
      return res.status(401).json({ error: "Session expired" });
    }

    res.json({
      success: true,
      user: {
        userId: userId,
        username: userData.username,
        createdAt: userData.createdAt,
      },
    });

  } catch (error) {
    console.error("Get User Profile Error:", error);
    res.status(500).json({ error: "An error occurred while fetching the profile." });
  }
};

// ✅ Logout User
exports.logoutUser = async (req, res) => {
  const { userId } = req.params;
  const { authorization } = req.headers;

  if (!userId || !authorization) {
    return res.status(400).json({ error: "User ID and authorization token are required" });
  }

  const tokenParts = authorization.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ error: "Invalid authorization format" });
  }
  const sessionToken = tokenParts[1];

  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error(`Logout Error: User not found for userId: ${userId}`);
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    // 🔹 Validate session token before logout
    if (userData.sessionToken !== sessionToken) {
      console.error(`Logout Error: Invalid token for userId: ${userId}`);
      return res.status(401).json({ error: "Invalid session token" });
    }

    // 🔹 Invalidate session
    await userRef.update({
      sessionToken: "",
      sessionExpires: new Date(0).toISOString(),
    });

    console.log(`User ${userId} logged out successfully.`);
    res.json({ success: true, message: "Logged out successfully" });

  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ error: "An internal server error occurred during logout." });
  }
};
