import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { database } from "../config/firebaseConfig";
import { ref, onValue, update, onDisconnect, remove } from "firebase/database";

const Game = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const sessionToken = localStorage.getItem("sessionToken");

  const [gameData, setGameData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [usernameMap, setUsernameMap] = useState({});
  const fetchedPlayersRef = useRef(new Set());
  const previousTurnRef = useRef(null);

  // Fallback to a short-UID if usernameMap missing
  const getName = (uid) => {
    // If we have a real username, return it
    if (usernameMap[uid] && usernameMap[uid] !== uid) {
      return usernameMap[uid];
    }
    // Otherwise fallback to first 6 chars of UID
    if (uid && uid.length > 6) {
      return uid.slice(0, 6);
    }
    return uid || "???";
  };

  // ✅ Presence (player leaves)
  useEffect(() => {
    if (!matchId || !userId) return;

    const presenceRef = ref(database, `matches/${matchId}/presence/${userId}`);
    const connectedRef = ref(database, ".info/connected");

    const off = onValue(connectedRef, (snap) => {
      if (snap.val()) {
        onDisconnect(presenceRef).remove();
        update(presenceRef, {
          online: true,
          lastSeen: Date.now(),
        });
      }
    });

    return () => {
      remove(presenceRef);
      off();
    };
  }, [matchId, userId]);

  // 🔁 Listen to match data
  useEffect(() => {
    if (!matchId) return;

    const matchRef = ref(database, `matches/${matchId}`);
    const unsub = onValue(matchRef, (snap) => {
      const data = snap.val();
      if (!data) {
        console.log("⚠️ Match deleted");
        navigate("/dashboard");
        return;
      }
      data.flipped = data.flipped || [];
      data.matched = data.matched || [];

      setGameData(data);
      handleGameLog(data);
    });

    return () => unsub();
  }, [matchId]);

  // 👤 Username fetch for new players
  useEffect(() => {
    if (!gameData?.players) return;

    const newPlayers = gameData.players.filter(
      (uid) => !fetchedPlayersRef.current.has(uid)
    );
    if (!newPlayers || newPlayers.length === 0) return;

    // Mark them as fetched
    newPlayers.forEach((uid) => fetchedPlayersRef.current.add(uid));

    const fetchUsernames = async () => {
      const results = await Promise.all(
        newPlayers.map((uid) =>
          fetch(`http://localhost:3001/api/auth/profile/${uid}`, {
            headers: {
              Authorization: `Bearer ${sessionToken}`,
            },
          })
            .then((res) => res.json())
            .then((data) => ({
              uid,
              username: data?.user?.username || uid,
            }))
            .catch(() => ({ uid, username: uid }))
        )
      );

      const newMap = {};
      results.forEach((r) => {
        newMap[r.uid] = r.username;
      });

      setUsernameMap((prev) => ({ ...prev, ...newMap }));
    };

    fetchUsernames();
  }, [gameData?.players, sessionToken]);

  // 🔄 Card flip
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

    // if two cards flipped, evaluate
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

      setTimeout(() => {
        update(ref(database, `matches/${matchId}`), updates);
      }, 1000);
    }
  };

  // If game is done
  useEffect(() => {
    if (gameData?.status === "completed") {
      alert("Game ended. Returning to lobby.");
      window.location.href = "/lobby";
    }
  }, [gameData?.status]);

  // Additional fetch if new players show up
  useEffect(() => {
    if (!gameData?.players) return;
    const missing = gameData.players.filter((p) => !usernameMap[p]);
    if (missing.length > 0) {
      // fetch them again if needed...
    }
  }, [gameData?.players, usernameMap]);

  // 📝 Logging
  const handleGameLog = (data) => {
    const logMessages = [];
    const { lastAction } = data;

    if (lastAction) {
      const { type, by, card, matchSuccess } = lastAction;
      const name = getName(by);
      if (type === "flip") {
        logMessages.push(`🃏 ${name} flipped card ${card}`);
      } else if (type === "match") {
        if (matchSuccess) {
          logMessages.push(`✅ ${name} made a match and continues!`);
        } else {
          logMessages.push(`❌ ${name} failed to match. Turn passed.`);
        }
      }
    }

    if (data.turn && data.turn !== previousTurnRef.current) {
      previousTurnRef.current = data.turn;
      const turnName = getName(data.turn);
      logMessages.push(`🎮 It's ${turnName}'s turn`);
    }

    if (logMessages.length > 0) {
      setLogs((prev) => [...prev.slice(-20), ...logMessages]);
    }
  };

  // Render cards
  const renderBoard = () => {
    if (!gameData?.board) return <p>Loading board...</p>;

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 60px)", gap: "10px", justifyContent: "center" }}>
        {gameData.board.map((val, idx) => {
          const isFlipped = gameData.flipped.includes(idx);
          const isMatched = gameData.matched.includes(idx);
          return (
            <div
              key={idx}
              onClick={() => handleCardClick(idx)}
              style={{
                width: "60px",
                height: "60px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isFlipped || isMatched ? "default" : "pointer",
                backgroundColor: isMatched
                  ? "green"
                  : isFlipped
                  ? "lightblue"
                  : "gray",
                fontSize: "20px",
              }}
            >
              {isFlipped || isMatched ? val : "?"}
            </div>
          );
        })}
      </div>
    );
  };

  const handleLeaveGame = async () => {
    const confirmed = window.confirm("Are you sure you want to leave?");
    if (!confirmed) return;
    try {
      const res = await fetch("http://localhost:3001/api/match/leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, matchId }),
      });
      const data = await res.json();
      if (data.success) {
        alert("You have left the game.");
        window.location.href = "/dashboard";
      } else {
        alert("Failed to leave game: " + data.error);
      }
    } catch (err) {
      console.error("Leave error:", err);
      alert("Error leaving match.");
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>🧠 Memory Match</h2>
      <p>Match ID: {matchId}</p>

      {gameData?.turn && (
        <h3>🎮 Current Turn: {getName(gameData.turn)}</h3>
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

      <button
        onClick={handleLeaveGame}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "crimson",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Leave Game
      </button>
    </div>
  );
};

export default Game;
