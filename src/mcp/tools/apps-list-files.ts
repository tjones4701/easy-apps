import { Tool } from "./tool.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { makePathSafe } from "./_common.js";

const InputSchema = z.object({
  appId: z.string().describe("ID of the app"),
  dirPath: z
    .string()
    .default("")
    .describe("Relative directory path to list (empty for root)"),
});

type InputSchemaType = z.infer<typeof InputSchema>;

async function listRecursive(dir: string, base: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      results.push(`${rel}/`);
      results.push(...(await listRecursive(path.join(dir, entry.name), rel)));
    } else {
      results.push(rel);
    }
  }
  return results;
}

export const listFilesTool: Tool<InputSchemaType> = {
  name: "list_app_files",
  description:
    "List all files and directories in an app's directory recursively",
  inputSchema: InputSchema,
  execute: async ({ appId, dirPath }) => {
    const safeDir = makePathSafe(`${appId}/${dirPath}`);
    const files = await listRecursive(safeDir, "");
    return { content: [{ type: "text", text: files.join("\n") || "(empty)" }] };
  },
};
