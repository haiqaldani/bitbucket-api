const express = require("express");
const router = express.Router();

const userHandler = require("./handler/users");

router.post("/group/assign", userHandler.dGroup);
router.post("/project/assign", userHandler.dUsertoProject);
router.post("/cloud/get-all", userHandler.dUsers);
router.post("/server/get-all", userHandler.dUsersCloud);
router.post("/cloud/covertuuid", userHandler.dUsertoUUID);

module.exports = router;
