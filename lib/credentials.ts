import bcrypt from "bcrypt";
import {
  platformPath,
  readPlatformJson,
  writePlatformJson,
} from "./platform-store.js";

export interface Credential {
  userId: string;
  username: string;
  passwordHash: string;
}

const CREDS_PATH = platformPath("credentials.json");

const BCRYPT_COST = 12;

async function readCredentials(): Promise<Credential[]> {
  return readPlatformJson<Credential[]>(CREDS_PATH, []);
}

async function writeCredentials(creds: Credential[]): Promise<void> {
  await writePlatformJson(CREDS_PATH, creds);
}

export async function findByUsername(
  username: string,
): Promise<Credential | undefined> {
  const creds = await readCredentials();
  return creds.find((c) => c.username === username);
}

export async function findCredentialByUserId(
  userId: string,
): Promise<Credential | undefined> {
  const creds = await readCredentials();
  return creds.find((c) => c.userId === userId);
}

export async function listCredentials(): Promise<
  { userId: string; username: string }[]
> {
  const creds = await readCredentials();
  return creds.map(({ userId, username }) => ({ userId, username }));
}

export async function upsertCredential(cred: Credential): Promise<void> {
  const creds = await readCredentials();
  const idx = creds.findIndex((c) => c.userId === cred.userId);
  if (idx >= 0) creds[idx] = cred;
  else creds.push(cred);
  await writeCredentials(creds);
}

export async function deleteCredential(userId: string): Promise<void> {
  const creds = await readCredentials();
  await writeCredentials(creds.filter((c) => c.userId !== userId));
}

/** Hash plaintext and persist credentials for the given user. */
export async function setPassword(
  userId: string,
  username: string,
  plaintext: string,
): Promise<void> {
  const passwordHash = await bcrypt.hash(plaintext, BCRYPT_COST);
  await upsertCredential({ userId, username, passwordHash });
}
