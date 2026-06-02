import type { Group, AppMembership } from "./types.js";
import {
  platformPath,
  readPlatformJson,
  writePlatformJson,
} from "./platform-store.js";

function groupsPath(appId: string): string {
  return platformPath("apps", appId, "groups.json");
}

function membershipsPath(appId: string): string {
  return platformPath("apps", appId, "memberships.json");
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function getAllGroups(appId: string): Promise<Group[]> {
  return readPlatformJson<Group[]>(groupsPath(appId), []);
}

export async function getGroup(
  appId: string,
  groupId: string,
): Promise<Group | undefined> {
  const groups = await getAllGroups(appId);
  return groups.find((g) => g.id === groupId);
}

export async function upsertGroup(appId: string, group: Group): Promise<void> {
  const groups = await getAllGroups(appId);
  const idx = groups.findIndex((g) => g.id === group.id);
  if (idx >= 0) groups[idx] = group;
  else groups.push(group);
  await writePlatformJson(groupsPath(appId), groups);
}

export async function deleteGroup(
  appId: string,
  groupId: string,
): Promise<void> {
  const groups = await getAllGroups(appId);
  await writePlatformJson(
    groupsPath(appId),
    groups.filter((g) => g.id !== groupId),
  );
}

// ── Memberships ───────────────────────────────────────────────────────────────

export async function getAllMemberships(
  appId: string,
): Promise<AppMembership[]> {
  return readPlatformJson<AppMembership[]>(membershipsPath(appId), []);
}

export async function getMembership(
  appId: string,
  userId: string,
): Promise<AppMembership | undefined> {
  const memberships = await getAllMemberships(appId);
  return memberships.find((m) => m.userId === userId);
}

export async function upsertMembership(
  appId: string,
  membership: AppMembership,
): Promise<void> {
  const memberships = await getAllMemberships(appId);
  const idx = memberships.findIndex((m) => m.userId === membership.userId);
  if (idx >= 0) memberships[idx] = membership;
  else memberships.push(membership);
  await writePlatformJson(membershipsPath(appId), memberships);
}

export async function deleteMembership(
  appId: string,
  userId: string,
): Promise<void> {
  const memberships = await getAllMemberships(appId);
  await writePlatformJson(
    membershipsPath(appId),
    memberships.filter((m) => m.userId !== userId),
  );
}

// ── Role resolution ───────────────────────────────────────────────────────────

/**
 * Resolve all effective roles for a user in an app.
 * Combines the user's direct roles with roles inherited from all groups
 * they belong to (recursive, cycle-safe).
 */
export async function resolveRoles(
  appId: string,
  userId: string,
): Promise<string[]> {
  const [groups, membership] = await Promise.all([
    getAllGroups(appId),
    getMembership(appId, userId),
  ]);

  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const roles = new Set<string>(membership?.roles ?? []);
  const visited = new Set<string>();

  function walkGroup(groupId: string): void {
    if (visited.has(groupId)) return;
    visited.add(groupId);
    const group = groupMap.get(groupId);
    if (!group) return;
    for (const role of group.roles) roles.add(role);
    for (const member of group.members) {
      if (member.type === "group") walkGroup(member.id);
    }
  }

  // Groups the user belongs to via memberships.json
  for (const groupId of membership?.groupIds ?? []) {
    walkGroup(groupId);
  }

  // Groups that directly list the user as a member
  for (const group of groups) {
    if (group.members.some((m) => m.type === "user" && m.id === userId)) {
      walkGroup(group.id);
    }
  }

  return Array.from(roles);
}

export async function isGroupOwner(
  appId: string,
  groupId: string,
  userId: string,
): Promise<boolean> {
  const group = await getGroup(appId, groupId);
  return group?.owners.includes(userId) ?? false;
}
