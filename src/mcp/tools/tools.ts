import { listAppsLibTool } from "./apps-lib-list.js";
import { readAppsLibFileTool } from "./apps-lib-read.js";
import { readTool } from "./apps-read-file.js";
import { writeTool } from "./apps-write-file.js";
import { deleteFileTool } from "./apps-delete-file.js";
import { listFilesTool } from "./apps-list-files.js";
import { patchFileTool } from "./apps-patch-file.js";
import { buildTool } from "./apps-build.js";
import { reloadBackendTool } from "./apps-reload-backend.js";
import { grepTool } from "./apps-grep.js";
import { createAppTool } from "./apps-create.js";
import { listUsersTool, deleteUserTool } from "./platform-users.js";
import {
  setUserPasswordTool,
  deleteUserCredentialsTool,
  listUsernamesTool,
  findUserByUsernameTool,
} from "./platform-credentials.js";
import {
  listGroupsTool,
  createGroupTool,
  deleteGroupTool,
  setGroupRolesTool,
  addGroupMemberTool,
  removeGroupMemberTool,
  addGroupOwnerTool,
  removeGroupOwnerTool,
  setUserMembershipTool,
  listMembershipsTool,
} from "./platform-groups.js";

export const AppTools = [
  // apps-lib — shared frontend library
  listAppsLibTool,
  readAppsLibFileTool,
  // App file management
  createAppTool,
  readTool,
  writeTool,
  deleteFileTool,
  listFilesTool,
  patchFileTool,
  buildTool,
  reloadBackendTool,
  grepTool,
  // Platform — users
  listUsersTool,
  deleteUserTool,
  // Platform — credentials
  setUserPasswordTool,
  deleteUserCredentialsTool,
  listUsernamesTool,
  findUserByUsernameTool,
  // Platform — groups & memberships
  listGroupsTool,
  createGroupTool,
  deleteGroupTool,
  setGroupRolesTool,
  addGroupMemberTool,
  removeGroupMemberTool,
  addGroupOwnerTool,
  removeGroupOwnerTool,
  setUserMembershipTool,
  listMembershipsTool,
];
