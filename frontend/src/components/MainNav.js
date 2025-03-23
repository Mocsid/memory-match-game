import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const MainNav = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const switchToTagalog = () => i18n.changeLanguage("tl");
  const switchToEnglish = () => i18n.changeLanguage("en");

  return (
    <nav className="bg-gray-800 px-6 py-4 shadow-md text-white">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate("/")}
          className="text-2xl font-bold hover:underline focus:outline-none"
        >
          🔥 MemMatchGame
        </button>
        <button
          className="md:hidden focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {/* Hamburger icon */}
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
        <div className="hidden md:flex space-x-4 items-center">
          <button onClick={() => navigate("/")} className="hover:underline text-sm">
            {t("profile")}
          </button>
          <button onClick={() => navigate("/scoreboard")} className="hover:underline text-sm">
            {t("scoreboard")}
          </button>
          <button onClick={() => navigate("/lobby")} className="hover:underline text-sm">
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
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden mt-4 space-y-2">
          <button onClick={() => navigate("/")} className="block w-full text-left text-sm hover:underline">
            {t("profile")}
          </button>
          <button onClick={() => navigate("/scoreboard")} className="block w-full text-left text-sm hover:underline">
            {t("scoreboard")}
          </button>
          <button onClick={() => navigate("/lobby")} className="block w-full text-left text-sm hover:underline">
            {t("joinGame")}
          </button>
          <div className="space-x-2 pt-2">
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
      )}
    </nav>
  );
};

export default MainNav;
