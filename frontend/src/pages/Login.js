import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Auto-detect Device ID & IP
  useEffect(() => {
    setDeviceId(navigator.userAgent);
    fetch("https://api64.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => setIpAddress("Unknown-IP"));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    const response = await loginUser(username, deviceId, ipAddress);
    if (response.success) {
      // On success, pass userId & token up to App.js
      onLoginSuccess(response.userId, response.sessionToken);
      navigate("/dashboard");
    } else {
      setError(response.error || "Login failed");
    }
  };

  const handleSignupRedirect = () => {
    navigate("/signup");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Login</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <p>
        No account?{" "}
        <button onClick={handleSignupRedirect} style={{ cursor: "pointer" }}>
          Sign up
        </button>
      </p>
    </div>
  );
};

export default Login;
