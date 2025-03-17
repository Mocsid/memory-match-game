const functions = require("firebase-functions");

// Check if running in the Firebase Emulator
const IS_EMULATOR = process.env.FUNCTIONS_EMULATOR === "true";

// Use different API base URLs based on environment
const API_BASE_URL = IS_EMULATOR
    ? "http://127.0.0.1:5001/memory-match-game-8bd4c/us-central1"
    : functions.config().app.api_base_url;

exports.helloWorld = functions.https.onRequest((req, res) => {
    res.send(`Hello from Firebase! API Base URL: ${API_BASE_URL}`);
});
