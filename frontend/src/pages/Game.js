import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { database } from "../config/firebaseConfig";
import { ref, onValue, update, onDisconnect, remove } from "firebase/database";

const Game = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [gameData, setGameData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [usernameMap, setUsernameMap] = useState({});
  const fetchedPlayersRef = useRef(new Set());
  const previousTurnRef = useRef(null);

  // ✅ PRESENCE: track when player leaves
  useEffect(() => {
    if (!matchId || !userId) return;
    const presenceRef = ref(database, `matches/${matchId}/presence/${userId}`);
    const onlineRef = ref(database, `.info/connected`);

    const off = onValue(onlineRef, (snap) => {
      if (snap.val() === true) {
        onDisconnect(presenceRef).remove(); // remove when disconnected
        update(presenceRef, {
          online: true,
          lastSeen: Date.now(),
        });
      }
    });

    return () => {
      // Clean up
      remove(presenceRef);
    };
  }, [matchId, userId]);

  // 🔁 Match Listener
  useEffect(() => {
    if (!matchId) return;

    const matchRef = ref(database, `matches/${matchId}`);
    const unsubscribe = onValue(matchRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        console.log("⚠️ Match deleted.");
        navigate("/dashboard");
        return;
      }

      // Safeguard
      data.flipped = data.flipped || [];
      data.matched = data.matched || [];

      setGameData(data);
      handleGameLog(data);
    });

    return () => unsubscribe();
  }, [matchId]);

  // 👤 Username Fetching
  useEffect(() => {
    if (!gameData?.players) return;

    const newPlayers = gameData.players.filter(
      (uid) => !fetchedPlayersRef.current.has(uid)
    );

    if (newPlayers.length === 0) return;

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

      const map = {};
      results.forEach((r) => {
        map[r.uid] = r.username;
      });

      setUsernameMap((prev) => ({ ...prev, ...map }));
    };

    fetchUsernames();
  }, [gameData?.players]);

  // 🔄 Handle Card Flip
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

      setTimeout(() => {
        update(ref(database, `matches/${matchId}`), updates);
      }, 1000);
    }
  };

  useEffect(() => {
    if (gameData?.status === "completed") {
      alert("Game ended. Returning to lobby.");
      window.location.href = "/lobby";
    }
  }, [gameData?.status]);  

  const handleGameLog = (data) => {
    const logMessages = [];
    const { lastAction } = data;
    const getName = (uid) => usernameMap?.[uid] ?? uid;

    if (lastAction) {
      const { type, by, card, matchSuccess } = lastAction;
      const name = getName(by);

      if (type === "flip") logMessages.push(`🃏 ${name} flipped card ${card}`);
      if (type === "match") {
        logMessages.push(
          matchSuccess
            ? `✅ ${name} made a match and continues!`
            : `❌ ${name} failed to match. Turn passed.`
        );
      }
    }

    if (data.turn && data.turn !== previousTurnRef.current) {
      previousTurnRef.current = data.turn;
      logMessages.push(`🎮 It's ${getName(data.turn)}'s turn`);
    }

    setLogs((prev) => [...prev.slice(-20), ...logMessages]);
  };

  const renderBoard = () => {
    if (!gameData || !Array.isArray(gameData.board)) return <p>Loading board...</p>;

    return (
      <div
        className="game-board"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 60px)",
          gap: "10px",
          justifyContent: "center",
        }}
      >
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
                backgroundColor: isMatched
                  ? "green"
                  : isFlipped
                  ? "lightblue"
                  : "gray",
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

  const handleLeave = async () => {
    if (!matchId || !userId) return;
    try {
      await fetch(`http://localhost:3001/api/match/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, userId }),
      });
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Leave match error:", err);
    }
  };

  const handleLeaveGame = async () => {
    const confirmed = window.confirm("Are you sure you want to leave the game?");
    if (!confirmed) return;
  
    try {
      const response = await fetch("http://localhost:3001/api/match/leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, matchId }),
      });
  
      const data = await response.json();
      if (data.success) {
        alert("You have left the game.");
        window.location.href = "/dashboard"; // or use navigate()
      } else {
        alert("Failed to leave game: " + data.error);
      }
    } catch (err) {
      console.error("Leave error:", err);
      alert("An error occurred while leaving the game.");
    }
  };
  

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>🧠 Memory Match</h2>
      <p>Match ID: {matchId}</p>

      {gameData?.turn && (
        <h3>🎮 Current Turn: {usernameMap[gameData.turn] || gameData.turn}</h3>
      )}

      {renderBoard()}

      <div
        style={{
          marginTop: "30px",
          textAlign: "left",
          maxWidth: "600px",
          marginInline: "auto",
        }}
      >
        <h4>Logs:</h4>
        <ul>
          {logs.map((log, i) => (
            <li key={i}>{log}</li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleLeaveGame}
        style={{ marginTop: "20px", padding: "10px 20px", background: "crimson", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
      >
        Leave Game
      </button>
      
    </div>
  );
};

export default Game;
