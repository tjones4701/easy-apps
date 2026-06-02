import type { UserRecord } from "./types.js";
import {
  platformPath,
  readPlatformJson,
  writePlatformJson,
} from "./platform-store.js";

const USERS_PATH = platformPath("users.json");

async function readUsers(): Promise<UserRecord[]> {
  return readPlatformJson<UserRecord[]>(USERS_PATH, []);
}

async function writeUsers(users: UserRecord[]): Promise<void> {
  await writePlatformJson(USERS_PATH, users);
}

export async function getAllUsers(): Promise<UserRecord[]> {
  return readUsers();
}

export async function getUserById(id: string): Promise<UserRecord | undefined> {
  const users = await readUsers();
  return users.find((u) => u.id === id);
}

export async function upsertUser(user: UserRecord): Promise<void> {
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  await writeUsers(users);
}

export async function deleteUser(id: string): Promise<void> {
  const users = await readUsers();
  await writeUsers(users.filter((u) => u.id !== id));
}
