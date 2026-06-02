import { z } from "zod";
import { Tool } from "./tool.js";
import {
  setPassword,
  deleteCredential,
  listCredentials,
} from "#lib/credentials.js";
import { getUserById } from "#lib/users.js";

const setPasswordInput = z.object({
  userId: z
    .string()
    .describe("The user's ID (must already exist in users.json)"),
  username: z.string().min(1).describe("Login username"),
  password: z
    .string()
    .min(8)
    .describe("Plaintext password (min 8 chars) — will be hashed"),
});

export const setUserPasswordTool: Tool<z.infer<typeof setPasswordInput>> = {
  name: "set_user_password",
  description:
    "Create or update login credentials for a platform user. The password is hashed with bcrypt before storage. The user must already exist.",
  inputSchema: setPasswordInput,
  execute: async ({ userId, username, password }) => {
    const user = await getUserById(userId);
    if (!user)
      throw new Error(`User "${userId}" not found. Create the user first.`);
    await setPassword(userId, username, password);
    return {
      content: [
        {
          type: "text",
          text: `Credentials set for user "${userId}" (username: "${username}").`,
        },
      ],
    };
  },
};

const deleteCredsInput = z.object({ userId: z.string() });

export const deleteUserCredentialsTool: Tool<z.infer<typeof deleteCredsInput>> =
  {
    name: "delete_user_credentials",
    description:
      "Remove login credentials for a user. They will no longer be able to sign in.",
    inputSchema: deleteCredsInput,
    execute: async ({ userId }) => {
      await deleteCredential(userId);
      return {
        content: [
          { type: "text", text: `Credentials deleted for user "${userId}".` },
        ],
      };
    },
  };

const emptyInput = z.object({});

export const listUsernamesTool: Tool<Record<string, never>> = {
  name: "list_usernames",
  description:
    "List all registered usernames and their associated user IDs (no password hashes).",
  inputSchema: emptyInput,
  execute: async () => {
    const list = await listCredentials();
    return { content: [{ type: "text", text: JSON.stringify(list, null, 2) }] };
  },
};

const findUserByUsernameInput = z.object({
  username: z.string().min(1).describe("The login username to look up"),
});

export const findUserByUsernameTool: Tool<
  z.infer<typeof findUserByUsernameInput>
> = {
  name: "find_user_by_username",
  description:
    "Look up a user's ID by their login username. " +
    "Use this when you have a username and need the user ID required by other tools.",
  inputSchema: findUserByUsernameInput,
  execute: async ({ username }) => {
    const list = await listCredentials();
    const match = list.find((c) => c.username === username);
    if (!match) {
      return {
        content: [
          { type: "text", text: `No user found with username "${username}".` },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { userId: match.userId, username: match.username },
            null,
            2,
          ),
        },
      ],
    };
  },
};
