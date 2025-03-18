const API_BASE_URL = "http://localhost:3001/api/auth";

// ✅ Signup API Call
export const signupUser = async (username, deviceId, ipAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, deviceId, ipAddress }),
    });

    const data = await response.json();
    console.log("🔹 Signup Response:", data); // ✅ Debugging step
    return data;
  } catch (error) {
    console.error("Signup Error:", error);
    return { error: "Signup failed" };
  }
};

// ✅ Login API Call
export const loginUser = async (username, deviceId, ipAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, deviceId, ipAddress }),
    });

    const data = await response.json();
    console.log("🔹 Login Response:", data); // ✅ Debugging step
    return data;
  } catch (error) {
    console.error("Login Error:", error);
    return { error: "Login failed" };
  }
};

// ✅ Fetch User Profile (Authenticated Request)
export const getUserProfile = async (userId, sessionToken) => {
  if (!sessionToken) {
    console.error("❌ No session token found before request!");
    return { error: "Session token is missing" };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    const data = await response.json();
    console.log("🔹 Profile Fetch Response:", data); // ✅ Debugging step
    return data;
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return { error: "Failed to fetch profile" };
  }
};

// ✅ Logout API Call
export const logoutUser = async (userId, sessionToken) => {
  if (!sessionToken) {
    console.error("❌ No session token provided for logout!");
    return { error: "Session token is missing" };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/logout/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    const data = await response.json();
    console.log("🔹 Logout Response:", data); // ✅ Debugging step
    return data;
  } catch (error) {
    console.error("Logout Error:", error);
    return { error: "Logout failed" };
  }
};
