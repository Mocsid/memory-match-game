import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Lobby = ({ userId, sessionToken, onMatchFound }) => {
  const [message, setMessage] = useState("");
  const [matchId, setMatchId] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const navigate = useNavigate();

  const handleJoinQueue = async () => {
    if (!userId) {
      setMessage("Please log in first!");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/game/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();

      if (data.success && !data.matchFound) {
        // Successfully joined the queue and no match yet.
        setMessage(data.message);
        setWaiting(true);
      } else if (data.success && data.matchFound) {
        // Match found!
        setMatchId(data.matchId);
        setMessage("Match found! Match ID: " + data.matchId);
        onMatchFound && onMatchFound(data.matchId, data.players);
      } else if (data.error) {
        // If the error indicates the user is already in the queue, switch to waiting state.
        if (data.error === "You are already in the queue, please wait for an opponent.") {
          setMessage(data.error);
          setWaiting(true);
        } else {
          setMessage(data.error || "An error occurred while joining queue.");
        }
      }
    } catch (error) {
      console.error("Join Queue Error:", error);
      setMessage("Failed to join queue, server error.");
    }
  };

  // Function to cancel waiting for a match by notifying the backend.
  const handleCancelQueue = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/game/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (data.success) {
        setWaiting(false);
        setMessage(data.message);
      } else {
        setMessage(data.error || "Failed to cancel queue.");
      }
    } catch (error) {
      console.error("Cancel Queue Error:", error);
      setMessage("Failed to cancel queue, server error.");
    }
  };

  // Function to navigate back to the dashboard.
  const handleGoBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Lobby</h2>
      <p>{message}</p>
      {waiting ? (
        <button onClick={handleCancelQueue} style={{ padding: "10px 20px", cursor: "pointer" }}>
          Cancel Queue
        </button>
      ) : (
        <button onClick={handleJoinQueue} style={{ padding: "10px 20px", cursor: "pointer" }}>
          Join Queue
        </button>
      )}
      <button
        onClick={handleGoBackToDashboard}
        style={{ padding: "10px 20px", cursor: "pointer", marginLeft: "10px" }}
      >
        Back to Dashboard
      </button>
      {matchId && <p>Match ID: {matchId}</p>}
    </div>
  );
};

export default Lobby;
