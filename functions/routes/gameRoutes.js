const express = require("express");
const router = express.Router();
const { joinQueue, cancelQueue } = require("../controllers/queueController");

// Define the POST /join route
router.post("/join", joinQueue);
// Endpoint to cancel the queue
router.post("/cancel", cancelQueue);

module.exports = router;
