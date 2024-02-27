const dGroup = require("./assignToGroup");
const dUsers = require("./getAllUserCloud");
const dUsersCloud = require("./getAllUserJira.js");
const dUsertoProject = require("./assignUserToProject");
const dUsertoUUID = require("./covertUserToUUID");

module.exports = {
  dGroup,
  dUsertoProject,
  dUsers,
  dUsertoUUID,
  dUsersCloud,
};
