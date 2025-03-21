import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";

function App() {
  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const [sessionToken, setSessionToken] = useState(localStorage.getItem("sessionToken"));

  const handleLoginSuccess = (userId, sessionToken) => {
    localStorage.setItem("userId", userId);
    localStorage.setItem("sessionToken", sessionToken);
    setUserId(userId);
    setSessionToken(sessionToken);
  };

  const handleSignupSuccess = (userId, sessionToken) => {
    handleLoginSuccess(userId, sessionToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("sessionToken");
    setUserId(null);
    setSessionToken(null);
  };

  // ✅ Used for /game/:matchId redirection when match is found
  const handleMatchFound = (matchId, players) => {
    console.log("Match found! Match ID:", matchId, "Players:", players);
    // Navigation will happen inside Lobby, this is for optional logic
  };

  return (
    <Router>
      <Routes>
        {/* ✅ Redirect / to dashboard if logged in */}
        <Route path="/" element={
          userId && sessionToken ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
        } />
        
        <Route path="/signup" element={<Signup onSignupSuccess={handleSignupSuccess} />} />

        <Route
          path="/dashboard"
          element={
            userId && sessionToken
              ? <Dashboard userId={userId} sessionToken={sessionToken} onLogout={handleLogout} />
              : <Navigate to="/" replace />
          }
        />

        <Route
          path="/lobby"
          element={
            userId && sessionToken
              ? <Lobby userId={userId} sessionToken={sessionToken} onMatchFound={handleMatchFound} />
              : <Navigate to="/" replace />
          }
        />

        <Route
          path="/game/:matchId"
          element={
            localStorage.getItem("userId") && localStorage.getItem("sessionToken")
              ? <Game />
              : <Navigate to="/" replace />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
