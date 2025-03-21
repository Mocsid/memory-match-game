// src/pages/Scoreboard.js
import React, { useEffect, useState } from "react";
import { database } from "../config/firebaseConfig";
import { ref, get } from "firebase/database";
import MainNav from "../components/MainNav";

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
  const [players, setPlayers] = useState([]);
  const [sortField, setSortField] = useState("wins");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const usersRef = ref(database, "users");

    get(usersRef).then((snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const playerList = Object.entries(usersData).map(([uid, user]) => ({
          uid,
          username: user.username || "unknown",
          wins: user.wins || 0,
          losses: user.losses || 0,
        }));
        setPlayers(playerList);
      }
    });
  }, []);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedPlayers = [...players]
    .map((p) => ({ ...p, total: p.wins + p.losses }))
    .sort((a, b) => {
      if (sortField === "username") {
        const valA = a.username.toLowerCase();
        const valB = b.username.toLowerCase();
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortOrder === "asc"
          ? a[sortField] - b[sortField]
          : b[sortField] - a[sortField];
      }
    })
    .slice(0, 10);

  return (
    <>
      <MainNav />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-white px-4 py-10 flex flex-col items-center">
        <div className="w-full max-w-3xl bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-3xl font-bold mb-6 text-center">Top Players</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-gray-300 border-b border-gray-700">
                  <th className="px-3 py-2">#</th>
                  <th
                    className="px-3 py-2 cursor-pointer hover:text-yellow-400"
                    onClick={() => handleSort("username")}
                  >
                    Username {sortField === "username" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="px-3 py-2 cursor-pointer hover:text-yellow-400"
                    onClick={() => handleSort("wins")}
                  >
                    Wins {sortField === "wins" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="px-3 py-2 cursor-pointer hover:text-yellow-400"
                    onClick={() => handleSort("losses")}
                  >
                    Losses {sortField === "losses" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="px-3 py-2 cursor-pointer hover:text-yellow-400"
                    onClick={() => handleSort("total")}
                  >
                    Games {sortField === "total" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player, index) => {
                  const fruit = player.username.split("_")[1] || "";
                  const icon = fruitIcons[fruit] || "🎮";
                  return (
                    <tr
                      key={player.uid}
                      className="border-b border-gray-700 hover:bg-gray-700"
                    >
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2 text-green-300 font-semibold">
                        {player.username} {icon}
                      </td>
                      <td className="px-3 py-2 text-green-400">{player.wins}</td>
                      <td className="px-3 py-2 text-red-400">{player.losses}</td>
                      <td className="px-3 py-2 text-blue-400">{player.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Scoreboard;
