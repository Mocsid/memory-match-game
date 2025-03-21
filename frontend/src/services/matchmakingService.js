import { database } from "../config/firebaseConfig";
import { ref, set, get, push, remove, onValue } from "firebase/database";

export const joinQueue = async (userId) => {
  const queueRef = ref(database, "queue");
  const snapshot = await get(queueRef);

  if (!snapshot.exists()) {
    // no one is in queue, add this user
    await set(queueRef, { waitingUser: userId });
    return { waiting: true };
  }

  const { waitingUser } = snapshot.val();

  if (waitingUser === userId) {
    return { waiting: true }; // already waiting
  }

  // found another player, create a match
  const matchRef = push(ref(database, "matches"));
  const matchId = matchRef.key;

  const matchData = {
    players: [waitingUser, userId],
    turn: waitingUser,
    status: "active",
    board: generateShuffledBoard(),
    flipped: [],
    matched: [],
  };

  await set(matchRef, matchData);
  await remove(queueRef); // clear the queue

  return {
    matchId,
    players: matchData.players,
  };
};

const generateShuffledBoard = () => {
  const base = ["🍎", "🍌", "🍇", "🍒", "🥝", "🍋", "🍊", "🍓"];
  const doubled = [...base, ...base];
  return doubled.sort(() => Math.random() - 0.5);
};
