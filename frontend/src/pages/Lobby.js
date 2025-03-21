// src/pages/Lobby.js
import React, { useEffect, useState } from "react";
import { database } from "../config/firebaseConfig";
import { ref, set, remove, onValue, get, onDisconnect } from "firebase/database";
import { useNavigate } from "react-router-dom";
import MainNav from "../components/MainNav";
import { joinQueue } from "../services/matchmakingService";

const t = (text) => text;

const Lobby = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [usernames, setUsernames] = useState({});

  useEffect(() => {
    if (!userId) return;

    const presenceRef = ref(database, `presence/${userId}`);
    set(presenceRef, {
      online: true,
      lastSeen: Date.now(),
    });

    onDisconnect(presenceRef).remove();

    const allPresenceRef = ref(database, "presence");
    const unsubscribe = onValue(allPresenceRef, async (snapshot) => {
      const presence = snapshot.val() || {};
      const otherIds = Object.keys(presence).filter((id) => id !== userId);
      setOnlinePlayers(otherIds);

      // Fetch usernames for all online players
      const updates = {};
      await Promise.all(
        otherIds.map(async (uid) => {
          const userRef = ref(database, `users/${uid}/username`);
          const snap = await get(userRef);
          if (snap.exists()) {
            updates[uid] = snap.val();
          } else {
            updates[uid] = "unknown_user";
          }
        })
      );

      setUsernames((prev) => ({ ...prev, ...updates }));
    });

    return () => remove(presenceRef);
  }, [userId]);

  const handleJoinGame = async () => {
    const result = await joinQueue(userId);
    navigate("/queue");
    if (result.matchId) {
      navigate(`/game/${result.matchId}`);
    } else {
      alert("Waiting for another player to join...");
    }
  };

  return (
    <>
      <MainNav />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-white">
        <div className="flex flex-col items-center justify-center p-8">
          <h2 className="text-2xl font-semibold mb-4">{t("Online Players")}</h2>

          {onlinePlayers.length === 0 ? (
            <p className="text-gray-400">{t("No other players online")}</p>
          ) : (
            <ul className="bg-gray-800 rounded-md p-4 shadow-md w-full max-w-md space-y-2">
              {onlinePlayers.map((id) => (
                <li key={id} className="text-sm text-green-300 truncate">
                  {usernames[id] || "loading..."}
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={handleJoinGame}
            className="mt-6 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
          >
            Join Game
          </button>
        </div>
      </div>
    </>
  );
};

export default Lobby;
