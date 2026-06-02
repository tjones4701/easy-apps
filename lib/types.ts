// Identity extracted from the incoming HTTP request (header-based for now)
export interface RequestUser {
  id: string;
}

// Global user record — stored in data/_platform/users.json
export interface UserRecord {
  id: string;
  name: string;
}

// Per-user membership within a specific app
// stored in data/_platform/apps/<appId>/memberships.json
export interface AppMembership {
  userId: string;
  roles: string[]; // direct roles for this user in this app
  groupIds: string[]; // groups this user belongs to in this app
}

// A member of a group — either a user or a nested sub-group
export type GroupMember =
  | { type: "user"; id: string }
  | { type: "group"; id: string };

// Group defined within a specific app
// stored in data/_platform/apps/<appId>/groups.json
export interface Group {
  id: string;
  name: string;
  appId: string;
  roles: string[]; // roles granted to all members
  members: GroupMember[]; // users or nested sub-groups
  owners: string[]; // userIds who can manage membership of this group
}

// Resolved auth context — built per request from platform data
export interface AuthContext {
  userId: string | null;
  userRecord: UserRecord | null;
  effectiveRoles: string[];
  hasRole(role: string): boolean;
  isAuthenticated(): boolean;
  isGroupOwner(groupId: string): Promise<boolean>;
}

// Verify AuthContext is assignable to AppAuthContext (keeps them in sync)
import type { AppAuthContext } from "#apps-lib/backend-types.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _Check = AuthContext extends AppAuthContext ? true : never;
