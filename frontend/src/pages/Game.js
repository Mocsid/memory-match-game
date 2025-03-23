import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ref,
  onValue,
  set,
  update,
  onDisconnect,
  off,
  get,
} from "firebase/database";
import { database } from "../config/firebaseConfig";
import MainNav from "../components/MainNav";
import flipSound from "../assets/sounds/flip.wav";
import matchSound from "../assets/sounds/match.wav";
import { useTranslation } from "react-i18next";

const Game = () => {
  const { t } = useTranslation();
  const { matchId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [matchData, setMatchData] = useState(null);
  const [flippedIndexes, setFlippedIndexes] = useState([]);
  const [matchedIndexes, setMatchedIndexes] = useState([]);
  const [flipCounts, setFlipCounts] = useState({});
  const [myUsername, setMyUsername] = useState("You");
  const [opponentUsername, setOpponentUsername] = useState("Opponent");
  const [presenceReady, setPresenceReady] = useState(false);

  const flipSFX = new Audio(flipSound);
  const matchSFX = new Audio(matchSound);

  useEffect(() => {
    if (!matchId || !userId) return;

    const presenceRef = ref(database, `matches/${matchId}/presence/${userId}`);
    onDisconnect(presenceRef).remove();
    set(presenceRef, { online: true, lastSeen: Date.now() });

    return () => {
      off(presenceRef);
    };
  }, [matchId, userId]);

  useEffect(() => {
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
        if (opponentId && users[opponentId]) {
          setOpponentUsername(users[opponentId].username);
        }
      });
    });
  }, [matchId, userId]);

  useEffect(() => {
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
      setFlipCounts(data.flipCounts || {});

      const players = data.players || [];
      const presence = data.presence || {};

      const allPlayersPresent = players.every(
        (uid) => presence[uid]?.online === true
      );

      if (!presenceReady && allPlayersPresent) {
        setPresenceReady(true);
      }

      if (data.status === "completed") {
        setTimeout(() => {
          navigate(`/summary/${matchId}`);
        }, 1000);
        return;
      }

      if ((data.matched?.length || 0) === 16 && data.status === "active") {
        const [p1, p2] = players;
        const p1Flips = data.flipCounts?.[p1] || 0;
        const p2Flips = data.flipCounts?.[p2] || 0;
        const isDraw = p1Flips === p2Flips;

        const winner = isDraw ? null : p1Flips > p2Flips ? p1 : p2;
        const loser = isDraw ? null : players.find((uid) => uid !== winner);

        const p1Ref = ref(database, `users/${p1}`);
        const p2Ref = ref(database, `users/${p2}`);
        const [p1Snap, p2Snap] = await Promise.all([get(p1Ref), get(p2Ref)]);
        const p1Data = p1Snap.val() || {};
        const p2Data = p2Snap.val() || {};

        await update(ref(database, `matches/${matchId}`), {
          status: "completed",
          winner,
          isDraw,
        });

        await Promise.all([
          update(p1Ref, {
            games: (p1Data.games || 0) + 1,
            ...(isDraw
              ? {}
              : winner === p1
              ? { wins: (p1Data.wins || 0) + 1 }
              : { losses: (p1Data.losses || 0) + 1 }),
          }),
          update(p2Ref, {
            games: (p2Data.games || 0) + 1,
            ...(isDraw
              ? {}
              : winner === p2
              ? { wins: (p2Data.wins || 0) + 1 }
              : { losses: (p2Data.losses || 0) + 1 }),
          }),
        ]);

        return;
      }

      if (
        presenceReady &&
        data.status === "active" &&
        players.length === 2 &&
        players.some((uid) => !presence[uid]?.online)
      ) {
        const leaver = players.find((uid) => !presence[uid]?.online);
        const winner = players.find((uid) => uid !== leaver);

        const winnerRef = ref(database, `users/${winner}`);
        const loserRef = ref(database, `users/${leaver}`);
        const [winnerSnap, loserSnap] = await Promise.all([
          get(winnerRef),
          get(loserRef),
        ]);

        const winnerData = winnerSnap.val() || {};
        const loserData = loserSnap.val() || {};

        await update(ref(database, `matches/${matchId}`), {
          status: "completed",
          winner,
          isDraw: false,
        });

        await Promise.all([
          update(winnerRef, {
            wins: (winnerData.wins || 0) + 1,
            games: (winnerData.games || 0) + 1,
          }),
          update(loserRef, {
            losses: (loserData.losses || 0) + 1,
            games: (loserData.games || 0) + 1,
          }),
        ]);

        return;
      }
    });

    return () => {
      off(matchRef);
      unsub();
    };
  }, [matchId, navigate, presenceReady]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const matchRef = ref(database, `matches/${matchId}`);
      get(matchRef).then((snap) => {
        const data = snap.val();
        if (data?.status === "completed") {
          navigate(`/summary/${matchId}`);
        }
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [matchId, navigate]);

  const isMyTurn = matchData?.turn === userId;

  const handleCardClick = async (index) => {
    if (!matchData || !isMyTurn) return;
    if (flippedIndexes.includes(index) || matchedIndexes.includes(index)) return;

    flipSFX.play();
    const updatedFlipped = [...flippedIndexes, index];

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
    return (
      <div className="h-screen flex justify-center items-center text-white">
        {t("loadingGame", "Loading game...")}
      </div>
    );
  }

  const players = matchData.players || [];
  const presence = matchData.presence || {};

  if (
    matchData.status === "active" &&
    players.length === 2 &&
    Object.keys(presence).length < 2
  ) {
    return (
      <div className="h-screen flex justify-center items-center text-white">
        {t("waitingForBothPlayers", "Waiting for both players to connect...")}
      </div>
    );
  }

  const isMatched = (i) => matchedIndexes.includes(i);
  const isFlipped = (i) => flippedIndexes.includes(i);
  const opponentId = (players || []).find((id) => id !== userId);

  const handleLeaveGame = async () => {
    const presenceRef = ref(database, `matches/${matchId}/presence/${userId}`);
  
    // Explicitly remove presence to simulate disconnect
    await set(presenceRef, null);
  
    // Give Firebase time to propagate the removal
    setTimeout(() => {
      navigate(`/summary/${matchId}`);
    }, 1000);
  };  

  return (
    <>
      <MainNav />
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gray-900">
        <h2 className="text-2xl mb-2">
          {isMyTurn
            ? t("yourTurn", { username: myUsername })
            : t("waitingForOpponent", { username: opponentUsername })}
        </h2>

        <p className="text-lg mb-4">
          {t("score", {
            me: myUsername,
            meScore: flipCounts[userId] || 0,
            opponent: opponentUsername,
            opponentScore: flipCounts[opponentId] || 0,
          })}
        </p>

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
          onClick={handleLeaveGame}
          className="mt-6 px-4 py-2 bg-red-600 rounded hover:bg-red-700"
        >
          {t("leaveGame")}
        </button>
      </div>
    </>
  );
};

export default Game;
