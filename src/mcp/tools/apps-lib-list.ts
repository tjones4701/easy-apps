import { z } from "zod";
import { Tool } from "./tool.js";
import fs from "fs/promises";
import path from "path";
import { APPS_BASE_PATH } from "./_common.js";

const APPS_LIB_PATH = path.resolve(APPS_BASE_PATH, "../apps-lib");

async function walk(dir: string, base: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walk(path.join(dir, entry.name), rel)));
    } else {
      results.push(rel.replaceAll("\\", "/"));
    }
  }
  return results;
}

const emptyInput = z.object({});

export const listAppsLibTool: Tool<Record<string, never>> = {
  name: "list_apps_lib",
  description:
    "List all files available in apps-lib — the shared frontend library for apps. " +
    "Files here can be imported in any app frontend using `#apps-lib/<path>`. " +
    "Use read_apps_lib_file to see the contents of a specific file.",
  inputSchema: emptyInput,
  execute: async () => {
    const files = await walk(APPS_LIB_PATH, "");
    const text = files.length
      ? files.map((f) => `#apps-lib/${f}`).join("\n")
      : "(no files yet)";
    return { content: [{ type: "text", text }] };
  },
};
