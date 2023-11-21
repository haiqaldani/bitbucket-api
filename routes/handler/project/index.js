const getProjectPerm = require("./getPermissionsProject");
const getProjectCloud = require("./getPermissionsProjectCloud");
const getDefaultRev = require("./getDefaultReviewers");
const getAllCloud = require("./getListProjectCloud");
const getAll = require("./getListProject");
const renameProjectKey = require("./renameProjectKey");

module.exports = {
  getAll,
  getProjectPerm,
  getDefaultRev,
  getProjectCloud,
  renameProjectKey,
  getAllCloud
};
