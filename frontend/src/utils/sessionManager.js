// frontend/src/utils/sessionManager.js

const SESSION_KEY = "sessionToken";
const USER_ID_KEY = "userId";

// ✅ Save session
export const saveSession = (sessionToken, userId) => {
  localStorage.setItem(SESSION_KEY, sessionToken);
  localStorage.setItem(USER_ID_KEY, userId);
};

// ✅ Retrieve session token
export const getSessionToken = () => localStorage.getItem(SESSION_KEY);

// ✅ Retrieve userId
export const getUserId = () => localStorage.getItem(USER_ID_KEY);

// ✅ Clear session
export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_ID_KEY);
};
