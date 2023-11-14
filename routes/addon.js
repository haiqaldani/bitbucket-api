const express = require("express");
const router = express.Router();

const addonHandler = require("./handler/addon");

router.post("/get-list-perm", addonHandler.getListPerm);

module.exports = router;
