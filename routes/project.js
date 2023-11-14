const express = require("express");
const router = express.Router();

const projectHandler = require("./handler/project");

router.post("/get-all", projectHandler.getAll);
router.post("/get-all-project-perm", projectHandler.getProjectPerm);
router.post("/get-all-project-cloud", projectHandler.getProjectPermCloud);
router.post("/rename-project-key", projectHandler.renameProjectKey);

module.exports = router;
