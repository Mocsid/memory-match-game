import { auth, database } from "../config/firebaseConfig";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { generateUsername } from "./generateUsername";

// Auto sign in anonymously and store user in RTDB if new
export async function initAuth() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid;
        const userRef = ref(database, `users/${uid}`);
        const snap = await get(userRef);
        if (!snap.exists()) {
          // create new user with random username
          const uname = generateUsername();
          await set(userRef, {
            username: uname,
            wins: 0,
            losses: 0,
            createdAt: Date.now(),
          });
        }
        localStorage.setItem("userId", uid);
        resolve(uid);
      } else {
        try {
          const result = await signInAnonymously(auth);
          resolve(result.user.uid);
        } catch (err) {
          console.error("Anonymous sign-in failed:", err);
          reject(err);
        }
      }
    });
  });
}
