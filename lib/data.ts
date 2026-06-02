import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const DATA_BASE_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data",
);

function getCollectionPath(appId: string, collection: string): string {
  if (appId.startsWith("_")) {
    throw new Error(
      `"${appId}" is a reserved app ID and cannot be accessed from app backends.`,
    );
  }
  const resolved = path.resolve(DATA_BASE_PATH, appId, `${collection}.json`);
  if (!resolved.startsWith(DATA_BASE_PATH)) {
    throw new Error("Path traversal attempt detected");
  }
  return resolved;
}

/**
 * Read all records from a JSON collection file.
 * Returns an empty array if the file does not exist yet.
 */
export async function readCollection<T>(
  appId: string,
  collection: string,
): Promise<T[]> {
  const filePath = getCollectionPath(appId, collection);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T[];
  } catch (err: any) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

/**
 * Overwrite a JSON collection file with the given array.
 */
export async function writeCollection<T>(
  appId: string,
  collection: string,
  data: T[],
): Promise<void> {
  const filePath = getCollectionPath(appId, collection);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Find a single record by its id field.
 */
export async function findById<T extends { id: string }>(
  appId: string,
  collection: string,
  id: string,
): Promise<T | undefined> {
  const items = await readCollection<T>(appId, collection);
  return items.find((item) => item.id === id);
}

/**
 * Insert or update a record by its id field.
 */
export async function upsert<T extends { id: string }>(
  appId: string,
  collection: string,
  item: T,
): Promise<void> {
  const items = await readCollection<T>(appId, collection);
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.push(item);
  await writeCollection(appId, collection, items);
}

/**
 * Delete a record by its id field.
 */
export async function deleteById<T extends { id: string }>(
  appId: string,
  collection: string,
  id: string,
): Promise<void> {
  const items = await readCollection<T>(appId, collection);
  await writeCollection(
    appId,
    collection,
    items.filter((i) => i.id !== id),
  );
}
