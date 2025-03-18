const admin = require("firebase-admin");

const auth = admin.auth();
const db = admin.firestore();

/**
 * User Signup
 */
exports.signupUser = async (req, res) => {
    const { email, password, username } = req.body;
  
    if (!email || !password || !username) {
      return res.status(400).json({ error: "Missing fields" });
    }
  
    try {
      // ✅ Check if username is already taken
      const existingUser = await db.collection("users").where("username", "==", username).get();
      if (!existingUser.empty) {
        return res.status(400).json({ error: "Username already in use" });
      }
  
      // ✅ Create new user in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: username,
      });
  
      // ✅ Store user details in Firestore
      await db.collection("users").doc(userRecord.uid).set({
        username,
        email,
        createdAt: new Date().toISOString(),
      });
  
      res.json({ success: true, userId: userRecord.uid });
    } catch (error) {
      // 🔴 If user was created in Firebase Auth but Firestore write failed, delete the Auth record
      if (error.message.includes("NOT_FOUND") && email) {
        const user = await auth.getUserByEmail(email).catch(() => null);
        if (user) {
          await auth.deleteUser(user.uid);
        }
      }
      res.status(500).json({ error: error.message });
    }
  };

/**
 * User Login
 */
exports.loginUser = async (req, res) => {
    const { email } = req.body; // 🔹 Frontend handles password verification
  
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
  
    try {
      // ✅ Find user by email in Firebase Auth
      const userRecord = await admin.auth().getUserByEmail(email);
  
      // ✅ Retrieve user details from Firestore
      const userDoc = await db.collection("users").doc(userRecord.uid).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User profile not found" });
      }
  
      // ✅ Return user data
      res.json({ success: true, user: userDoc.data() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  

/**
 * 👤 Get User Profile (Retrieves user details from Firestore)
 */
exports.getUserProfile = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, user: userDoc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
