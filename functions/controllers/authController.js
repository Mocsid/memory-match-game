const { db, auth } = require("../services/firebaseService");

// ✅ Signup Endpoint
const signup = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if username already exists
    const usernameRef = db.ref("users");
    const snapshot = await usernameRef.orderByChild("username").equalTo(username).once("value");

    if (snapshot.exists()) {
      return res.status(400).json({ error: "Username already in use" });
    }

    // ✅ Create Firebase Auth User
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: username
    });

    // ✅ Store user data in Firebase Realtime Database
    await db.ref(`users/${userRecord.uid}`).set({
      username,
      email,
      gamesPlayed: 0,
      wins: 0,
      losses: 0
    });

    res.json({ success: true, userId: userRecord.uid });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Login Endpoint
const login = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Get user by email
    const user = await auth.getUserByEmail(email);
    const userRef = db.ref(`users/${user.uid}`);
    const snapshot = await userRef.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ error: "User not found in database" });
    }

    // Return user details
    res.json({
      success: true,
      userId: user.uid,
      email: user.email,
      username: snapshot.val().username,
      gamesPlayed: snapshot.val().gamesPlayed,
      wins: snapshot.val().wins,
      losses: snapshot.val().losses
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { signup, login };
