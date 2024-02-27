const getAllCloud = require("./getListRepoCloud");
const getAll = require("./getListRepo");
const getBranchPerm = require("./getBranchPermissions");
const getRepoPerm = require("./getPermissionsRepo");
const getRepoPermCloud = require("./getPermissionsRepoCloud");
const getDefaultRev = require("./getDefaultReviewers");
const getDefaultRevCloud = require("./getDefaultReviewersCloud");
const assignProjectPerm = require("./assignProjectPermissions");
const assignProjectPermCloud = require("./assignProjectPermissionsCloud");
const assignBranch = require("./assignBranchPermissions");
const changeSlug = require("./changeSlugRepository");
const checkBranchPermission = require("./checkBranchPermissions");

module.exports = {
  getAll,
  getAllCloud,
  getBranchPerm,
  getRepoPerm,
  getDefaultRev,
  getRepoPermCloud,
  assignBranch,
  assignProjectPerm,
  assignProjectPermCloud,
  getDefaultRevCloud,
  changeSlug,
  checkBranchPermission,

};
