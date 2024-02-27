const express = require("express");
const router = express.Router();

const repoHandler = require("./handler/repository");

router.post("/server/get-all", repoHandler.getAll);
router.post("/cloud/get-all", repoHandler.getAllCloud);
router.post("/server/branch", repoHandler.getBranchPerm);
router.post("/server/permissions", repoHandler.getRepoPerm);
router.post("/cloud/permissions", repoHandler.getRepoPermCloud);
router.post("/server/default-reviewers", repoHandler.getDefaultRev);
router.post("/cloud/default-reviewers", repoHandler.getDefaultRevCloud);
router.post("/server/project-permissions/assign", repoHandler.assignProjectPerm);
router.post("/cloud/project-permissions/assign", repoHandler.assignProjectPermCloud);
router.post("/server/branch-permissions/assign", repoHandler.assignBranch);
router.post("/server/change-slug", repoHandler.changeSlug);
router.get("/server/check-branch", repoHandler.checkBranchPermission);

module.exports = router;
