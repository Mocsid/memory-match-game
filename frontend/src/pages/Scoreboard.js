import React, { useEffect, useState } from "react";
import { database } from "../config/firebaseConfig";
import { ref, get } from "firebase/database";

const fruitIcons = {
  apple: "🍎",
  banana: "🍌",
  cherry: "🍒",
  grape: "🍇",
  kiwi: "🥝",
  lemon: "🍋",
  mango: "🥭",
  orange: "🍊",
  peach: "🍑",
  pear: "🍐",
  pineapple: "🍍",
  strawberry: "🍓",
  watermelon: "🍉",
};

const Scoreboard = () => {
  const [topPlayers, setTopPlayers] = useState([]);

  useEffect(() => {
    const usersRef = ref(database, "users");

    get(usersRef).then((snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const sortedPlayers = Object.entries(usersData)
          .map(([uid, user]) => ({
            uid,
            username: user.username || "unknown",
            wins: user.wins || 0,
            losses: user.losses || 0,
          }))
          .sort((a, b) => b.wins - a.wins)
          .slice(0, 10);

        setTopPlayers(sortedPlayers);
      }
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-white p-6">
      <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">🏆 Top 10 Players</h1>
        <ul className="divide-y divide-gray-600">
          {topPlayers.map((player, index) => {
            const total = player.wins + player.losses;
            const fruit = player.username.split("_")[1] || "";
            const icon = fruitIcons[fruit] || "🎮";

            return (
              <li key={player.uid} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{index + 1}.</span>
                  <span className="text-lg font-semibold text-green-300">
                    {player.username} {icon}
                  </span>
                </div>
                <div className="flex gap-6 text-right text-sm">
                  <div>
                    <p className="text-gray-400">Wins</p>
                    <p className="text-green-400 font-semibold">{player.wins}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Losses</p>
                    <p className="text-red-400 font-semibold">{player.losses}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total</p>
                    <p className="text-blue-400 font-semibold">{total}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Scoreboard;
