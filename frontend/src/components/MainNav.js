// src/components/MainNav.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const MainNav = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const switchToTagalog = () => i18n.changeLanguage("tl");
  const switchToEnglish = () => i18n.changeLanguage("en");

  return (
    <nav className="bg-gray-800 px-6 py-4 flex justify-between items-center shadow-md text-white">
      <h1 className="text-2xl font-bold">🔥 MemMatchGame</h1>
      <div className="space-x-4 flex items-center">
        <button
          onClick={() => navigate("/")}
          className="hover:underline text-sm"
        >
          {t("profile")}
        </button>
        <button
          onClick={() => navigate("/scoreboard")}
          className="hover:underline text-sm"
        >
          {t("scoreboard")}
        </button>
        <button
          onClick={() => navigate("/lobby")}
          className="hover:underline text-sm"
        >
          {t("joinGame")}
        </button>
        <div className="ml-4 space-x-1">
          <button
            onClick={switchToEnglish}
            className="bg-blue-600 text-xs px-2 py-1 rounded hover:bg-blue-700"
          >
            🇺🇸 EN
          </button>
          <button
            onClick={switchToTagalog}
            className="bg-green-600 text-xs px-2 py-1 rounded hover:bg-green-700"
          >
            🇵🇭 TL
          </button>
        </div>
      </div>
    </nav>
  );
};

export default MainNav;
