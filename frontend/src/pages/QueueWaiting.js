import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "../config/firebaseConfig";
import { ref, onValue, onDisconnect, off } from "firebase/database";
import { useTranslation } from "react-i18next";

const QueueWaiting = () => {
  const { t } = useTranslation();
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
        navigate(`/game/${val.matchId}`);
      }
    });

    return () => {
      console.log("QueueWatching: Component unmounted. Detaching listener.");
      off(userQueueRef);
    };
  }, [userId, navigate]);

  const handleCancel = () => {
    const userQueueRef = ref(database, `queue/${userId}`);
    console.log("❌ User cancelled queue. Removing manually.");
    off(userQueueRef);
    import("firebase/database").then(({ remove }) =>
      remove(userQueueRef).then(() => navigate("/lobby"))
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h2 className="text-xl mb-4">{t("waitingForPlayer")}</h2>
      <button
        onClick={handleCancel}
        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
      >
        {t("cancel")}
      </button>
    </div>
  );
};

export default QueueWaiting;
