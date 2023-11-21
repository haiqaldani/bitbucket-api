const check = require("./checkRepository");
const getAllCloud = require("./getListRepoCloud");
const getAll = require("./getListRepo");
const getBranchPerm = require("./getBranchPermissions");
const getRepoPerm = require("./getPermissionsRepo");
const getRepoPermCloud = require("./getPermissionsRepoCloud");
const getDefaultRev = require("./getDefaultReviewers");
const assignProjectPermissions = require("./assignProjectPermissions");
const assignBranch = require("./assignBranchPermissions");

module.exports = {
  check,
  getAll,
  getAllCloud,
  getBranchPerm,
  getRepoPerm,
  getDefaultRev,
  getRepoPermCloud,
  assignBranch,
  assignProjectPermissions

};
