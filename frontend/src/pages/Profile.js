import React, { useEffect, useState } from "react";
import { database } from "../config/firebaseConfig";
import { ref, onValue } from "firebase/database";
import MainNav from "../components/MainNav";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const storedId = localStorage.getItem("userId");
    if (storedId) setUserId(storedId);
  }, []);

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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-400 bg-gray-900">
        <p className="mb-4">{t("profileCreatedRefresh")}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {t("refreshPage")}
        </button>
      </div>
    );
  }

  const { username, wins = 0, losses = 0 } = userData;
  const totalGames = wins + losses;

  const fruit = username?.split("_")[1] || "";
  const icon = fruitIcons[fruit] || "🎮";

  return (
    <>
      <MainNav />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-white p-6">
        <div className="bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4">{t("welcome")}</h1>
          <p className="text-xl mb-6">
            <span className="text-green-300 font-semibold">{username}</span> {icon}
          </p>

          <div className="grid grid-cols-3 gap-4 text-center mt-4">
            <div>
              <p className="text-sm text-gray-400">{t("wins")}</p>
              <p className="text-2xl font-semibold text-green-400">{wins}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">{t("losses")}</p>
              <p className="text-2xl font-semibold text-red-400">{losses}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">{t("totalGames")}</p>
              <p className="text-2xl font-semibold text-blue-400">{totalGames}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
