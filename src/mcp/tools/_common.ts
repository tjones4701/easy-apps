import path from "path";
import fs from "fs/promises";

export const APPS_BASE_PATH = "C:\\dev\\easy-apps-2\\apps";

export function makePathSafe(filePath: string): string {
  const resolved = path.resolve(
    APPS_BASE_PATH,
    filePath.replace(/(\.\.(\/|\\|$))+/g, ""),
  );
  if (!resolved.startsWith(APPS_BASE_PATH)) {
    throw new Error("Path traversal attempt detected");
  }
  return resolved;
}

export async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}
