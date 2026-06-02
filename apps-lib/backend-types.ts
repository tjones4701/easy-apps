/**
 * Shared backend types for app actions.
 *
 * Import in your backend with:
 *   import type { AuthGuard, ActionContext, AppAuthContext } from "#apps-lib/backend-types.js";
 *
 * Or just rely on inference via defineAction — these types are used automatically.
 */

// ─── AppAuthContext ────────────────────────────────────────────────────────────
// The portion of the auth context available inside action handlers.

export interface AppAuthContext {
  /** The logged-in user's ID and name, or null if unauthenticated. */
  userId: string | null;
  userRecord: { id: string; name: string } | null;
  /** All roles the user has in this app (direct + via groups). */
  effectiveRoles: string[];
  /** Returns true if the user has the given role. */
  hasRole(role: string): boolean;
  /** Returns true if the user is logged in. */
  isAuthenticated(): boolean;
}

// ─── AuthGuard ────────────────────────────────────────────────────────────────
/**
 * Controls who can call an action. Pass as the `auth` field of `defineAction`.
 *
 * - `"public"`            — No check; anyone (including guests) can call.
 * - `{ roles: string[] }` — User must be logged in AND have at least one role.
 *                           Example: `auth: { roles: ["admin"] }`
 *                           Example: `auth: { roles: ["admin", "moderator"] }`
 * - predicate function    — Custom check; user must also be authenticated.
 *                           Example: `auth: (ctx) => ctx.isAuthenticated()`
 *
 * There is NO bare `"user"` string guard.
 * To require any logged-in user: `auth: (ctx) => ctx.isAuthenticated()`
 */
export type AuthGuard =
  | "public"
  | { roles: string[] }
  | ((ctx: AppAuthContext) => boolean | Promise<boolean>);

// ─── ActionContext ─────────────────────────────────────────────────────────────
/**
 * The object passed to every action handler.
 *
 * @example
 * handler: async ({ input, authContext, appId }) => {
 *   const userId = authContext.userId!; // safe when auth requires login
 *   ...
 * }
 */
export interface ActionContext<TInput> {
  /** Validated, typed input from the request body. */
  input: TInput;
  /** Current user session. */
  authContext: AppAuthContext;
  /** ID of the app being called. */
  appId: string;
}
