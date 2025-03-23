const { db } = require("../services/firebaseService");
const { v4: uuidv4 } = require("uuid");

exports.joinQueue = async (req, res) => {
  console.log("🔍 joinQueue");
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const queueRef = db.ref("queue");
  const lockRef = db.ref("matchmaking/lock");
  const matchId = uuidv4();

  try {
    // 1. Acquire matchmaking lock
    const lockSnap = await lockRef.once("value");
    if (lockSnap.exists()) {
      return res.json({ waiting: true }); // someone is matching, wait
    }
    await lockRef.set(true); // lock matchmaking temporarily

    // 2. Get queue
    const snapshot = await queueRef.once("value");
    const queue = snapshot.val() || {};

    const waitingPlayerId = Object.keys(queue).find(
      (id) => id !== userId && !queue[id].matchId
    );

    if (waitingPlayerId) {
      // 3. Create match
      const matchData = {
        matchId,
        players: [waitingPlayerId, userId],
        board: generateShuffledBoard(),
        flipped: [],
        matched: [],
        turn: waitingPlayerId,
        status: "active",
        createdAt: Date.now(),
      };

      await db.ref(`matches/${matchId}`).set(matchData);

      await db.ref(`queue/${userId}`).set({ matchId });
      await db.ref(`queue/${waitingPlayerId}/matchId`).set(matchId);

      console.log(`✅ Match created: ${matchId} between ${waitingPlayerId} and ${userId}`);

      await lockRef.remove(); // release lock
      return res.json({ matchId });
    }

    // No match yet, enqueue
    await db.ref(`queue/${userId}`).set({ joinedAt: Date.now() });
    await lockRef.remove(); // release lock
    console.log(`🕒 ${userId} waiting in queue...`);
    return res.json({ waiting: true });

  } catch (error) {
    console.error("❌ joinQueue error:", error);
    await lockRef.remove(); // always release lock
    return res.status(500).json({ error: "Internal server error" });
  }
};

function generateShuffledBoard() {
  const emojis = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"];
  const pairs = [...emojis, ...emojis];
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}
