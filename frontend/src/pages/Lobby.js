import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue, remove } from "firebase/database";
import { database } from "../config/firebaseConfig";

const Lobby = ({ userId, sessionToken, onMatchFound }) => {
  const [message, setMessage] = useState("");
  const [matchId, setMatchId] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      console.log("⛔ Not listening - missing userId");
      return;
    }
    
    console.log("👂 Setting up listener for userMatches/" + userId);
    const matchRef = ref(database, `userMatches/${userId}`);
    
    const unsubscribe = onValue(matchRef, (snapshot) => {
      console.log("🔥 onValue triggered");
      const data = snapshot.val();
      console.log("🎮 Match data from RTDB:", data);
      // Only navigate if data exists, has a matchId, and status is "ready"
      if (data && data.matchId && data.status === "ready") {
        setMatchId(data.matchId);
        setMessage("Match found! Redirecting to game...");
        onMatchFound && onMatchFound(data.matchId);
        navigate(`/game/${data.matchId}`);
      }
    });
    
    return () => unsubscribe();
  }, [userId]);   

  useEffect(() => {
    const checkUserMatch = async () => {
      const userMatchRef = ref(database, `userMatches/${userId}`);
      onValue(userMatchRef, (snapshot) => {
        const data = snapshot.val();
        if (data?.matchId) {
          // Avoid redirecting to old match if already completed
          const matchRef = ref(database, `matches/${data.matchId}`);
          onValue(matchRef, (matchSnap) => {
            const matchData = matchSnap.val();
            if (matchData?.status === "completed") {
              // Clean up lingering userMatches entry
              remove(userMatchRef);
            }
          });
        }
      });
    };
  
    checkUserMatch();
  }, [userId]);  

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
        setMessage(data.message);
        setWaiting(true);
      } else if (data.success && data.matchFound) {
        setMatchId(data.matchId);
        setMessage("Match found! Match ID: " + data.matchId);
        setWaiting(true); // ensure listener is active
        onMatchFound && onMatchFound(data.matchId, data.players);
        navigate(`/game/${data.matchId}`);
      } else {
        if (data.error === "You are already in the queue, please wait for an opponent.") {
          setWaiting(true);
        }
        setMessage(data.error || "An error occurred.");
      }
    } catch (error) {
      console.error("Join Queue Error:", error);
      setMessage("Server error while joining queue.");
    }
  };  

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

        // 🧹 Optional: clear any lingering match data in RTDB
        const matchRef = ref(database, `userMatches/${userId}`);
        await remove(matchRef);
      } else {
        setMessage(data.error || "Failed to cancel queue.");
      }
    } catch (error) {
      console.error("Cancel Queue Error:", error);
      setMessage("Failed to cancel queue, server error.");
    }
  };

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
      <button
        onClick={handleJoinQueue}
        style={{ padding: "10px 20px", cursor: "pointer" }}
        disabled={waiting}
      >
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
