import { Router } from "express";
import { z, ZodTypeAny } from "zod";
import type { AuthContext } from "./types.js";
import { resolveAuthContext } from "./auth-context.js";
export type { AuthGuard, ActionContext } from "#apps-lib/backend-types.js";
import type { AuthGuard, ActionContext } from "#apps-lib/backend-types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ActionDef<TInput = any> {
  name: string;
  auth: AuthGuard;
  input: ZodTypeAny;
  handler: (ctx: ActionContext<TInput>) => Promise<unknown>;
}

export function defineAction<TSchema extends ZodTypeAny>(def: {
  name: string;
  auth: AuthGuard;
  input: TSchema;
  handler: (ctx: ActionContext<z.infer<TSchema>>) => Promise<unknown>;
}): ActionDef<z.infer<TSchema>> {
  return def as ActionDef<z.infer<TSchema>>;
}

async function checkAuth(
  guard: AuthGuard,
  ctx: AuthContext,
): Promise<"ok" | "unauthenticated" | "forbidden"> {
  if (guard === "public") return "ok";

  if (typeof guard === "object") {
    if (!ctx.isAuthenticated()) return "unauthenticated";
    const allowed = guard.roles.some((r) => ctx.hasRole(r));
    return allowed ? "ok" : "forbidden";
  }

  // Custom predicate
  if (typeof guard !== "function") return "forbidden";
  if (!ctx.isAuthenticated()) return "unauthenticated";
  const allowed = await guard(ctx);
  return allowed ? "ok" : "forbidden";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AppBackend {
  actions: ActionDef<any>[];
}

export function defineBackend(backend: AppBackend): AppBackend {
  return backend;
}

export function mountActions(
  router: Router,
  appId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actions: ActionDef<any>[],
): void {
  const actionMap = new Map(actions.map((a) => [a.name, a]));

  router.post("/actions/:name", async (req, res) => {
    const action = actionMap.get(req.params.name);
    if (!action) {
      res.status(404).json({ error: `Unknown action "${req.params.name}"` });
      return;
    }

    const authContext = await resolveAuthContext(req, appId);
    const authResult = await checkAuth(action.auth, authContext);

    if (authResult === "unauthenticated") {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (authResult === "forbidden") {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const parsed = action.input.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Invalid input", details: parsed.error.flatten() });
      return;
    }

    try {
      const result = await action.handler({
        input: parsed.data,
        authContext,
        appId,
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Internal server error" });
    }
  });
}
