import { z } from "zod";
import { Tool } from "./tool.js";
import {
  getAllUsers,
  getUserById,
  upsertUser,
  deleteUser,
} from "#lib/users.js";
import { listCredentials } from "#lib/credentials.js";
import { deleteMembership, getAllGroups, upsertGroup } from "#lib/groups.js";
import type { Group } from "#lib/types.js";
import fs from "fs/promises";
import path from "path";

const PLATFORM_APPS_PATH = path.resolve("data/_platform/apps");

const emptyInput = z.object({});

export const listUsersTool: Tool<Record<string, never>> = {
  name: "list_users",
  description: "List all global user records.",
  inputSchema: emptyInput,
  execute: async () => {
    const [users, creds] = await Promise.all([
      getAllUsers(),
      listCredentials(),
    ]);
    const usernameById = new Map(creds.map((c) => [c.userId, c.username]));
    const result = users.map((u) => ({
      ...u,
      username: usernameById.get(u.id) ?? null,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
};

const createUserInput = z.object({
  id: z.string().min(1).describe("Unique user ID (e.g. slug or UUID)"),
  name: z.string().min(1).describe("Display name"),
});

const deleteUserInput = z.object({ id: z.string() });

export const deleteUserTool: Tool<z.infer<typeof deleteUserInput>> = {
  name: "delete_user",
  description:
    "Delete a global user and remove them from all app memberships and groups.",
  inputSchema: deleteUserInput,
  execute: async ({ id }) => {
    await deleteUser(id);

    // Cascade: clean up all per-app platform data
    try {
      const appDirs = await fs.readdir(PLATFORM_APPS_PATH);
      await Promise.all(
        appDirs.map(async (appId) => {
          await deleteMembership(appId, id).catch(() => {});
          const groups = await getAllGroups(appId);
          for (const group of groups) {
            const changed =
              group.owners.includes(id) ||
              group.members.some((m) => m.type === "user" && m.id === id);
            if (changed) {
              const updated: Group = {
                ...group,
                owners: group.owners.filter((o) => o !== id),
                members: group.members.filter(
                  (m) => !(m.type === "user" && m.id === id),
                ),
              };
              await upsertGroup(appId, updated);
            }
          }
        }),
      );
    } catch (err: any) {
      if (err.code !== "ENOENT") throw err;
    }

    return {
      content: [
        {
          type: "text",
          text: `User "${id}" deleted and removed from all apps.`,
        },
      ],
    };
  },
};
