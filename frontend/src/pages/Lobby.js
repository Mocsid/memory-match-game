import React, { useState } from "react";

const Lobby = ({ userId, sessionToken, onMatchFound }) => {
  const [message, setMessage] = useState("");
  const [matchId, setMatchId] = useState(null);
  const [waiting, setWaiting] = useState(false);

  const handleJoinQueue = async () => {
    if (!userId) {
      setMessage("Please log in first!");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/game/joinQueue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();

      if (data.success && !data.matchFound) {
        // No match yet, waiting
        setMessage(data.message);
        setWaiting(true);
      } else if (data.success && data.matchFound) {
        // We found a match!
        setMatchId(data.matchId);
        setMessage("Match found! Match ID: " + data.matchId);
        onMatchFound && onMatchFound(data.matchId, data.players);
      } else {
        setMessage(data.error || "An error occurred while joining queue.");
      }
    } catch (error) {
      console.error("Join Queue Error:", error);
      setMessage("Failed to join queue, server error.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Lobby</h2>
      <p>{message}</p>
      {!waiting && (
        <button onClick={handleJoinQueue} style={{ padding: "10px 20px", cursor: "pointer" }}>
          Join Queue
        </button>
      )}
      {matchId && <p>Match ID: {matchId}</p>}
    </div>
  );
};

export default Lobby;
