import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../config/firebaseConfig";
import MainNav from "../components/MainNav";

const GameSummary = () => {
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
        Loading summary...
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Match not found or already removed.
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

  let resultMessage = "💀 You Lost";

  if (userLeft) {
    resultMessage = "💀 You left the game. You lost.";
  } else if (isDraw) {
    resultMessage = "🤝 It's a Draw!";
  } else if (isWinner) {
    resultMessage = "🎉 You Won!";
  }

  const opponentMessage = userLeft
    ? `${opponentData.username || "Opponent"} wins because you left.`
    : `${opponentData.username || "Opponent"} flipped ${opponentFlipCount} cards.`;

  return (
    <>
      <MainNav />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-white px-4 py-10 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4">Game Summary</h1>

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
            You flipped{" "}
            <span className="font-bold text-yellow-300">{userFlipCount}</span>{" "}
            cards.
          </p>

          <p className="mb-4">{opponentMessage}</p>

          <button
            onClick={() => navigate("/lobby")}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    </>
  );
};

export default GameSummary;
