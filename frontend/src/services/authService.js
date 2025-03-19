const API_BASE_URL = "http://localhost:3001/api/auth"; // or your actual backend URL

export const signupUser = async (username, deviceId, ipAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, deviceId, ipAddress }),
    });
    return await response.json();
  } catch (error) {
    console.error("Signup Error:", error);
    return { error: "Signup failed" };
  }
};

export const loginUser = async (username, deviceId, ipAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, deviceId, ipAddress }),
    });
    return await response.json();
  } catch (error) {
    console.error("Login Error:", error);
    return { error: "Login failed" };
  }
};

export const getUserProfile = async (userId, sessionToken) => {
  if (!sessionToken) {
    return { error: "Session token missing" };
  }
  try {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return { error: "Failed to fetch profile" };
  }
};

export const logoutUser = async (userId, sessionToken) => {
  if (!sessionToken) {
    return { error: "Session token missing" };
  }
  try {
    const response = await fetch(`${API_BASE_URL}/logout/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Logout Error:", error);
    return { error: "Logout failed" };
  }
};
