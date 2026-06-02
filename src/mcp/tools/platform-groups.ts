import {
  deleteGroup,
  getAllGroups,
  getAllMemberships,
  getGroup,
  upsertGroup,
  upsertMembership,
} from "#lib/groups.js";
import { getUserById } from "#lib/users.js";
import type { GroupMember } from "#lib/types.js";
import { z } from "zod";
import { Tool } from "./tool.js";

const USER_ID_DESCRIPTION =
  "User ID (not a username). Use find_user_by_username to resolve a username to an ID.";

export const listGroupsTool: Tool<{ appId: string }> = {
  name: "list_groups",
  description: "List all groups defined in an app.",
  inputSchema: z.object({ appId: z.string() }),
  execute: async ({ appId }) => {
    const groups = await getAllGroups(appId);
    return {
      content: [{ type: "text", text: JSON.stringify(groups, null, 2) }],
    };
  },
};

export const createGroupTool: Tool<{
  appId: string;
  name: string;
  roles: string[];
  owners: string[];
}> = {
  name: "create_group",
  description: "Create a new group in an app.",
  inputSchema: z.object({
    appId: z.string(),
    name: z.string().min(1),
    roles: z
      .array(z.string())
      .describe("Roles granted to all members of this group"),
    owners: z
      .array(z.string())
      .describe(
        `User IDs who can manage this group's membership. ${USER_ID_DESCRIPTION}`,
      ),
  }),
  execute: async ({ appId, name, roles, owners }) => {
    const id = crypto.randomUUID();
    await upsertGroup(appId, { id, name, appId, roles, members: [], owners });
    return {
      content: [
        { type: "text", text: `Group "${name}" created with id "${id}".` },
      ],
    };
  },
};

export const deleteGroupTool: Tool<{ appId: string; groupId: string }> = {
  name: "delete_group",
  description: "Delete a group from an app.",
  inputSchema: z.object({ appId: z.string(), groupId: z.string() }),
  execute: async ({ appId, groupId }) => {
    await deleteGroup(appId, groupId);
    return { content: [{ type: "text", text: `Group "${groupId}" deleted.` }] };
  },
};

export const setGroupRolesTool: Tool<{
  appId: string;
  groupId: string;
  roles: string[];
}> = {
  name: "set_group_roles",
  description:
    "Set the roles granted by a group (only MCP can change group roles).",
  inputSchema: z.object({
    appId: z.string(),
    groupId: z.string(),
    roles: z.array(z.string()),
  }),
  execute: async ({ appId, groupId, roles }) => {
    const group = await getGroup(appId, groupId);
    if (!group)
      throw new Error(`Group "${groupId}" not found in app "${appId}".`);
    await upsertGroup(appId, { ...group, roles });
    return {
      content: [
        { type: "text", text: `Roles updated for group "${groupId}".` },
      ],
    };
  },
};

export const addGroupMemberTool: Tool<{
  appId: string;
  groupId: string;
  type: "user" | "group";
  memberId: string;
}> = {
  name: "add_group_member",
  description:
    "Add a user or sub-group to a group. When type is 'user', memberId must be a user ID — use find_user_by_username to resolve a username to an ID.",
  inputSchema: z.object({
    appId: z.string(),
    groupId: z.string(),
    type: z.enum(["user", "group"]),
    memberId: z
      .string()
      .describe(
        "User ID (when type is 'user') or group ID (when type is 'group'). For users: use find_user_by_username to get the ID from a username.",
      ),
  }),
  execute: async ({ appId, groupId, type, memberId }) => {
    const group = await getGroup(appId, groupId);
    if (!group) throw new Error(`Group "${groupId}" not found.`);
    if (type === "user") {
      const user = await getUserById(memberId);
      if (!user)
        throw new Error(
          `User "${memberId}" not found. Provide a user ID, not a username — use find_user_by_username to look up the ID.`,
        );
    }
    const already = group.members.some(
      (m: GroupMember) => m.type === type && m.id === memberId,
    );
    if (!already) {
      await upsertGroup(appId, {
        ...group,
        members: [...group.members, { type, id: memberId }],
      });
    }
    return {
      content: [{ type: "text", text: `Member added to group "${groupId}".` }],
    };
  },
};

export const removeGroupMemberTool: Tool<{
  appId: string;
  groupId: string;
  type: "user" | "group";
  memberId: string;
}> = {
  name: "remove_group_member",
  description:
    "Remove a user or sub-group from a group. When type is 'user', memberId must be a user ID — use find_user_by_username to resolve a username to an ID.",
  inputSchema: z.object({
    appId: z.string(),
    groupId: z.string(),
    type: z.enum(["user", "group"]),
    memberId: z
      .string()
      .describe(
        "User ID (when type is 'user') or group ID (when type is 'group'). For users: use find_user_by_username to get the ID from a username.",
      ),
  }),
  execute: async ({ appId, groupId, type, memberId }) => {
    const group = await getGroup(appId, groupId);
    if (!group) throw new Error(`Group "${groupId}" not found.`);
    await upsertGroup(appId, {
      ...group,
      members: group.members.filter(
        (m: GroupMember) => !(m.type === type && m.id === memberId),
      ),
    });
    return {
      content: [
        { type: "text", text: `Member removed from group "${groupId}".` },
      ],
    };
  },
};

export const addGroupOwnerTool: Tool<{
  appId: string;
  groupId: string;
  userId: string;
}> = {
  name: "add_group_owner",
  description: "Add a user as an owner of a group.",
  inputSchema: z.object({
    appId: z.string(),
    groupId: z.string(),
    userId: z.string().describe(USER_ID_DESCRIPTION),
  }),
  execute: async ({ appId, groupId, userId }) => {
    const user = await getUserById(userId);
    if (!user)
      throw new Error(
        `User "${userId}" not found. Provide a user ID, not a username — use find_user_by_username to look up the ID.`,
      );
    const group = await getGroup(appId, groupId);
    if (!group) throw new Error(`Group "${groupId}" not found.`);
    if (!group.owners.includes(userId)) {
      await upsertGroup(appId, { ...group, owners: [...group.owners, userId] });
    }
    return {
      content: [
        {
          type: "text",
          text: `User "${userId}" added as owner of group "${groupId}".`,
        },
      ],
    };
  },
};

export const removeGroupOwnerTool: Tool<{
  appId: string;
  groupId: string;
  userId: string;
}> = {
  name: "remove_group_owner",
  description:
    "Remove a user as owner of a group. Fails if they are the last owner.",
  inputSchema: z.object({
    appId: z.string(),
    groupId: z.string(),
    userId: z.string().describe(USER_ID_DESCRIPTION),
  }),
  execute: async ({ appId, groupId, userId }) => {
    const group = await getGroup(appId, groupId);
    if (!group) throw new Error(`Group "${groupId}" not found.`);
    if (group.owners.length === 1 && group.owners[0] === userId) {
      throw new Error(`Cannot remove the last owner of group "${groupId}".`);
    }
    await upsertGroup(appId, {
      ...group,
      owners: group.owners.filter((o: string) => o !== userId),
    });
    return {
      content: [
        {
          type: "text",
          text: `User "${userId}" removed as owner of group "${groupId}".`,
        },
      ],
    };
  },
};

export const setUserMembershipTool: Tool<{
  appId: string;
  userId: string;
  roles: string[];
  groupIds: string[];
}> = {
  name: "set_user_membership",
  description: "Set a user's direct roles and group memberships within an app.",
  inputSchema: z.object({
    appId: z.string(),
    userId: z.string().describe(USER_ID_DESCRIPTION),
    roles: z
      .array(z.string())
      .describe("Direct roles for this user in the app"),
    groupIds: z
      .array(z.string())
      .describe("Group IDs this user belongs to in the app"),
  }),
  execute: async ({ appId, userId, roles, groupIds }) => {
    const user = await getUserById(userId);
    if (!user)
      throw new Error(
        `User "${userId}" not found. Provide a user ID, not a username — use find_user_by_username to look up the ID.`,
      );
    await upsertMembership(appId, { userId, roles, groupIds });
    return {
      content: [
        {
          type: "text",
          text: `Membership updated for user "${userId}" in app "${appId}".`,
        },
      ],
    };
  },
};

export const listMembershipsTool: Tool<{ appId: string }> = {
  name: "list_memberships",
  description: "List all user memberships in an app.",
  inputSchema: z.object({ appId: z.string() }),
  execute: async ({ appId }) => {
    const memberships = await getAllMemberships(appId);
    return {
      content: [{ type: "text", text: JSON.stringify(memberships, null, 2) }],
    };
  },
};
