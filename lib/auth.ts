import type { Request } from "express";
import type { RequestUser, UserRecord } from "./types.js";

/**
 * Extracts user identity from req.user, populated by Passport after session deserialization.
 */
export function getRequestUser(req: Request): RequestUser | null {
  if (!req.user) return null;
  return { id: (req.user as UserRecord).id };
}

/**
 * Returns the request user or throws if unauthenticated.
 */
export function requireRequestUser(req: Request): RequestUser {
  const user = getRequestUser(req);
  if (!user) throw new Error("Unauthenticated");
  return user;
}
