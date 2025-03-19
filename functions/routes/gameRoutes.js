const express = require("express");
const admin = require("firebase-admin");

const router = express.Router();
const db = admin.firestore();

const QUEUE_DOC = "lobbyQueue";

// ✅ Join Game Queue Route
router.post("/join", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const queueRef = db.collection("queue").doc(QUEUE_DOC);
    const queueDoc = await queueRef.get();

    if (!queueDoc.exists) {
      await queueRef.set({ waitingUser: null });
    }

    let waitingUser = queueDoc.exists ? queueDoc.data().waitingUser || null : null;

    if (!waitingUser) {
      await queueRef.update({ waitingUser: userId });

      return res.json({
        success: true,
        matchFound: false,
        message: "You are now waiting for an opponent."
      });
    } else if (waitingUser === userId) {
      return res.status(400).json({
        error: "You are already in the queue, please wait for an opponent."
      });
    } else {
      const matchId = `match_${Date.now()}`;
      await queueRef.update({ waitingUser: null });

      return res.json({
        success: true,
        matchFound: true,
        matchId,
        players: [waitingUser, userId]
      });
    }
  } catch (error) {
    console.error("joinQueue error:", error);
    return res.status(500).json({ error: "Internal server error while queueing." });
  }
});

// ✅ Export the router correctly
module.exports = router;
