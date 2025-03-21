// 📄 File: backend/controllers/matchController.js

const { db } = require("../services/firebaseService");
const { ref, get, update, remove } = require("firebase-admin/database");

exports.leaveMatch = async (req, res) => {
  const { matchId, userId } = req.body;
  if (!matchId || !userId) {
    return res.status(400).json({ error: "Missing matchId or userId" });
  }

  const matchRef = ref(db, `matches/${matchId}`);
  const snapshot = await get(matchRef);
  const match = snapshot.val();

  if (!match) {
    return res.status(404).json({ error: "Match not found." });
  }

  const players = match.players || [];
  const opponent = players.find((p) => p !== userId);

  // If no opponent, just delete match
  if (!opponent) {
    await remove(matchRef);
    return res.json({ success: true, message: "Match removed (only 1 player)." });
  }

  // Record win/loss (in a new path if you want)
  const resultRef = ref(db, `matchResults/${matchId}`);
  const result = {
    winner: opponent,
    loser: userId,
    timestamp: Date.now(),
  };

  await update(resultRef, result);
  await remove(matchRef);

  return res.json({ success: true, message: "Match ended. Opponent wins.", result });
};
