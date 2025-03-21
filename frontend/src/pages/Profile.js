import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { auth, database } from "../config/firebaseConfig";

export default function Profile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      const userRef = ref(database, `users/${user.uid}`);
      onValue(userRef, (snap) => {
        if (snap.exists()) {
          setProfile(snap.val());
        }
      });
    });
    return () => unsubscribe();
  }, []);

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen text-lg text-gray-600">
        Loading profile...
      </div>
    );
  }

  const { username, wins = 0, losses = 0 } = profile;
  const games = wins + losses;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center pt-12 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4 capitalize">{username}</h1>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-gray-600">Wins</p>
            <p className="text-lg font-semibold">{wins}</p>
          </div>
          <div>
            <p className="text-gray-600">Losses</p>
            <p className="text-lg font-semibold">{losses}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Games</p>
            <p className="text-lg font-semibold">{games}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
