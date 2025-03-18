import React, { useState, useEffect } from "react";
import { signupUser } from "../services/authService";

const Signup = ({ onSignupSuccess, onSwitchToLogin }) => {
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

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!username) {
      setError("Username is required");
      return;
    }

    const response = await signupUser(username, deviceId, ipAddress);
    if (response.success) {
      onSignupSuccess(response.userId, response.sessionToken);
    } else {
      setError(response.error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Signup</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSignup}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <button type="submit">Signup</button>
      </form>
      <p>
        Already have an account? <button onClick={onSwitchToLogin}>Login</button>
      </p>
    </div>
  );
};

export default Signup;
