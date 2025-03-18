import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfile, logoutUser } from "../services/authService";

const Dashboard = ({ userId, sessionToken, onLogout }) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // ✅ Fix useNavigate error

  useEffect(() => {
    if (!userId || !sessionToken) {
      console.error("❌ Missing userId or sessionToken");
      navigate("/"); // ✅ Redirect to login if missing
      return;
    }

    const fetchProfile = async () => {
      const response = await getUserProfile(userId, sessionToken);
      if (response.success) {
        setUsername(response.user.username);
      } else {
        setError(response.error);
        console.error("Failed to fetch profile:", response.error);
      }
    };

    fetchProfile();
  }, [userId, sessionToken, navigate]);

  const handleLogout = async () => {
    const response = await logoutUser(userId, sessionToken);
    if (response.success) {
      onLogout(); // ✅ Clear session & redirect
      navigate("/");
    } else {
      setError(response.error);
      console.error("Logout failed:", response.error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome, {username || "User"}!</h1>
      {error && <p style={{ color: "red" }}>{error}</p>} {/* ✅ Show errors */}
      <button onClick={handleLogout} style={{ padding: "10px 20px", cursor: "pointer" }}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
