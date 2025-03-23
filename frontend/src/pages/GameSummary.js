import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../config/firebaseConfig";
import MainNav from "../components/MainNav";
import { useTranslation } from "react-i18next";

const GameSummary = () => {
  const { t } = useTranslation();
  const { matchId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [matchData, setMatchData] = useState(null);
  const [userData, setUserData] = useState({});
  const [opponentData, setOpponentData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const matchRef = ref(database, `matches/${matchId}`);
    get(matchRef).then(async (snapshot) => {
      if (!snapshot.exists()) {
        setLoading(false);
        return;
      }

      const data = snapshot.val();
      const players = data.players || [];

      const opponentId = players.find((id) => id !== userId);

      const [userSnap, opponentSnap] = await Promise.all([
        get(ref(database, `users/${userId}`)),
        get(ref(database, `users/${opponentId}`)),
      ]);

      setMatchData(data);
      setUserData(userSnap.val() || {});
      setOpponentData(opponentSnap.val() || {});
      setLoading(false);
    });
  }, [matchId, userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        {t("loadingSummary", "Loading summary...")}
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        {t("matchNotFound", "Match not found or already removed.")}
      </div>
    );
  }

  const winnerId = matchData.winner;
  const isDraw = matchData.isDraw === true;
  const players = matchData.players || [];
  const flipCounts = matchData.flipCounts || {};

  const userFlipCount = flipCounts[userId] || 0;
  const opponentId = players.find((id) => id !== userId) || "";
  const opponentFlipCount = flipCounts[opponentId] || 0;

  const isWinner = winnerId === userId;

  const userLeft =
    matchData.status === "completed" &&
    !isWinner &&
    userFlipCount === 0 &&
    players.length === 2;

  let resultMessage = t("youLost", "💀 You Lost");

  if (userLeft) {
    resultMessage = t("youLeftLost", "💀 You left the game. You lost.");
  } else if (isDraw) {
    resultMessage = t("draw", "🤝 It's a Draw!");
  } else if (isWinner) {
    resultMessage = t("youWon", "🎉 You Won!");
  }

  const opponentMessage = userLeft
    ? t("opponentWinsBecauseLeft", {
        opponent: opponentData.username || t("opponent", "Opponent"),
      })
    : t("opponentFlipped", {
        opponent: opponentData.username || t("opponent", "Opponent"),
        count: opponentFlipCount,
      });

  return (
    <>
      <MainNav />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-white px-4 py-10 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4">
          {t("gameSummary", "Game Summary")}
        </h1>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg max-w-md w-full text-center">
          <h2
            className={`text-2xl mb-2 ${
              isDraw
                ? "text-yellow-400"
                : isWinner
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {resultMessage}
          </h2>

          <p className="mb-2">
            {t("youFlippedCards", {
              count: userFlipCount,
            })}
          </p>

          <p className="mb-4">{opponentMessage}</p>

          <button
            onClick={() => navigate("/lobby")}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            {t("returnToLobby", "Return to Lobby")}
          </button>
        </div>
      </div>
    </>
  );
};

export default GameSummary;
