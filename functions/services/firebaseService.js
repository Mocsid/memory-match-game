const admin = require("firebase-admin");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

let firebaseApp;

// ✅ Only initialize if not already initialized
if (!admin.apps.length) {
  try {
    // Try to use local service account (for development only)
    const serviceAccount = JSON.parse(
      fs.readFileSync("./firebase-service-account.json", "utf8")
    );

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.DB_URL,
    });

    console.log("✅ Firebase Admin initialized with service account");
  } catch (err) {
    // Fallback for production — use default credentials provided by Firebase Functions
    firebaseApp = admin.initializeApp();
    console.log("✅ Firebase Admin initialized with default credentials");
  }
} else {
  firebaseApp = admin.app();
  console.log("⚠️ Firebase Admin already initialized");
}

const db = admin.database();
const auth = admin.auth();

module.exports = { firebaseApp, db, auth };
