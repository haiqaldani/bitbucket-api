const express = require("express");
const router = express.Router();

const userHandler = require("./handler/users");

router.post("/assignToGroup", userHandler.dGroup);
router.post("/assignToProject", userHandler.dUsertoProject);
router.post("/getAll", userHandler.dUsers);

module.exports = router;
