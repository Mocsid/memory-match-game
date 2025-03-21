import React from "react";
import { useNavigate } from "react-router-dom";

const t = (text) => text;

const MainNav = () => {
  const navigate = useNavigate();

  return (
    <nav className="bg-gray-800 px-6 py-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-bold text-white">{t("Memory Match")}</h1>
      <div className="space-x-4">
        <button onClick={() => navigate("/")} className="hover:underline text-sm text-white">{t("Profile")}</button>
        <button onClick={() => navigate("/scoreboard")} className="hover:underline text-sm text-white">{t("Scoreboard")}</button>
        <button onClick={() => navigate("/lobby")} className="hover:underline text-sm text-white">{t("Lobby")}</button>
      </div>
    </nav>
  );
};

export default MainNav;
