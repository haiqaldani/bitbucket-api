const express = require("express");
const router = express.Router();

const repoHandler = require("./handler/repository");

router.post("/check-repo", repoHandler.check);
router.post("/get-all", repoHandler.getAll);
router.post("/get-bulk", repoHandler.getBulk);
router.post("/get-all-branchperm", repoHandler.getBranchPerm);
router.post("/get-all-repo-perm", repoHandler.getRepoPerm);
router.post("/get-all-repo-cloud", repoHandler.getRepoPermCloud);
router.post("/get-default-reviewer", repoHandler.getDefaultRev);
router.post("/assign-admin-repo", repoHandler.assignAdminRepo);

module.exports = router;
