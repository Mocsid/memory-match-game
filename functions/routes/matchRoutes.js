// functions/routes/matchRoutes.js
const express = require("express");
const router = express.Router();
const matchController = require("../controllers/matchController");

router.post("/join", matchController.joinQueue);

module.exports = router;
