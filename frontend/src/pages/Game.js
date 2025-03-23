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
  const [myUsername, setMyUsername] = useState("You");
  const [opponentUsername, setOpponentUsername] = useState("Opponent");

  const flipSFX = new Audio(flipSound);
  const matchSFX = new Audio(matchSound);

  useEffect(() => {
    if (!matchId || !userId) return;

    const presenceRef = ref(database, `matches/${matchId}/presence/${userId}`);
    onDisconnect(presenceRef).remove();
    set(presenceRef, { online: true, lastSeen: Date.now() });

    return () => {
      remove(presenceRef);
    };
  }, [matchId, userId]);

  // Fetch usernames
  useEffect(() => {
    if (!matchId || !userId) return;
    const usersRef = ref(database, "users");
    get(usersRef).then((snapshot) => {
      const users = snapshot.val();
      if (!users) return;

      const matchRef = ref(database, `matches/${matchId}`);
      get(matchRef).then((snap) => {
        const data = snap.val();
        if (!data) return;

        const players = data.players || [];
        const opponentId = players.find((id) => id !== userId);
        if (users[userId]) setMyUsername(users[userId].username);
        if (opponentId && users[opponentId]) setOpponentUsername(users[opponentId].username);
      });
    });
  }, [matchId, userId]);

  // Listen to match updates
  useEffect(() => {
    if (!matchId) return;

    const matchRef = ref(database, `matches/${matchId}`);
    const unsub = onValue(matchRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        navigate("/");
        return;
      }

      setMatchData(data);
      setFlippedIndexes(data.flipped || []);
      setMatchedIndexes(data.matched || []);

      const players = data.players || [];
      const presence = data.presence || {};

      if (data.status === "completed" && data.winner) {
        setTimeout(() => {
          navigate(`/summary/${matchId}`);
        }, 2000);
        return;
      }

      // All cards matched
      if ((data.matched?.length || 0) === 16 && data.status === "active") {
        const flipCounts = data.flipCounts || {};
        const winner =
          (flipCounts[players[0]] || 0) > (flipCounts[players[1]] || 0)
            ? players[0]
            : players[1];

        const loser = players.find((uid) => uid !== winner);

        await update(ref(database, `matches/${matchId}`), {
          status: "completed",
          winner,
        });

        const winnerRef = ref(database, `users/${winner}`);
        const loserRef = ref(database, `users/${loser}`);

        const [winnerSnap, loserSnap] = await Promise.all([
          get(winnerRef),
          get(loserRef),
        ]);

        const winnerData = winnerSnap.val() || {};
        const loserData = loserSnap.val() || {};

        await Promise.all([
          update(winnerRef, {
            wins: (winnerData.wins || 0) + 1,
            username: winnerData.username || `unknown_${winner}`,
          }),
          update(loserRef, {
            losses: (loserData.losses || 0) + 1,
            username: loserData.username || `unknown_${loser}`,
          }),
        ]);

        setTimeout(() => {
          navigate(`/summary/${matchId}`);
        }, 2000);

        return;
      }

      // Player left handling
      if (
        data.status === "active" &&
        players.length === 2 &&
        Object.keys(presence).length === 2 &&
        players.some((uid) => !presence[uid]?.online)
      ) {
        const leaver = players.find((uid) => !presence[uid]?.online);
        const other = players.find((uid) => uid !== leaver);

        setTimeout(async () => {
          const check = await get(ref(database, `matches/${matchId}/presence`));
          const stillGone = !check.val()?.[leaver]?.online;
          if (stillGone) {
            await update(ref(database, `matches/${matchId}`), {
              status: "completed",
              winner: other,
            });

            const [winnerSnap, loserSnap] = await Promise.all([
              get(ref(database, `users/${other}`)),
              get(ref(database, `users/${leaver}`)),
            ]);

            const winnerData = winnerSnap.val() || {};
            const loserData = loserSnap.val() || {};

            await Promise.all([
              update(ref(database, `users/${other}`), {
                wins: (winnerData.wins || 0) + 1,
                username: winnerData.username || `unknown_${other}`,
              }),
              update(ref(database, `users/${leaver}`), {
                losses: (loserData.losses || 0) + 1,
                username: loserData.username || `unknown_${leaver}`,
              }),
            ]);

            navigate(`/summary/${matchId}`);
          }
        }, 3000);
      }
    });

    return () => {
      off(matchRef);
    };
  }, [matchId, navigate, userId]);

  const isMyTurn = matchData?.turn === userId;

  const handleCardClick = async (index) => {
    if (!matchData || !isMyTurn) return;
    if (flippedIndexes.includes(index) || matchedIndexes.includes(index)) return;

    const updatedFlipped = [...flippedIndexes, index];
    flipSFX.play();

    await update(ref(database, `matches/${matchId}`), {
      flipped: updatedFlipped,
    });

    if (updatedFlipped.length === 2) {
      const [i1, i2] = updatedFlipped;
      const isMatch = matchData.board[i1] === matchData.board[i2];
      if (isMatch) matchSFX.play();

      await new Promise((res) => setTimeout(res, 1000));

      const newMatched = isMatch ? [...matchedIndexes, i1, i2] : matchedIndexes;
      const newFlipCount = isMatch
        ? (matchData.flipCounts?.[userId] || 0) + 1
        : matchData.flipCounts?.[userId] || 0;

      const turn = isMatch
        ? userId
        : matchData.players.find((id) => id !== userId);

      await update(ref(database, `matches/${matchId}`), {
        flipped: [],
        matched: newMatched,
        turn,
        [`flipCounts/${userId}`]: newFlipCount,
      });
    }
  };

  if (!matchData) {
    return <div className="h-screen flex justify-center items-center text-white">Loading game...</div>;
  }

  const players = matchData.players || [];
  const presence = matchData.presence || {};

  if (
    matchData.status === "active" &&
    players.length === 2 &&
    Object.keys(presence).length < 2
  ) {
    return <div className="h-screen flex justify-center items-center text-white">Waiting for both players to connect...</div>;
  }

  const isMatched = (i) => matchedIndexes.includes(i);
  const isFlipped = (i) => flippedIndexes.includes(i);

  return (
    <>
      <MainNav />
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gray-900">
        <h2 className="text-2xl mb-4">
          {isMyTurn
            ? `Your turn (${myUsername})`
            : `Waiting for opponent (${opponentUsername})`}
        </h2>

        <div className="grid grid-cols-4 gap-4">
          {matchData.board.map((emoji, index) => (
            <div
              key={index}
              onClick={() => handleCardClick(index)}
              className={`w-16 h-16 flex items-center justify-center text-2xl rounded-md cursor-pointer ${
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
            remove(ref(database, `matches/${matchId}/presence/${userId}`));
            navigate("/");
          }}
          className="mt-6 px-4 py-2 bg-red-600 rounded hover:bg-red-700"
        >
          Leave Game
        </button>
      </div>
    </>
  );
};

export default Game;
