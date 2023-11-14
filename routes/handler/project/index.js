const getProjectPerm = require("./getPermissionsProject");
const getProjectPermCloud = require("./getPermissionsProjectCloud");
const getDefaultRev = require("./getDefaultReviewers");
const getAll = require("./getAllProject");
const renameProjectKey = require("./renameProjectKey");

module.exports = {
  getAll,
  getProjectPerm,
  getDefaultRev,
  getProjectPermCloud,
  renameProjectKey
};
