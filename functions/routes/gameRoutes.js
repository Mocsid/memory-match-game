const express = require("express");
const router = express.Router();
const { joinQueue, cancelQueue } = require("../controllers/queueController");
const { leaveMatch } = require("../controllers/gameController");

// Define the POST /join route
router.post("/join", joinQueue);
// Endpoint to cancel the queue
router.post("/cancel", cancelQueue);

router.post("/match/leave", leaveMatch); // <-- THIS IS MISSING

module.exports = router;
