// FILE: frontend/src/pages/QueueWaiting.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "../config/firebaseConfig";
import { ref, onValue, onDisconnect, off } from "firebase/database";

const QueueWaiting = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return;

    console.log("QueueWatching: Listening for user", userId);

    const userQueueRef = ref(database, `queue/${userId}`);

    onDisconnect(userQueueRef).remove();
    console.log("QueueWatching: Connected. Will auto-remove on disconnect.");

    const unsubscribe = onValue(userQueueRef, (snapshot) => {
      const val = snapshot.val();
      console.log("QueueWatching match value:", val);
      if (val && val.matchId) {
        console.log("✅ Match found! Redirecting to game", val.matchId);
        // ❌ Do NOT remove here — backend removes it later
        navigate(`/game/${val.matchId}`);
      }
    });

    return () => {
      console.log("QueueWatching: Component unmounted. Detaching listener.");
      off(userQueueRef); // Only remove listener, not the data
    };
  }, [userId, navigate]);

  const handleCancel = () => {
    const userQueueRef = ref(database, `queue/${userId}`);
    console.log("❌ User cancelled queue. Removing manually.");
    off(userQueueRef); // Remove listener first
    import("firebase/database").then(({ remove }) =>
      remove(userQueueRef).then(() => navigate("/lobby"))
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h2 className="text-xl mb-4">Waiting for another player...</h2>
      <button
        onClick={handleCancel}
        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
      >
        Cancel
      </button>
    </div>
  );
};

export default QueueWaiting;
