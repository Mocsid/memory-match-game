const { db } = require("../services/firebaseService");

// Realtime Database paths
const WAITING_QUEUE_PATH = "waitingQueue";
const USER_MATCHES_PATH = "userMatches";

exports.joinQueue = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const queueRef = db.ref(WAITING_QUEUE_PATH);
    const snapshot = await queueRef.get();

    let waitingUserId = null;
    if (snapshot.exists()) {
      const waitingUsers = snapshot.val();
      waitingUserId = Object.keys(waitingUsers)[0]; // grab the first user
    }

    if (!waitingUserId) {
      // No one is waiting, add this user to the queue
      await db.ref(`${WAITING_QUEUE_PATH}/${userId}`).set({
        userId,
        joinedAt: Date.now(),
      });
      return res.json({
        success: true,
        matchFound: false,
        message: "You are now waiting for an opponent.",
      });
    }

    if (waitingUserId === userId) {
      return res.status(400).json({
        error: "You are already in the queue, please wait for an opponent.",
      });
    }

    // Match found - create a match entry for both players
    const matchId = `match_${Date.now()}`;
    const players = [waitingUserId, userId];

    const updates = {};
    players.forEach((uid) => {
      updates[`${USER_MATCHES_PATH}/${uid}`] = {
        matchId,
        createdAt: Date.now(),
        status: "waiting", // Optional: useful for frontend
      };
    });

    // Write both users' match and remove the matched user from the queue
    await db.ref().update(updates);
    await db.ref(`${WAITING_QUEUE_PATH}/${waitingUserId}`).remove();

    return res.json({
      success: true,
      matchFound: true,
      matchId,
      players,
    });
  } catch (error) {
    console.error("joinQueue error:", error);
    return res.status(500).json({ error: "Internal server error while queueing." });
  }
};

exports.cancelQueue = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    await db.ref(`${WAITING_QUEUE_PATH}/${userId}`).remove();

    return res.json({
      success: true,
      message: "Queue cancelled successfully.",
    });
  } catch (error) {
    console.error("cancelQueue error:", error);
    return res.status(500).json({ error: "Internal server error while cancelling queue." });
  }
};
