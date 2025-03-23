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

  // SFX
  const flipSFX = new Audio(flipSound);
  const matchSFX = new Audio(matchSound);

  // Track presence in this match
  useEffect(() => {
    if (!matchId || !userId) return;

    const presenceRef = ref(database, `matches/${matchId}/presence/${userId}`);
    onDisconnect(presenceRef).remove();
    set(presenceRef, { online: true, lastSeen: Date.now() });

    return () => {
      remove(presenceRef);
    };
  }, [matchId, userId]);

  // Listen for match updates
  useEffect(() => {
    if (!matchId) return;

    const matchRef = ref(database, `matches/${matchId}`);
    const unsub = onValue(matchRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        // match is missing -> go home
        console.warn("Match not found; going home");
        navigate("/");
        return;
      }

      setMatchData(data);
      setFlippedIndexes(data.flipped || []);
      setMatchedIndexes(data.matched || []);

      // Check if a player left mid-game
      const players = data.players || [];
      const presence = data.presence || {};
      const onlineCount = players.filter((p) => presence[p]?.online).length;

      // If game is active, but only 1 or 0 players are online => auto-complete
      if (data.status === "active" && onlineCount < 2 && players.length === 2) {
        const loser = players.find((uid) => !presence[uid]?.online);
        const winner = players.find((uid) => uid && uid !== loser);
        if (!winner) {
          console.error("Cannot determine winner", { players, presence });
          return;
        }

        // Mark completed
        update(matchRef, {
          status: "completed",
          winner,
        }).then(() => {
          // Optionally update stats in /users
          // (We could store wins/losses on match creation if you want)
          // Example:
          update(ref(database, `users/${winner}`), {
            wins: (data.wins || 0) + 1, 
          });
          update(ref(database, `users/${loser}`), {
            losses: (data.losses || 0) + 1,
          });

          // Optionally do NOT remove the match here to avoid "match not found" for the other user
          // If you want to remove it, do it after a delay:
          setTimeout(() => {
            // remove(matchRef);
            navigate("/");
          }, 3000);
        });
      }
    });

    return () => off(matchRef);
  }, [matchId, navigate, userId]);

  // Is it my turn?
  const isMyTurn = matchData?.turn === userId;

  // Handle flipping a card
  const handleCardClick = async (index) => {
    if (!matchData || !isMyTurn) return;
    if (flippedIndexes.includes(index) || matchedIndexes.includes(index)) return;

    const updatedFlipped = [...flippedIndexes, index];
    setFlippedIndexes(updatedFlipped);
    flipSFX.play();

    const matchRef = ref(database, `matches/${matchId}`);
    await update(matchRef, { flipped: updatedFlipped });

    // If two cards are now flipped, check if it’s a match
    if (updatedFlipped.length === 2) {
      const [i1, i2] = updatedFlipped;
      const isMatch = matchData.board[i1] === matchData.board[i2];
      if (isMatch) matchSFX.play();

      // Wait 1 second before resetting flips
      await new Promise((r) => setTimeout(r, 1000));

      const updates = {
        flipped: [],
        matched: isMatch
          ? [...matchedIndexes, i1, i2]
          : matchedIndexes,
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
    console.error("Invalid or missing board in match:", matchData);
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Error: Invalid game board.
      </div>
    );
  }

  // For UX: if we still only have partial presence, show a waiting message
  const presence = matchData.presence || {};
  const players = matchData.players || [];
  if (players.length === 2 && Object.keys(presence).length < 2) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Waiting for both players to connect...
      </div>
    );
  }

  // Render the board
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
              {isFlipped(index) || isMatched(index) ? emoji : "❓"}
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            // If user leaves mid-game, remove them from presence
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
