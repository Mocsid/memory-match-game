import React, { useEffect, useState } from "react";
import { database } from "../config/firebaseConfig";
import { ref, onValue } from "firebase/database";

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

const Profile = () => {
  const userId = localStorage.getItem("userId");
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const userRef = ref(database, `users/${userId}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setUserData(data);
    });

    return () => unsubscribe();
  }, [userId]);

  if (!userData) {
    return <div className="text-center mt-10 text-gray-600">Loading profile...</div>;
  }

  const { username, wins = 0, losses = 0 } = userData;
  const totalGames = wins + losses;

  const fruit = username.split("_")[1] || "";
  const icon = fruitIcons[fruit] || "🎮";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-white p-6">
      <div className="bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome</h1>
        <p className="text-xl mb-6">
          <span className="text-green-300 font-semibold">{username}</span> {icon}
        </p>

        <div className="grid grid-cols-3 gap-4 text-center mt-4">
          <div>
            <p className="text-sm text-gray-400">Wins</p>
            <p className="text-2xl font-semibold text-green-400">{wins}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Losses</p>
            <p className="text-2xl font-semibold text-red-400">{losses}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Games</p>
            <p className="text-2xl font-semibold text-blue-400">{totalGames}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
