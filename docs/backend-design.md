# Backend Design

## Overview

Each app in `apps/<appId>/` has a `backend/` folder alongside its `frontend/`. Because Easy Apps is hosted by an organisation, all code inside `backend/` is considered **trusted** — it runs directly in the main server process with no sandboxing.

## Shared Library (`lib/`)

All backends share a common library at `lib/` in the project root. It provides:

| Module | Purpose |
|--------|---------|
| `lib/auth.ts` | Extract user identity and roles from the incoming request |
| `lib/data.ts` | CRUD helpers for flat JSON collections stored under `data/<appId>/` |
| `lib/types.ts` | Shared TypeScript types (`RequestUser`, etc.) |
| `lib/index.ts` | Re-exports everything |

### Auth

User identity is read from request headers (`x-user-id`, `x-user-roles`). Replace with real auth (JWT, session middleware, etc.) when ready.

```ts
import { requireUser, hasRole } from "../../../lib/index.js";

router.get("/secret", (req, res) => {
  const user = requireUser(req); // throws 500 if unauthenticated
  if (!hasRole(user, "admin")) return res.status(403).send();
  res.json({ secret: "..." });
});
```

### Data

JSON files live at `data/<appId>/<collection>.json`. The helpers are generic and enforce path safety.

```ts
import { readCollection, upsert, deleteById } from "../../../lib/data.js";

const items = await readCollection<Item>("my-app", "items");
await upsert<Item>("my-app", "items", { id: "1", name: "thing" });
await deleteById<Item>("my-app", "items", "1");
```

## Dynamic Route Loading

Backends are **not** loaded at startup. They are loaded lazily on the first request to `/apps/<appId>/api/...` and cached. No server restart is needed when an agent creates or modifies a backend.

### Route Ownership

```
/apps/:appId/api/*   →  dynamically loaded router from apps/<appId>/backend/index.ts
/mcp                 →  MCP endpoint for AI agents
/*                   →  Vite / static frontend
```

### Backend Entry Point

Each backend exports a default Express `Router`:

```ts
// apps/<appId>/backend/index.ts
import { Router } from "express";
import { requireUser } from "../../../lib/index.js";

const router = Router();

router.get("/hello", (req, res) => {
  const user = requireUser(req);
  res.json({ message: `Hello ${user.id}` });
});

export default router;
```

### Frontend Calling the Backend

Use a relative URL — no environment variables or hardcoded origins needed:

```ts
const res = await fetch("/apps/my-app/api/hello");
const data = await res.json();
```

## Reloading (`reload_app_backend` MCP Tool)

The `backend-registry.ts` maintains a cache of loaded routers. When an agent writes or patches backend files, it should call the `reload_app_backend` MCP tool:

```
Tool: reload_app_backend
Input: { appId: "my-app" }
```

This marks the app dirty. On the next HTTP request to `/apps/my-app/api/...`, the registry re-imports the backend module (ESM cache is busted via a versioned URL query param) and caches the fresh router.

## What the Agent Needs to Do

1. Write `apps/<appId>/backend/index.ts` exporting an Express `Router`
2. Use `lib/auth.ts` helpers to identify the caller
3. Use `lib/data.ts` helpers to read/write JSON collections under `data/<appId>/`
4. Call `reload_app_backend` after any file changes
5. The main server routes requests automatically — no manual registration needed

## Data Layout

```
data/
  <appId>/
    <collection>.json    ← flat JSON array of records, each with an "id" field
```

## Security Considerations

- Backend code is trusted — written by agents under org governance
- `lib/data.ts` validates that all data paths stay within `data/` to prevent traversal
- The existing path traversal protection in `_common.ts` covers MCP file operations
- `/src/*` route blocking in `main.ts` remains in place
- One app's backend cannot interfere with another's routes — each is scoped to its own prefix

## Open Questions

- Should each backend have its own `package.json` / dependencies, or share root `node_modules`?
- Should there be a `check_backend` MCP tool (runs `tsc --noEmit` scoped to the backend)?
- Lazy file-watch reload (detect changes without the agent calling `reload_app_backend`)?
