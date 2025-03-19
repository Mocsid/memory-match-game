import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser } from "../services/authService";

const Signup = ({ onSignupSuccess }) => {
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

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    const response = await signupUser(username, deviceId, ipAddress);
    if (response.success) {
      onSignupSuccess(response.userId, response.sessionToken);
      navigate("/dashboard");
    } else {
      setError(response.error || "Signup failed");
    }
  };

  const handleLoginRedirect = () => {
    navigate("/");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Sign Up</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <button type="submit">Sign Up</button>
      </form>
      <p>
        Already have an account?{" "}
        <button onClick={handleLoginRedirect} style={{ cursor: "pointer" }}>
          Login
        </button>
      </p>
    </div>
  );
};

export default Signup;
