/**
 * Platform data store — all I/O for platform-scoped data lives here.
 *
 * Currently backed by JSON files under data/_platform/.
 * To migrate to a database, replace the implementations of
 * `readPlatformJson` and `writePlatformJson` only.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const PLATFORM_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data/_platform",
);

/** Resolve a path inside the platform data directory. */
export function platformPath(...segments: string[]): string {
  return path.join(PLATFORM_PATH, ...segments);
}

/** Read a JSON file, returning `fallback` when the file does not exist yet. */
export async function readPlatformJson<T>(
  filePath: string,
  fallback: T,
): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8")) as T;
  } catch (err: any) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

/** Write a value as formatted JSON, creating any missing parent directories. */
export async function writePlatformJson<T>(
  filePath: string,
  data: T,
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}
