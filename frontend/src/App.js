import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { initAuth } from "./utils/authManager";
import Profile from "./pages/Profile";
import Scoreboard from "./pages/Scoreboard";
import Lobby from "./pages/Lobby";
import QueueWaiting from "./pages/QueueWaiting";
import Game from "./pages/Game";

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initAuth()
      .then(() => setIsReady(true))
      .catch(() => setIsReady(true));
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Initializing...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Profile />} />
        <Route path="/scoreboard" element={<Scoreboard />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/queue" element={<QueueWaiting />} />
        <Route path="/game/:matchId" element={<Game />} />
      </Routes>
    </Router>
  );
}

export default App;
