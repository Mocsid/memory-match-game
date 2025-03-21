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

const emojis = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"];

const Game = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [matchData, setMatchData] = useState(null);
  const [usernameMap, setUsernameMap] = useState({});
  const [flippedIndexes, setFlippedIndexes] = useState([]);
  const [matchedIndexes, setMatchedIndexes] = useState([]);

  // Load sounds
  const flipSFX = new Audio(flipSound);
  const matchSFX = new Audio(matchSound);

  // Track presence for auto-lose
  useEffect(() => {
    if (!matchId || !userId) return;
    const presenceRef = ref(database, `matches/${matchId}/presence/${userId}`);
    const disconnectRef = onDisconnect(presenceRef);
    disconnectRef.remove(); // auto-remove on disconnect
    set(presenceRef, { online: true, lastSeen: Date.now() });

    return () => remove(presenceRef);
  }, [matchId, userId]);

  // Real-time match data listener
  useEffect(() => {
    if (!matchId) return;

    const matchRef = ref(database, `matches/${matchId}`);
    const unsub = onValue(matchRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        navigate("/");
        return;
      }

      // Check if player left
      const players = data.players || [];
      const presence = data.presence || {};
      const onlineCount = players.filter((uid) => presence[uid]?.online).length;

      if (players.length === 2 && onlineCount < 2 && data.status !== "completed") {
        const loser = players.find((uid) => !presence[uid]?.online);
        const winner = players.find((uid) => uid !== loser);

        update(matchRef, {
          status: "completed",
          winner,
        });

        if (userId === winner) {
          update(ref(database, `users/${userId}`), {
            wins: (data.wins || 0) + 1,
          });
        } else {
          update(ref(database, `users/${userId}`), {
            losses: (data.losses || 0) + 1,
          });
        }

        setTimeout(() => navigate("/"), 3000);
        return;
      }

      setMatchData(data);
      setFlippedIndexes(data.flipped || []);
      setMatchedIndexes(data.matched || []);
    });

    return () => {
      const matchRef = ref(database, `matches/${matchId}`);
      off(matchRef);
    };
  }, [matchId, navigate, userId]);

  const isMyTurn = matchData?.turn === userId;

  const handleCardClick = async (index) => {
    if (!isMyTurn || flippedIndexes.includes(index) || matchedIndexes.includes(index)) return;

    const updatedFlipped = [...flippedIndexes, index];
    setFlippedIndexes(updatedFlipped);
    flipSFX.play();

    await update(ref(database, `matches/${matchId}`), {
      flipped: updatedFlipped,
    });

    if (updatedFlipped.length === 2) {
      const [i1, i2] = updatedFlipped;
      const isMatch = matchData.board[i1] === matchData.board[i2];

      if (isMatch) matchSFX.play();

      const updates = {
        flipped: [],
        matched: isMatch ? [...matchedIndexes, i1, i2] : matchedIndexes,
        turn: isMatch ? userId : matchData.players.find((id) => id !== userId),
      };

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await update(ref(database, `matches/${matchId}`), updates);
    }
  };

  if (!matchData || !matchData.board) {
    return (
      <div className="text-white flex items-center justify-center h-screen">
        Loading game...
      </div>
    );
  }

  return (
    <>
      <MainNav />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 flex flex-col items-center justify-center text-white px-4">
        <h2 className="text-2xl font-semibold mb-4">
          {isMyTurn ? "Your turn!" : "Waiting for opponent..."}
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {matchData.board.map((emoji, index) => {
            const isFlipped = flippedIndexes.includes(index);
            const isMatched = matchedIndexes.includes(index);

            return (
              <div
                key={index}
                onClick={() => handleCardClick(index)}
                className={`w-16 h-16 flex items-center justify-center text-2xl rounded-md shadow-md cursor-pointer transition-all ${
                  isMatched
                    ? "bg-green-600"
                    : isFlipped
                    ? "bg-blue-500"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
              >
                {isFlipped || isMatched ? emoji : "❓"}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
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
