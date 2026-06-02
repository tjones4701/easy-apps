import type { Request } from "express";
import type { AuthContext, UserRecord } from "./types.js";
import { getRequestUser } from "./auth.js";
import { getUserById } from "./users.js";
import { resolveRoles, isGroupOwner } from "./groups.js";

export async function resolveAuthContext(
  req: Request,
  appId: string,
): Promise<AuthContext> {
  const requestUser = getRequestUser(req);
  const userId = requestUser?.id ?? null;

  let userRecord: UserRecord | null = null;
  let effectiveRoles: string[] = [];

  if (userId) {
    userRecord = (await getUserById(userId)) ?? null;
    effectiveRoles = await resolveRoles(appId, userId);
  }

  return {
    userId,
    userRecord,
    effectiveRoles,
    hasRole(role: string): boolean {
      return effectiveRoles.includes(role);
    },
    isAuthenticated(): boolean {
      return userId !== null;
    },
    isGroupOwner(groupId: string): Promise<boolean> {
      if (!userId) return Promise.resolve(false);
      return isGroupOwner(appId, groupId, userId);
    },
  };
}
