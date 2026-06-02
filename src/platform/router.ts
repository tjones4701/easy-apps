import crypto from "crypto";
import express, { Router } from "express";
import { resolveAuthContext } from "../../lib/auth-context.js";
import {
  deleteGroup,
  getAllGroups,
  getAllMemberships,
  getGroup,
  resolveRoles,
  upsertGroup,
  upsertMembership,
} from "../../lib/groups.js";
import { listCredentials } from "../../lib/credentials.js";
import type { UserRecord } from "../../lib/types.js";
import { getAllUsers } from "../../lib/users.js";

export function createPlatformRouter(): Router {
  const router = Router();
  router.use(express.json());

  // GET /platform/:appId/api/me — current user's identity + effective roles for this app
  // Requires authentication but NOT admin
  router.get("/:appId/api/me", async (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { appId } = req.params;
    const ctx = await resolveAuthContext(req, appId);
    res.json({
      userId: ctx.userId,
      name: ctx.userRecord?.name ?? null,
      effectiveRoles: ctx.effectiveRoles,
    });
  });

  // GET /platform/:appId/api/my-groups — groups the current user is a member of or owns
  // Requires authentication but NOT admin
  router.get("/:appId/api/my-groups", async (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { appId } = req.params;
    const userId = (req.user as UserRecord).id;
    const groups = await getAllGroups(appId);
    const memberOf = groups.filter((g) =>
      g.members.some((m) => m.type === "user" && m.id === userId),
    );
    const ownerOf = groups.filter((g) => g.owners.includes(userId));
    res.json({ memberOf, ownerOf });
  });

  // All /platform/:appId/api/* routes below require admin role
  router.use("/:appId/api", async (req, res, next) => {
    const { appId } = req.params;
    const ctx = await resolveAuthContext(req, appId);
    if (!ctx.isAuthenticated()) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!ctx.hasRole("admin")) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });

  // GET /platform/:appId/api/users
  router.get("/:appId/api/users", async (req, res) => {
    const { appId } = req.params;
    const [users, memberships, credentials] = await Promise.all([
      getAllUsers(),
      getAllMemberships(appId),
      listCredentials(),
    ]);
    const membershipMap = new Map(memberships.map((m) => [m.userId, m]));
    const usernameMap = new Map(credentials.map((c) => [c.userId, c.username]));
    const result = await Promise.all(
      users.map(async (u) => ({
        ...u,
        username: usernameMap.get(u.id) ?? null,
        membership: membershipMap.get(u.id) ?? null,
        effectiveRoles: await resolveRoles(appId, u.id),
      })),
    );
    res.json(result);
  });

  // PATCH /platform/:appId/api/users/:userId/membership
  router.patch("/:appId/api/users/:userId/membership", async (req, res) => {
    const { appId, userId } = req.params;
    const { roles, groupIds } = req.body as {
      roles?: string[];
      groupIds?: string[];
    };
    await upsertMembership(appId, {
      userId,
      roles: roles ?? [],
      groupIds: groupIds ?? [],
    });
    res.json({ ok: true });
  });

  // GET /platform/:appId/api/groups
  router.get("/:appId/api/groups", async (req, res) => {
    const { appId } = req.params;
    res.json(await getAllGroups(appId));
  });

  // POST /platform/:appId/api/groups
  router.post("/:appId/api/groups", async (req, res) => {
    const { appId } = req.params;
    const { name, roles } = req.body as { name?: string; roles?: string[] };
    if (!name?.trim()) {
      res.status(400).json({ error: "name is required" });
      return;
    }
    const group = {
      id: crypto.randomUUID(),
      name: name.trim(),
      appId,
      roles: roles ?? [],
      members: [],
      owners: [],
    };
    await upsertGroup(appId, group);
    res.status(201).json(group);
  });

  // DELETE /platform/:appId/api/groups/:groupId
  router.delete("/:appId/api/groups/:groupId", async (req, res) => {
    const { appId, groupId } = req.params;
    await deleteGroup(appId, groupId);
    res.json({ ok: true });
  });

  // POST /platform/:appId/api/groups/:groupId/members
  router.post("/:appId/api/groups/:groupId/members", async (req, res) => {
    const { appId, groupId } = req.params;
    const { type, id } = req.body as {
      type?: "user" | "group";
      id?: string;
    };
    if (!type || !id) {
      res.status(400).json({ error: "type and id are required" });
      return;
    }
    const group = await getGroup(appId, groupId);
    if (!group) {
      res.status(404).json({ error: `Group "${groupId}" not found` });
      return;
    }
    const already = group.members.some((m) => m.type === type && m.id === id);
    if (!already) {
      await upsertGroup(appId, {
        ...group,
        members: [...group.members, { type, id }],
      });
    }
    res.json({ ok: true });
  });

  // DELETE /platform/:appId/api/groups/:groupId/members?type=user&id=alice
  router.delete("/:appId/api/groups/:groupId/members", async (req, res) => {
    const { appId, groupId } = req.params;
    const type = req.query.type as string | undefined;
    const id = req.query.id as string | undefined;
    if (!type || !id) {
      res.status(400).json({ error: "type and id query params are required" });
      return;
    }
    const group = await getGroup(appId, groupId);
    if (!group) {
      res.status(404).json({ error: `Group "${groupId}" not found` });
      return;
    }
    await upsertGroup(appId, {
      ...group,
      members: group.members.filter((m) => !(m.type === type && m.id === id)),
    });
    res.json({ ok: true });
  });

  return router;
}
