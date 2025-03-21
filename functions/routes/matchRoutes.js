const express = require("express");
const { db } = require("../services/firebaseService");
const router = express.Router();

// Join Queue — for now, just store player ID
router.post("/join", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const queueRef = db.ref("queue");
    const snapshot = await queueRef.once("value");
    const queue = snapshot.val() || {};

    const players = Object.keys(queue);

    if (players.length > 0) {
      const opponentId = players[0];

      // Remove both from queue
      await db.ref(`queue/${opponentId}`).remove();

      // Create match
      const matchId = `match_${Date.now()}`;
      await db.ref(`matches/${matchId}`).set({
        players: [opponentId, userId],
        board: generateShuffledBoard(),
        flipped: [],
        matched: [],
        turn: opponentId,
        status: "active",
        createdAt: Date.now(),
      });

      return res.json({ matchId });
    }

    // Add this player to the queue
    await db.ref(`queue/${userId}`).set({
      joinedAt: Date.now(),
    });

    return res.json({ message: "Waiting for opponent..." });
  } catch (error) {
    console.error("Join Match Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Leave Match
router.post("/leave", async (req, res) => {
  const { userId, matchId } = req.body;
  if (!userId || !matchId) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const matchRef = db.ref(`matches/${matchId}`);
    const matchSnapshot = await matchRef.once("value");

    if (!matchSnapshot.exists()) {
      return res.status(404).json({ error: "Match not found" });
    }

    const matchData = matchSnapshot.val();
    const remainingPlayer = matchData.players.find((p) => p !== userId);

    // Mark match as completed
    await matchRef.update({
      status: "completed",
      endedAt: Date.now(),
      winner: remainingPlayer,
      loser: userId,
    });

    // Update scores
    if (remainingPlayer) {
      await db.ref(`users/${remainingPlayer}`).transaction((user) => {
        if (user) {
          user.wins = (user.wins || 0) + 1;
        }
        return user;
      });
    }

    await db.ref(`users/${userId}`).transaction((user) => {
      if (user) {
        user.losses = (user.losses || 0) + 1;
      }
      return user;
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Leave Match Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Helper: Generate shuffled card board
function generateShuffledBoard() {
  const images = [
    "🐶", "🐱", "🐭", "🐹", "🐰",
    "🦊", "🐻", "🐼"
  ];

  const doubled = [...images, ...images];
  for (let i = doubled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [doubled[i], doubled[j]] = [doubled[j], doubled[i]];
  }

  return doubled;
}

module.exports = router;
