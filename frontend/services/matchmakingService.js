export const joinQueue = async (userId) => {
    try {
      const response = await fetch("http://localhost:3001/api/match/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
  
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Join queue failed:", error);
      return { error: "Failed to join queue." };
    }
  };
  