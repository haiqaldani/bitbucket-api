const express = require("express");
const router = express.Router();

const userHandler = require("./handler/users");

router.post("/group/assign", userHandler.dGroup);
router.post("/project/assign", userHandler.dUsertoProject);
router.post("/get-all", userHandler.dUsers);

module.exports = router;
