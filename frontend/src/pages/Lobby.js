import React, { useEffect, useState } from "react";
import { database } from "../config/firebaseConfig";
import { ref, set, remove, onValue, onDisconnect } from "firebase/database";
import { useNavigate } from "react-router-dom";
import MainNav from "../components/MainNav";

const t = (text) => text; // placeholder for i18n

const Lobby = () => {
  const userId = localStorage.getItem("userId");
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    const userPresenceRef = ref(database, `presence/${userId}`);
    const disconnectRef = onDisconnect(userPresenceRef);
    set(userPresenceRef, {
      online: true,
      lastSeen: Date.now(),
    });
    disconnectRef.remove();

    const allPresenceRef = ref(database, "presence");
    const unsubscribe = onValue(allPresenceRef, (snapshot) => {
      const presence = snapshot.val() || {};
      const others = Object.keys(presence).filter((id) => id !== userId);
      setOnlinePlayers(others);
    });

    return () => remove(userPresenceRef);
  }, [userId]);

  const handleJoinQueue = async () => {
    const queueRef = ref(database, `queue/${userId}`);
    await set(queueRef, { joinedAt: Date.now() });
    navigate("/game");
  };

  return (
    <>
    <MainNav />
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-white">
      {/* Lobby Content */}
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-semibold mb-4">{t("Online Players")}</h2>

        {onlinePlayers.length === 0 ? (
          <p className="text-gray-400">{t("No other players online")}</p>
        ) : (
          <ul className="bg-gray-800 rounded-md p-4 shadow-md w-full max-w-md space-y-2">
            {onlinePlayers.map((id) => (
              <li key={id} className="text-sm text-green-300 truncate">{id}</li>
            ))}
          </ul>
        )}

        <button
          onClick={handleJoinQueue}
          className="mt-6 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold text-white"
        >
          {t("Join Queue")}
        </button>
      </div>
    </div>
    </>
  );
};

export default Lobby;
