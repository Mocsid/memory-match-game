// ./functions/controllers/authController.js
const admin = require("firebase-admin");
const db = admin.firestore();
const crypto = require("crypto");

const generateSessionToken = () => crypto.randomBytes(32).toString("hex");

const createSession = () => {
  const sessionToken = generateSessionToken();
  const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return { sessionToken, sessionExpires };
};

// Signup (New User)
exports.signupUser = async (req, res) => {
  const { username, deviceId, ipAddress } = req.body;

  if (!username || !deviceId || !ipAddress) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    // Check for existing username *before* creating a user
    const users = await db.collection("users").where("username", "==", username).get();
    if (!users.empty) {
        return res.status(409).json({ error: "Username already exists" }); // 409 Conflict
    }
      
    const { sessionToken, sessionExpires } = createSession();
    const newUserProfile = {
      username,
      deviceId,
      ipAddress,
      sessionToken,
      sessionExpires: sessionExpires.toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Use add() to auto-generate a userId
    const userRef = await db.collection("users").add(newUserProfile);

    return res.json({
      success: true,
      userId: userRef.id, // Return the auto-generated userId
      sessionToken,
      sessionExpires: sessionExpires.toISOString(),
    });

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "An error occurred during signup." });
  }
};

// Login (Existing User)
exports.loginUser = async (req, res) => {
  const { username, deviceId, ipAddress } = req.body;

  if (!username || !deviceId || !ipAddress) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
        const users = await db.collection("users").where("username", "==", username).get();
        if (users.empty) {
            return res.status(404).json({ error: "User not found" });
        }

        //There should only be one user with this username, take the first
        const userDoc = users.docs[0];
        const userData = userDoc.data();
        const userId = userDoc.id; //Get the auto-generated user id
        const { sessionToken, sessionExpires } = createSession();

      // Update session and device info
    await db.collection("users").doc(userId).update({
      sessionToken,
      sessionExpires: sessionExpires.toISOString(),
        deviceId, //Update for informational purposes
        ipAddress, //Update for informational purposes
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
};

// Get User Profile (Requires Authentication)
exports.getUserProfile = async (req, res) => {
  const { userId } = req.params; // Use userId from the URL
  const { authorization } = req.headers; //Common practice

  if (!userId || !authorization) {
    return res.status(400).json({ error: "User ID and authorization token are required" });
  }

    const tokenParts = authorization.split(' ');
    if(tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return res.status(401).json({error: "Invalid authorization format"});
    }
  const sessionToken = tokenParts[1];


  try {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    if (userData.sessionToken !== sessionToken) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    if (new Date(userData.sessionExpires) < new Date()) {
      return res.status(401).json({ error: "Session expired" });
    }

    res.json({
      success: true,
      user: {
        userId: userId, //Consistent userId
        username: userData.username,
        createdAt: userData.createdAt,
        // ... other non-sensitive data ...
      },
    });
  } catch (error) {
    console.error("Get User Profile Error:", error);
    res.status(500).json({ error: "An error occurred while fetching the profile." });
  }
};


// ./functions/controllers/authController.js
exports.logoutUser = async (req, res) => {
  const { userId } = req.params;
  const { authorization } = req.headers;

  if (!userId || !authorization) {
      return res.status(400).json({ error: "User ID and authorization token are required" });
  }

  const tokenParts = authorization.split(' ');
  if(tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return res.status(401).json({error: "Invalid authorization format"});
  }
  const sessionToken = tokenParts[1];

  try {
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
           console.error(`Logout Error: User not found for userId: ${userId}`); // Log userId
          return res.status(404).json({ error: "User not found" });
      }

      const userData = userDoc.data();

      if (userData.sessionToken !== sessionToken) {
          console.error(`Logout Error: Invalid token for userId: ${userId}.  Expected: ${userData.sessionToken}, Got: ${sessionToken}`); // Log tokens
          return res.status(401).json({ error: "Invalid session token" });
      }

    // Invalidate the session
      await userRef.update({
          sessionToken: "",
          sessionExpires: new Date(0).toISOString(),
      });
      console.log(`User ${userId} logged out successfully.`); //Log successful logout
      res.json({ success: true, message: "Logged out successfully" });

  } catch (error) {
      console.error("Logout Error:", error); // Log the full error
      console.error(`Logout Error Details: userId: ${userId}, sessionToken: ${sessionToken}`); // Log details

      //  Return a 500 error, but with a more controlled message:
      res.status(500).json({ error: "An internal server error occurred during logout." });
  }
};