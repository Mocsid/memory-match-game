import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Profile from "./pages/Profile";
import { initAuth } from "./utils/authManager";

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
        {/* Additional routes to come */}
      </Routes>
    </Router>
  );
}

export default App;
