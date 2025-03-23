import { database } from "../config/firebaseConfig";
import { ref, set, get, push, remove, onValue } from "firebase/database";

export const joinQueue = async (userId) => {
  try {
    const response = await fetch("http://localhost:3001/api/match/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    return await response.json();
  } catch (error) {
    console.error("Error joining queue:", error);
    return { error: true };
  }
};


const generateShuffledBoard = () => {
  const base = ["🍎", "🍌", "🍇", "🍒", "🥝", "🍋", "🍊", "🍓"];
  const doubled = [...base, ...base];
  return doubled.sort(() => Math.random() - 0.5);
};
