const { auth, db } = require("../services/firebaseService");

// ✅ User Signup
exports.signup = async (req, res) => {
    const { email, password, username } = req.body;

    try {
        // 🔹 Check if username already exists
        const usernameSnapshot = await db.ref("users").orderByChild("username").equalTo(username).once("value");

        if (usernameSnapshot.exists()) {
            return res.status(400).json({ error: "Username already taken" });
        }

        // 🔹 Create user in Firebase Authentication
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: username,
        });

        // 🔹 Save user details in Firebase Database
        await db.ref(`users/${userRecord.uid}`).set({
            email,
            username,
            createdAt: new Date().toISOString(),
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
        });

        res.json({ success: true, userId: userRecord.uid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ User Login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Firebase Authentication does not provide direct password verification, must be done via Firebase SDK on frontend
        res.status(200).json({ message: "Login handled on frontend via Firebase Auth SDK." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Get User Profile
exports.getUserProfile = async (req, res) => {
    const { userId } = req.params;

    try {
        const userSnapshot = await db.ref(`users/${userId}`).once("value");

        if (!userSnapshot.exists()) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(userSnapshot.val());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
