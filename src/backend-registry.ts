import { Router } from "express";
import express from "express";
import { pathToFileURL } from "url";
import fs from "fs/promises";
import path from "path";
import { mountActions, type AppBackend } from "../lib/action.js";

const APPS_BASE_PATH = path.resolve("apps");

interface RegistryEntry {
  router: Router;
}

const registry = new Map<string, RegistryEntry>();
const dirtySet = new Set<string>();

/**
 * Mark an app's backend as dirty so it is reloaded on the next request.
 */
export function markDirty(appId: string): void {
  dirtySet.add(appId);
}

/**
 * Get the Express router for an app's backend.
 * Loads on first access, reloads if the app has been marked dirty.
 * Returns null if the app has no backend index file.
 *
 * The app's backend/index.ts exports { actions: ActionDef[] }.
 * The registry builds the Express router here, so app backends have
 * no Express dependency — they are pure action declarations.
 */
export async function getRouter(appId: string): Promise<Router | null> {
  const isDirty = dirtySet.has(appId);
  const cached = registry.get(appId);

  if (cached && !isDirty) {
    return cached.router;
  }

  const backendPath = path.join(APPS_BASE_PATH, appId, "backend", "index.ts");

  try {
    await fs.access(backendPath);
  } catch {
    return null;
  }

  // Bust the ESM module cache on reload via versioned URL
  const fileUrl = pathToFileURL(backendPath);
  fileUrl.searchParams.set("v", Date.now().toString());

  const mod = await import(fileUrl.href);
  const backend: AppBackend = mod.default;

  const router = Router();
  // Parse JSON bodies — auth middleware will be added here later
  router.use(express.json());
  mountActions(router, appId, backend.actions);

  registry.set(appId, { router });
  dirtySet.delete(appId);

  return router;
}
