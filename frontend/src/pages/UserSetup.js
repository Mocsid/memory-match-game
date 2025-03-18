// frontend/src/pages/UserSetup.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const UserSetup = () => {
  const [username, setUsername] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const navigate = useNavigate();

    useEffect(() => {
        // Check for existing session
        const storedSessionToken = localStorage.getItem("sessionToken");
        const storedUserId = localStorage.getItem("userId");

        if(storedSessionToken && storedUserId) {
            //TODO: Add a check to validate the session token
            navigate("/game");
        }
    }, [navigate]);

  useEffect(() => {
    const getDeviceIdAndIp = async () => {
      try {
        // Get Fingerprint (Device ID)
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setDeviceId(result.visitorId);

        // Get IP Address
        const ipResponse = await fetch("https://api.ipify.org/?format=json");
        const ipData = await ipResponse.json();
        setIpAddress(ipData.ip);

      } catch (error) {
        console.error("Error getting device ID or IP:", error);
        setError("Failed to initialize. Please refresh."); // Show error to user
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    getDeviceIdAndIp();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username || !deviceId || !ipAddress) {
      setError("Please enter a username.");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, deviceId, ipAddress }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("sessionToken", data.sessionToken);
        localStorage.setItem("userId", data.userId);
        navigate("/game");
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    }
  };

    if (loading) {
        return <div>Loading...</div>; // Display loading message
    }

  return (
    <div>
      <h2>Sign Up</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input type="hidden" value={deviceId} readOnly />
        <input type="hidden" value={ipAddress} readOnly/>
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default UserSetup;