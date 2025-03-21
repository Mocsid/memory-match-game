const express = require("express");
const router = express.Router();
const matchController = require("../controllers/matchController");

router.post("/queue/join", matchController.joinQueue);
router.post("/queue/leave", matchController.leaveQueue);

module.exports = router;
