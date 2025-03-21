import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { database } from "../config/firebaseConfig";
import { ref, onValue, update } from "firebase/database";

const Game = () => {
  const { matchId } = useParams();
  const userId = localStorage.getItem("userId");

  const [gameData, setGameData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [usernameMap, setUsernameMap] = useState({});
  
  // ✅ Keep track of which player IDs we've already fetched
  const fetchedPlayersRef = useRef(new Set());
  const previousTurnRef = useRef(null);

  // 1) Listen for match changes
  useEffect(() => {
    if (!matchId) return;

    const matchRef = ref(database, `matches/${matchId}`);
    const unsubscribe = onValue(matchRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Safeguards
        if (!data.flipped) data.flipped = [];
        if (!data.matched) data.matched = [];

        setGameData(data);
        handleGameLog(data);
      }
    });

    return () => unsubscribe();
  }, [matchId]);

  // 2) Fetch usernames only once per userId
  useEffect(() => {
    if (!gameData?.players) return;

    const newPlayers = gameData.players.filter(
      (uid) => !fetchedPlayersRef.current.has(uid)
    );

    if (newPlayers.length === 0) {
      return; // No new players to fetch
    }

    // Mark them as fetched right away to avoid repeated requests
    newPlayers.forEach((uid) => fetchedPlayersRef.current.add(uid));

    const fetchUsernames = async () => {
      const results = await Promise.all(
        newPlayers.map((uid) =>
          fetch(`http://localhost:3001/api/auth/profile/${uid}`)
            .then((res) => res.json())
            .then((data) => ({ uid, username: data?.user?.username || uid }))
            .catch(() => ({ uid, username: uid }))
        )
      );

      // Build local map of uid => username
      const map = {};
      results.forEach((r) => {
        map[r.uid] = r.username;
      });

      // Merge with existing usernameMap
      setUsernameMap((prev) => ({ ...prev, ...map }));
    };

    fetchUsernames();
  }, [gameData?.players]);

  // 3) Handle flipping a card
  const handleCardClick = async (index) => {
    if (!gameData || gameData.turn !== userId) return;
    if (gameData.flipped.includes(index) || gameData.matched.includes(index)) return;

    const flipped = [...gameData.flipped, index];

    await update(ref(database, `matches/${matchId}`), {
      flipped,
      lastAction: {
        type: "flip",
        by: userId,
        card: index,
        timestamp: Date.now(),
      },
    });

    if (flipped.length === 2) {
      const [i1, i2] = flipped;
      const matchSuccess = gameData.board[i1] === gameData.board[i2];

      const updates = {
        flipped: [],
        lastAction: {
          type: "match",
          by: userId,
          matchSuccess,
          timestamp: Date.now(),
        },
      };

      if (matchSuccess) {
        updates.matched = [...gameData.matched, i1, i2];
      } else {
        const otherPlayer = gameData.players.find((p) => p !== userId);
        updates.turn = otherPlayer;
      }

      // small delay
      setTimeout(() => {
        update(ref(database, `matches/${matchId}`), updates);
      }, 1000);
    }
  };

  // 4) Logs only changes in lastAction or turn
  const handleGameLog = (data) => {
    const { lastAction } = data;
    const logMessages = [];
    const getName = (uid) => usernameMap[uid] || uid;

    // Show last action if any
    if (lastAction) {
      const { type, by, card, matchSuccess } = lastAction;
      const playerName = getName(by);

      if (type === "flip") {
        logMessages.push(`🃏 ${playerName} flipped card ${card}`);
      } else if (type === "match") {
        if (matchSuccess) {
          logMessages.push(`✅ ${playerName} made a match and continues!`);
        } else {
          logMessages.push(`❌ ${playerName} failed to match. Turn passed.`);
        }
      }
    }

    // Only log turn changes
    if (data.turn && data.turn !== previousTurnRef.current) {
      previousTurnRef.current = data.turn;
      logMessages.push(`🎮 It's ${getName(data.turn)}'s turn`);
    }

    // limit logs to last 20
    setLogs((prev) => [...prev.slice(-20), ...logMessages]);
  };

  // 5) Render board
  const renderBoard = () => {
    if (!gameData || !Array.isArray(gameData.board)) {
      return <p>Loading board...</p>;
    }

    return (
      <div className="game-board" style={{ display: "grid", gridTemplateColumns: "repeat(4, 60px)", gap: "10px", justifyContent: "center" }}>
        {gameData.board.map((card, index) => {
          const isFlipped = gameData.flipped.includes(index);
          const isMatched = gameData.matched.includes(index);
          return (
            <div
              key={index}
              className={`card ${isFlipped || isMatched ? "flipped" : ""}`}
              onClick={() => handleCardClick(index)}
              style={{
                width: "60px",
                height: "60px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isFlipped || isMatched ? "default" : "pointer",
                backgroundColor: isMatched ? "green" : isFlipped ? "lightblue" : "gray",
                fontSize: "20px",
              }}
            >
              {isFlipped || isMatched ? card : "?"}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>🧠 Memory Match</h2>
      <p>Match ID: {matchId}</p>

      {gameData?.turn && (
        <h3>
          🎮 Current Turn:{" "}
          {usernameMap[gameData.turn] || gameData.turn}
        </h3>
      )}

      {renderBoard()}

      <div style={{ marginTop: "30px", textAlign: "left", maxWidth: "600px", margin: "0 auto" }}>
        <h4>Logs:</h4>
        <ul>
          {logs.map((log, i) => (
            <li key={i}>{log}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Game;
