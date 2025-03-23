// FILE: frontend/src/pages/Game.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { database } from "../config/firebaseConfig";
import {
  ref,
  onValue,
  set,
  update,
  remove,
  onDisconnect,
  off,
  get,
} from "firebase/database";
import MainNav from "../components/MainNav";
import flipSound from "../assets/sounds/flip.wav";
import matchSound from "../assets/sounds/match.wav";

const Game = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [matchData, setMatchData] = useState(null);
  const [flippedIndexes, setFlippedIndexes] = useState([]);
  const [matchedIndexes, setMatchedIndexes] = useState([]);
  const [flipCount, setFlipCount] = useState(0);

  const flipSFX = new Audio(flipSound);
  const matchSFX = new Audio(matchSound);

  // Set presence
  useEffect(() => {
    if (!matchId || !userId) return;

    console.log(`[Presence] Setting presence for ${userId} in ${matchId}`);
    const presenceRef = ref(database, `matches/${matchId}/presence/${userId}`);
    onDisconnect(presenceRef).remove();
    set(presenceRef, { online: true, lastSeen: Date.now() });

    return () => {
      console.log(`[Presence] Removing presence for ${userId}`);
      remove(presenceRef);
    };
  }, [matchId, userId]);

  // Listen to match updates
  useEffect(() => {
    if (!matchId) return;

    const matchRef = ref(database, `matches/${matchId}`);
    const unsub = onValue(matchRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        console.warn("[Match] Not found — redirecting to home.");
        navigate("/");
        return;
      }

      console.log("[Match] Match data updated:", data);
      setMatchData(data);
      setFlippedIndexes(data.flipped || []);
      setMatchedIndexes(data.matched || []);
      setFlipCount(data.flipCounts?.[userId] || 0);

      const players = data.players || [];
      const presence = data.presence || {};
      console.log("[Presence Check]", presence);

      // Safeguard presence check
      if (
        data.status === "active" &&
        players.length === 2 &&
        Object.keys(presence).length === 2 &&
        players.some((uid) => !presence[uid]?.online)
      ) {
        const loser = players.find((uid) => !presence[uid]?.online);
        const winner = players.find((uid) => uid && uid !== loser);

        if (!winner) {
          console.error("[Match] Cannot determine winner", { players, presence });
          return;
        }

        // Wait 3s and verify before declaring winner
        setTimeout(async () => {
          const latestSnapshot = await get(ref(database, `matches/${matchId}/presence`));
          const latestPresence = latestSnapshot.val() || {};
          const stillGone = !latestPresence[loser]?.online;

          if (stillGone) {
            console.warn("[Match] Confirmed player left. Declaring winner.");

            const winnerRef = ref(database, `users/${winner}`);
            const loserRef = ref(database, `users/${loser}`);

            await update(ref(database, `matches/${matchId}`), {
              status: "completed",
              winner,
            });

            await update(winnerRef, {
              wins: (data.wins || 0) + 1,
            });

            await update(loserRef, {
              losses: (data.losses || 0) + 1,
            });

            setTimeout(() => {
              navigate(`/summary/${matchId}`);
            }, 2000);
          }
        }, 3000);
      }

      // Match ended normally
      if (data.status === "completed" && data.winner) {
        console.log("[Match] Game completed. Redirecting to summary.");
        setTimeout(() => {
          navigate(`/summary/${matchId}`);
        }, 2000);
      }
    });

    return () => {
      console.log("[Match] Unsubscribing match listener");
      off(matchRef);
    };
  }, [matchId, navigate, userId]);

  const isMyTurn = matchData?.turn === userId;

  const handleCardClick = async (index) => {
    if (!matchData || !isMyTurn) return;
    if (flippedIndexes.includes(index) || matchedIndexes.includes(index)) return;

    const updatedFlipped = [...flippedIndexes, index];
    setFlippedIndexes(updatedFlipped);
    flipSFX.play();

    const matchRef = ref(database, `matches/${matchId}`);
    const newFlipCount = (matchData.flipCounts?.[userId] || 0) + 1;

    await update(matchRef, {
      flipped: updatedFlipped,
      [`flipCounts/${userId}`]: newFlipCount,
    });

    if (updatedFlipped.length === 2) {
      const [i1, i2] = updatedFlipped;
      const isMatch = matchData.board[i1] === matchData.board[i2];
      if (isMatch) matchSFX.play();

      await new Promise((res) => setTimeout(res, 1000));

      const updates = {
        flipped: [],
        matched: isMatch ? [...matchedIndexes, i1, i2] : matchedIndexes,
        turn: isMatch
          ? userId
          : matchData.players.find((id) => id !== userId),
      };

      await update(matchRef, updates);
    }
  };

  if (!matchData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Loading game...
      </div>
    );
  }

  if (!Array.isArray(matchData.board)) {
    console.error("[Game] Invalid board:", matchData);
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Error loading game board.
      </div>
    );
  }

  const presence = matchData.presence || {};
  const players = matchData.players || [];
  if (
    matchData.status === "active" &&
    players.length === 2 &&
    Object.keys(presence).length < 2
  ) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Waiting for both players to connect...
      </div>
    );
  }

  const isMatched = (i) => matchedIndexes.includes(i);
  const isFlipped = (i) => flippedIndexes.includes(i);

  return (
    <>
      <MainNav />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 flex flex-col items-center justify-center text-white px-4">
        <h2 className="text-2xl font-semibold mb-4">
          {isMyTurn ? "Your turn!" : "Waiting for opponent..."}
        </h2>

        <div className="grid grid-cols-4 gap-4">
          {matchData.board.map((emoji, index) => (
            <div
              key={index}
              onClick={() => handleCardClick(index)}
              className={`w-16 h-16 flex items-center justify-center text-2xl rounded-md shadow-md cursor-pointer transition-all ${
                isMatched(index)
                  ? "bg-green-600"
                  : isFlipped(index)
                  ? "bg-blue-500"
                  : "bg-gray-600 hover:bg-gray-500"
              }`}
            >
              {isMatched(index) || isFlipped(index) ? emoji : "❓"}
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            console.log("[Leave] " + userId + " is leaving the match");
            remove(ref(database, `matches/${matchId}/presence/${userId}`));
            navigate("/");
          }}
          className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
        >
          Leave Game
        </button>
      </div>
    </>
  );
};

export default Game;
