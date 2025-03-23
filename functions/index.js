const functions = require("firebase-functions");
const app = require("./src/server"); // Load your Express server

exports.api = functions.https.onRequest(app);
