const admin = require("firebase-admin");
const db = admin.firestore();

const QUEUE_DOC = "lobbyQueue";

exports.cancelQueue = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const queueRef = db.collection("queue").doc(QUEUE_DOC);
    const queueDoc = await queueRef.get();

    if (!queueDoc.exists) {
      return res.status(404).json({ error: "Queue not initialized." });
    }

    const waitingUser = queueDoc.data().waitingUser || null;

    // Check if the user is currently waiting.
    if (waitingUser !== userId) {
      return res.status(400).json({ error: "You are not in the queue." });
    }

    // Reset the waiting state.
    await queueRef.update({ waitingUser: null });
    return res.json({ success: true, message: "Queue cancelled successfully." });
  } catch (error) {
    console.error("cancelQueue error:", error);
    return res.status(500).json({ error: "Internal server error while cancelling queue." });
  }
};

exports.joinQueue = async (req, res) => {
  try {
    console.log("joinQueue: Request body:", req.body);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // ✅ Reference the queue collection and the specific document
    const queueRef = db.collection("queue").doc(QUEUE_DOC);
    let queueDoc = await queueRef.get();

    // ✅ Ensure the queue document exists (Firestore auto-creates the collection)
    if (!queueDoc.exists) {
      console.log("joinQueue: Collection or document missing. Creating...");
      await queueRef.set({ waitingUser: null });
      queueDoc = await queueRef.get();
    }

    console.log("joinQueue: Queue document data:", queueDoc.data());
    const waitingUser = queueDoc.data().waitingUser || null;

    if (!waitingUser) {
      await queueRef.update({ waitingUser: userId });
      console.log(`joinQueue: User ${userId} added to the queue.`);
      return res.json({
        success: true,
        matchFound: false,
        message: "You are now waiting for an opponent."
      });
    } else if (waitingUser === userId) {
      console.log(`joinQueue: User ${userId} is already waiting.`);
      return res.status(400).json({
        error: "You are already in the queue, please wait for an opponent."
      });
    } else {
      const matchId = `match_${Date.now()}`;
      await queueRef.update({ waitingUser: null });
      console.log(`joinQueue: Match created - ${waitingUser} vs ${userId}`);
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
