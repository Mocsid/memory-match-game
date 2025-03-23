// frontend/src/services/matchMakingService.js (or similar)

import { database } from "../config/firebaseConfig"; // Keep if used elsewhere
import { ref, set, get, push, remove, onValue } from "firebase/database"; //Keep if used elsewhere

/**
 * Joins the matchmaking queue by calling the Firebase Function.
 * @param {string} userId - The ID of the user joining the queue.
 * @returns {Promise<object>} - The response from the Firebase Function (or an error object).
 */
export const joinQueue = async (userId) => {
  try {
    // Use the environment variable for the base URL!
    const url = `${process.env.REACT_APP_FIREBASE_FUNCTION_URL}/api/match/join`; // Corrected variable name
    console.log("Request URL:", url); // Keep for debugging

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    // Check for non-2xx responses and handle them as errors.
    if (!response.ok) {
      const errorData = await response.json().catch(() => null); // Try to parse JSON error
      const errorMessage = errorData?.message || `HTTP error: ${response.status} ${response.statusText}`;
      console.error("Error joining queue:", errorMessage);
      return { error: true, message: errorMessage };
    }

    return await response.json();
  } catch (error) {
    console.error("Error joining queue:", error);
    return { error: true, message: error.message || "Failed to join queue" };
  }
};

/**
 * Generates a shuffled game board.
 * @returns {string[]} - An array of shuffled card values (emojis).
 */
const generateShuffledBoard = () => {
  const base = ["🍎", "🍌", "🍇", "🍒", "🥝", "🍋", "🍊", "🍓"];
  const doubled = [...base, ...base];
  return doubled.sort(() => Math.random() - 0.5);
};

export { generateShuffledBoard };