const functions = require("firebase-functions");

// Use environment variables from Docker, not Firebase functions.config()
const API_BASE_URL = process.env.FIREBASE_API_BASE_URL || "http://localhost:3001";

exports.helloWorld = functions.https.onRequest((req, res) => {
    res.send(`Hello from Firebase! API Base URL: ${API_BASE_URL}`);
});
