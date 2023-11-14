const check = require("./checkRepository");
const getAll = require("./getListRepoCloud");
const getBulk = require("./getBulkRepository");
const getBranchPerm = require("./getBranchPermissions");
const getRepoPerm = require("./getPermissionsRepo");
const getRepoPermCloud = require("./getPermissionsRepoCloud");
const getDefaultRev = require("./getDefaultReviewers");
const assignAdminRepo = require("./permRepoFromProject");

module.exports = {
  check,
  getAll,
  getBulk,
  getBranchPerm,
  getRepoPerm,
  getDefaultRev,
  getRepoPermCloud,
  assignAdminRepo,

};
