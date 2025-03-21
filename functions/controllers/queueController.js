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
    
    // Check waiting queue
    const queueRef = db.ref(WAITING_QUEUE_PATH);
    const snapshot = await queueRef.get();
    
    let waitingUserId = null;
    if (snapshot.exists()) {
      const waitingUsers = snapshot.val();
      waitingUserId = Object.keys(waitingUsers)[0]; // grab the first waiting user
    }
    
    if (!waitingUserId) {
      // No one waiting — add this user to the queue
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
    
    // Match found — create a match for both players
    const matchId = `match_${Date.now()}`;
    const players = [waitingUserId, userId];
    const starter = players[Math.floor(Math.random() * players.length)];
    const board = generateShuffledDeck();
    
    // Create match data under /matches/{matchId}
    const matchData = {
      players,
      turn: starter,
      board,
      flipped: [],
      matched: [],
      lastAction: {
        type: "init",
        by: starter,
        timestamp: Date.now(),
      },
      createdAt: Date.now(),
    };
    
    await db.ref(`matches/${matchId}`).set(matchData);
    console.log("✅ Match initialized at /matches/" + matchId);
    
    // Remove the waiting user from the queue
    await db.ref(`${WAITING_QUEUE_PATH}/${waitingUserId}`).remove();
    
    // Update /userMatches for both players with status "ready"
    const updates = {};
    players.forEach((uid) => {
      updates[`${USER_MATCHES_PATH}/${uid}`] = {
        matchId,
        createdAt: Date.now(),
        status: "ready",
      };
    });
    await db.ref().update(updates);
    
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

function generateShuffledDeck() {
  const base = [];
  for (let i = 1; i <= 8; i++) {
    base.push(i, i); // each card appears twice
  }
  // Simple shuffle algorithm
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  return base;
}
