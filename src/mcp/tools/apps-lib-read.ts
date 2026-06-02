import { z } from "zod";
import { Tool } from "./tool.js";
import fs from "fs/promises";
import path from "path";
import { APPS_BASE_PATH } from "./_common.js";

const APPS_LIB_PATH = path.resolve(APPS_BASE_PATH, "../apps-lib");

const readAppsLibInput = z.object({
  filePath: z
    .string()
    .describe(
      'Path relative to apps-lib, e.g. "callAction.ts" or "hooks/useAction.ts". ' +
        'Or pass the full import specifier like "#apps-lib/hooks/useAction.ts".',
    ),
});

export const readAppsLibFileTool: Tool<z.infer<typeof readAppsLibInput>> = {
  name: "read_apps_lib_file",
  description:
    "Read the source of a file from apps-lib — the shared frontend library. " +
    "Use list_apps_lib first to see what's available.",
  inputSchema: readAppsLibInput,
  execute: async ({ filePath }) => {
    // Strip leading #apps-lib/ if the agent passes the import specifier
    const normalized = filePath.replace(/^#apps-lib\//, "").replace(/\\/g, "/");

    // Prevent path traversal
    const resolved = path.resolve(APPS_LIB_PATH, normalized);
    if (
      !resolved.startsWith(APPS_LIB_PATH + path.sep) &&
      resolved !== APPS_LIB_PATH
    ) {
      throw new Error("Path traversal detected.");
    }

    const content = await fs.readFile(resolved, "utf-8");
    return { content: [{ type: "text", text: content }] };
  },
};
