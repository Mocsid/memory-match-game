import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

function App() {
  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const [sessionToken, setSessionToken] = useState(localStorage.getItem("sessionToken"));

  useEffect(() => {
    console.log("📌 User ID:", userId);
    console.log("📌 Session Token:", sessionToken);
  }, [userId, sessionToken]);

  const handleLogin = (userId, sessionToken) => {
    if (!userId || !sessionToken) {
      console.error("❌ Missing userId or sessionToken during login!");
      return;
    }

    localStorage.setItem("userId", userId);
    localStorage.setItem("sessionToken", sessionToken);
    setUserId(userId);
    setSessionToken(sessionToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("sessionToken");
    setUserId(null);
    setSessionToken(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={userId ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
        <Route path="/dashboard" element={userId ? <Dashboard userId={userId} sessionToken={sessionToken} onLogout={handleLogout} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
