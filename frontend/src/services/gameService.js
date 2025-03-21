// frontend/src/services/gameService.js
const API_BASE_URL = 'http://localhost:3001/api/game'; // Or your deployed function URL (e.g., https://your-project-id.cloudfunctions.net/api/game)

export const joinGame = async (userId, sessionToken) => {
    const response = await fetch(`${API_BASE_URL}/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ userId }),
    });
    return await response.json();
};

export const cancelGame = async (userId, sessionToken) => {
    const response = await fetch(`${API_BASE_URL}/cancel`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ userId }),
    });
    return await response.json();
};