// Add to matchController.js or create a new controller
const { db } = require("../services/firebaseService");

exports.joinQueue = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID required" });

  try {
    const queueRef = db.ref(`queue/${userId}`);
    await queueRef.set({
      joinedAt: Date.now(),
    });
    return res.json({ success: true });
  } catch (err) {
    console.error("Join Queue Error:", err);
    res.status(500).json({ error: "Failed to join queue" });
  }
};

exports.leaveQueue = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID required" });

  try {
    const queueRef = db.ref(`queue/${userId}`);
    await queueRef.remove();
    return res.json({ success: true });
  } catch (err) {
    console.error("Leave Queue Error:", err);
    res.status(500).json({ error: "Failed to leave queue" });
  }
};
