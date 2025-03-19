import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

function App() {
  // Load session from localStorage so user remains logged in on refresh
  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const [sessionToken, setSessionToken] = useState(localStorage.getItem("sessionToken"));

  const handleLoginSuccess = (userId, sessionToken) => {
    // Store session in memory + localStorage
    setUserId(userId);
    setSessionToken(sessionToken);
    localStorage.setItem("userId", userId);
    localStorage.setItem("sessionToken", sessionToken);
  };

  const handleSignupSuccess = (userId, sessionToken) => {
    // Same as login: store user session
    setUserId(userId);
    setSessionToken(sessionToken);
    localStorage.setItem("userId", userId);
    localStorage.setItem("sessionToken", sessionToken);
  };

  const handleLogout = () => {
    // Clear local storage & state
    localStorage.removeItem("userId");
    localStorage.removeItem("sessionToken");
    setUserId(null);
    setSessionToken(null);
  };

  return (
    <Router>
      <Routes>
        {/* If user is already logged in, go to dashboard, else show login */}
        <Route
          path="/"
          element={
            userId && sessionToken ? (
              <Navigate to="/dashboard" />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Signup route */}
        <Route
          path="/signup"
          element={<Signup onSignupSuccess={handleSignupSuccess} />}
        />

        {/* Dashboard route (protected) */}
        <Route
          path="/dashboard"
          element={
            userId && sessionToken ? (
              <Dashboard
                userId={userId}
                sessionToken={sessionToken}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Fallback route: Any unknown path → redirect to / */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
