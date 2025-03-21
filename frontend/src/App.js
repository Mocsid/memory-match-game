import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Lobby from "./pages/Lobby"; // ✅ NEW - Add Lobby page
import Game from "./pages/Game"; // ✅ NEW - Add Game page

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

  // ✅ Add handleMatchFound function to process match results
  const handleMatchFound = (matchId, players) => {
    console.log("Match found! Match ID:", matchId, "Players:", players);
    // Example: Navigate to the game page in the future
    // navigate(`/game/${matchId}`);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/signup" element={<Signup onSignupSuccess={handleSignupSuccess} />} />
        <Route path="/dashboard" element={userId ? <Dashboard userId={userId} sessionToken={sessionToken} onLogout={handleLogout} /> : <Navigate to="/" />} />
        <Route path="/lobby" element={userId && sessionToken ? <Lobby userId={userId} sessionToken={sessionToken} onMatchFound={handleMatchFound} /> : <Navigate to="/" />} />
        <Route path="/game/:matchId" element={<Game />} /> ✅ New Game Route
      </Routes>
    </Router>
  );
}

export default App;
