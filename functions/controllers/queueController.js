const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * Simple Queue System:
 *  - If no user is waiting, store the current user in Firestore as 'waiting'.
 *  - If someone is already waiting, create a match for both users and clear the queue.
 */

// In-memory approach is possible, but we'll use Firestore for demonstration
const QUEUE_DOC = "lobbyQueue";

exports.joinQueue = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // 1. Read the 'lobbyQueue' doc from Firestore
    const queueRef = db.collection("queue").doc(QUEUE_DOC);
    const queueDoc = await queueRef.get();

    // If doc doesn't exist yet, create empty data
    if (!queueDoc.exists) {
      await queueRef.set({ waitingUser: null });
    }

    let waitingUser = null;
    if (queueDoc.exists) {
      waitingUser = queueDoc.data().waitingUser || null;
    }

    // 2. Check if there's a waitingUser
    if (!waitingUser) {
      // No one is waiting yet, so store this user as waiting
      await queueRef.update({ waitingUser: userId });

      return res.json({
        success: true,
        matchFound: false,
        message: "You are now waiting for an opponent."
      });
    } else if (waitingUser === userId) {
      // The same user re-queued? This scenario is optional to handle
      return res.status(400).json({
        error: "You are already in the queue, please wait for an opponent."
      });
    } else {
      // Another user is waiting! Create a match
      // matchId can be a random ID or we can rely on Firestore .doc().id
      const matchId = `match_${Date.now()}`;

      // Clear the waitingUser from the queue
      await queueRef.update({ waitingUser: null });

      // Return matchId + players in response
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
};
