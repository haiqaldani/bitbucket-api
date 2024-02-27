const express = require("express");
const router = express.Router();

const addonHandler = require("./handler/addon");

router.post("/get-list-perm", addonHandler.getListPerm);
router.post("/create-migration-plan", addonHandler.migrationPlan)

module.exports = router;
