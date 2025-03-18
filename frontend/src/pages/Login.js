import React, { useState, useEffect } from "react";
import { loginUser } from "../services/authService";

const Login = ({ onLoginSuccess, onSwitchToSignup }) => {
  const [username, setUsername] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch device and IP address dynamically
    const fetchDeviceInfo = async () => {
      setDeviceId(navigator.userAgent); // Example for device info
      const response = await fetch("https://api64.ipify.org?format=json");
      const data = await response.json();
      setIpAddress(data.ip);
    };
    fetchDeviceInfo();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username) {
      setError("Username is required");
      return;
    }

    const response = await loginUser(username, deviceId, ipAddress);
    if (response.success) {
      onLoginSuccess(response.userId, response.sessionToken);
    } else {
      setError(response.error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <button type="submit">Login</button>
      </form>
      <p>
        No account? <button onClick={onSwitchToSignup}>Sign up</button>
      </p>
    </div>
  );
};

export default Login;
