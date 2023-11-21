const express = require("express");
const router = express.Router();

const projectHandler = require("./handler/project");

router.post("/cloud/get-all", projectHandler.getAllCloud);
router.post("/server/get-all", projectHandler.getAll);
router.post("/server/permissions", projectHandler.getProjectPerm);
router.post("/cloud/permissions", projectHandler.getProjectCloud);
router.post("/server/rename", projectHandler.renameProjectKey);

module.exports = router;
