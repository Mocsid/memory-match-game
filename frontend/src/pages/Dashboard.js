import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfile, logoutUser } from "../services/authService";

const Dashboard = ({ userId, sessionToken, onLogout }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // If missing session data, forcibly redirect to login
    if (!userId || !sessionToken) {
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
      setError(response.error || "Failed to load profile.");
    }
  };

  // Normal logout (calls logoutUser, then forcibly removes local storage & reloads)
  const handleLogout = async () => {
    const response = await logoutUser(userId, sessionToken);
    if (response.success) {
      handleForcedLogout();
    } else {
      setError(response.error);
      // If the token is invalid or expired, forcibly log out anyway
      if (
        response.error.includes("Session expired") ||
        response.error.includes("invalid")
      ) {
        handleForcedLogout();
      }
    }
  };

  // Force logout
  const handleForcedLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("sessionToken");
    onLogout && onLogout(); // If parent wants to do additional cleanup
    window.location.replace("/");
  };

  // New function: Navigate to Lobby
  const handleFindMatch = () => {
    navigate("/lobby");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome, {username || "User"}!</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <button
        onClick={handleFindMatch}
        style={{ padding: "10px 20px", cursor: "pointer", marginRight: "20px" }}
      >
        Find a Match
      </button>

      <button
        onClick={handleLogout}
        style={{ padding: "10px 20px", cursor: "pointer" }}
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
