const admin = require("firebase-admin");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

let firebaseApp;

// ✅ Ensure Firebase is only initialized once
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(fs.readFileSync("./firebase-service-account.json", "utf8"));

    firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    console.log("✅ Firebase Admin Initialized Successfully");
} else {
    firebaseApp = admin.app();
    console.log("⚠️ Firebase Admin Already Initialized, Using Existing Instance");
}

// ✅ Export Firebase Services
const db = admin.database();
const auth = admin.auth();

module.exports = { firebaseApp, db, auth };
