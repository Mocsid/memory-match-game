const { db } = require("../services/firebaseService");
const { ref, get, set, remove, update, child } = require("firebase-admin/database");

// RTDB paths
const WAITING_QUEUE_PATH = "waitingQueue";
const USER_MATCHES_PATH = "userMatches";

exports.joinQueue = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const queueRef = ref(db, WAITING_QUEUE_PATH);
    const snapshot = await get(queueRef);

    let waitingUserId = null;
    if (snapshot.exists()) {
      const waitingUsers = snapshot.val();
      waitingUserId = Object.keys(waitingUsers)[0]; // grab first
    }

    if (!waitingUserId) {
      // No one waiting → add this user to the queue
      await set(ref(db, `${WAITING_QUEUE_PATH}/${userId}`), {
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

    // ✅ Pair with waiting user
    const matchId = `match_${Date.now()}`;
    const players = [waitingUserId, userId];

    const updates = {};
    players.forEach((uid) => {
      updates[`${USER_MATCHES_PATH}/${uid}`] = {
        matchId,
        createdAt: Date.now(),
      };
    });

    await update(ref(db), updates);
    await remove(ref(db, `${WAITING_QUEUE_PATH}/${waitingUserId}`));

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

    await remove(ref(db, `${WAITING_QUEUE_PATH}/${userId}`));

    return res.json({
      success: true,
      message: "Queue cancelled successfully.",
    });
  } catch (error) {
    console.error("cancelQueue error:", error);
    return res.status(500).json({ error: "Internal server error while cancelling queue." });
  }
};
