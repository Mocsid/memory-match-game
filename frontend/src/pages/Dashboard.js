import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfile, logoutUser } from "../services/authService";

const Dashboard = ({ userId, sessionToken, onLogout }) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId || !sessionToken) {
      // If missing session data, forcibly redirect
      window.location.replace("/");
      return;
    }
    fetchProfile();
  }, [userId, sessionToken]);

  const fetchProfile = async () => {
    const response = await getUserProfile(userId, sessionToken);
    if (response.success) {
      setUsername(response.user.username);
    } else {
      setError(response.error);
      // Forcibly log out on invalid session
      handleForcedLogout();
    }
  };

  const handleLogout = async () => {
    const response = await logoutUser(userId, sessionToken);
    if (response.success) {
      handleForcedLogout();
    } else {
      setError(response.error);
      // If invalid token, also forcibly log out
      if (
        response.error.includes("Session expired") ||
        response.error.includes("invalid")
      ) {
        handleForcedLogout();
      }
    }
  };

  const handleForcedLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("sessionToken");
    onLogout();
    window.location.replace("/");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome, {username || "User"}!</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={handleLogout} style={{ padding: "10px 20px", cursor: "pointer" }}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
