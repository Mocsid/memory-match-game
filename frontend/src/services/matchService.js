const API_BASE_URL = "http://localhost:3001/api/match"; // Backend URL

// ✅ Queue for Matchmaking
export const queueForMatch = async (userId, sessionToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ userId }),
    });

    return await response.json();
  } catch (error) {
    console.error("Queue Error:", error);
    return { error: "Failed to queue." };
  }
};

// ✅ Check Match Status
export const checkMatchStatus = async (matchId, sessionToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/status/${matchId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error("Match Status Error:", error);
    return { error: "Failed to check match status." };
  }
};
