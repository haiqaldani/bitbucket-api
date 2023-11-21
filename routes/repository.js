const express = require("express");
const router = express.Router();

const repoHandler = require("./handler/repository");

router.post("/server/get-all", repoHandler.getAll);
router.post("/cloud/get-all", repoHandler.getAllCloud);
router.post("/server/branch-permissions", repoHandler.getBranchPerm);
router.post("/server/permissions", repoHandler.getRepoPerm);
router.post("/cloud/permissions", repoHandler.getRepoPermCloud);
router.post("/server/default-reviewers", repoHandler.getDefaultRev);
router.post("/cloud/project-permissions/assign", repoHandler.assignProjectPermissions);
router.post("/cloud/branch-permissions/assign", repoHandler.assignBranch);

module.exports = router;
