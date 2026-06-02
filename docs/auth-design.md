# Authentication Design

## Goal

Replace the provisional header-based identity (`x-user-id`) with real session-based authentication using **Passport.js** + **passport-local** (username + password). A signed HTTP-only cookie carries the session ID; the server looks up the session to identify the user.

Every app route (`/apps/*`, `/platform/*`) requires a valid session. Unauthenticated browser requests are redirected to `/auth/login`; unauthenticated API/action requests receive `401 JSON`.

---

## Packages

| Package                  | Purpose                                                       |
| ------------------------ | ------------------------------------------------------------- |
| `passport`               | Auth middleware core                                          |
| `passport-local`         | Username + password strategy                                  |
| `express-session`        | Server-side session management (cookie holds session ID only) |
| `bcrypt`                 | Password hashing (bcrypt, cost factor 12)                     |
| `@types/passport`        | TypeScript types                                              |
| `@types/passport-local`  | TypeScript types                                              |
| `@types/express-session` | TypeScript types                                              |
| `@types/bcrypt`          | TypeScript types                                              |

---

## Data Storage

### Credentials file

Stored separately from the `UserRecord` so that the users list can be shared freely without exposing secrets.

```
data/_platform/credentials.json
```

Shape — flat JSON array:

```json
[
  {
    "userId": "alice",
    "username": "alice",
    "passwordHash": "$2b$12$..."
  }
]
```

- `userId` links to the matching record in `users.json`
- `username` is what the user types at login (can differ from `userId` but must be unique)
- `passwordHash` is a bcrypt hash (never stored in plaintext)

### Credentials helpers — `lib/credentials.ts`

```ts
export interface Credential {
  userId: string;
  username: string;
  passwordHash: string;
}

export async function findByUsername(
  username: string,
): Promise<Credential | undefined>;
export async function upsertCredential(cred: Credential): Promise<void>;
export async function deleteCredential(userId: string): Promise<void>;
export async function setPassword(
  userId: string,
  username: string,
  plaintext: string,
): Promise<void>;
// Hashes plaintext with bcrypt (cost 12) then calls upsertCredential
```

---

## Session Configuration

```ts
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);
```

Session data is stored in-memory by default (fine for development). For production, swap in a persistent store (e.g. `session-file-store` or a Redis adapter) without changing any other code.

---

## Passport Setup — `src/auth/passport.ts`

```ts
passport.use(
  new LocalStrategy(async (username, password, done) => {
    const cred = await findByUsername(username);
    if (!cred) return done(null, false, { message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, cred.passwordHash);
    if (!ok) return done(null, false, { message: "Invalid credentials" });
    const user = await getUserById(cred.userId);
    if (!user) return done(null, false, { message: "User account not found" });
    return done(null, user);
  }),
);

passport.serializeUser((user, done) => done(null, (user as UserRecord).id));

passport.deserializeUser(async (id: string, done) => {
  const user = await getUserById(id);
  done(null, user ?? false);
});
```

`req.user` is a `UserRecord` after deserialization. Passport stores only the `userId` in the session.

---

## Auth Routes — `src/auth/router.ts`

Mounted at `/auth` before the protected routes:

| Method | Path           | Description                                                        |
| ------ | -------------- | ------------------------------------------------------------------ |
| `GET`  | `/auth/login`  | Serve the login page (HTML)                                        |
| `POST` | `/auth/login`  | Authenticate; redirect to `/` on success, back to login on failure |
| `POST` | `/auth/logout` | Destroy session; redirect to `/auth/login`                         |
| `GET`  | `/auth/me`     | Return current user as JSON (or 401)                               |

---

## `lib/auth.ts` Update

Replace the header-reading implementation with a Passport-aware one:

```ts
export function getRequestUser(req: Request): RequestUser | null {
  if (!req.user) return null;
  return { id: (req.user as UserRecord).id };
}
```

Everything downstream (`resolveAuthContext`, `mountActions`, all action guards) continues to work unchanged because they all go through `getRequestUser`.

---

## Route Protection Middleware

Applied in `main.ts` to all protected prefixes, **after** session + Passport middleware:

```ts
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();

  // API requests (Accept: application/json or /api/ in path) → 401
  const isApiRequest =
    req.path.includes("/api/") ||
    req.headers.accept?.includes("application/json");
  if (isApiRequest) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  // Browser requests → redirect to login
  res.redirect(`/auth/login?next=${encodeURIComponent(req.originalUrl)}`);
}
```

Applied to:

- `/apps/*`
- `/platform/*`

**Not** applied to:

- `/auth/*` (the login routes themselves)
- `/mcp` (agent endpoint — separate concern, see below)
- Vite asset paths and `/` root (handled by Vite's own serving)

---

## MCP Endpoint Auth

The `/mcp` endpoint is called by AI agents, not browsers, so session cookies don't apply. For now it remains open (same as today). Future options:

- A long-lived API key in an `Authorization: Bearer <token>` header
- Restrict by IP to localhost only
- Mutual TLS

This is a separate concern and is left for a follow-up design document.

---

## MCP Tools for Credential Management

New file: `src/mcp/tools/platform-credentials.ts`

| Tool                      | Input                            | Description                                                                                                          |
| ------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `set_user_password`       | `{ userId, username, password }` | Create or update login credentials for a user. Hashes password with bcrypt. User must already exist in `users.json`. |
| `delete_user_credentials` | `{ userId }`                     | Remove login credentials (user can no longer log in).                                                                |
| `list_usernames`          | `{}`                             | List all usernames (no hashes).                                                                                      |

---

## Login Page

Minimal HTML form served directly by Express at `GET /auth/login`. No React or Vite involved — keeps the login surface simple and independent of the app build.

- Shows an error message when `?error=1` is in the query string
- On success, redirects to `?next=` parameter (validated to be a relative path) or `/`
- Styled with inline CSS (no external assets to load before auth)

---

## Implementation Order

1. **Install packages** — `passport`, `passport-local`, `express-session`, `bcrypt` + their types
2. **`lib/credentials.ts`** — CRUD for `data/_platform/credentials.json`
3. **`src/auth/passport.ts`** — Strategy + serialize/deserialize
4. **`src/auth/router.ts`** — Login/logout/me routes + HTML login page
5. **Update `src/main.ts`** — Wire session, passport, auth router, `requireAuth` middleware
6. **Update `lib/auth.ts`** — Read identity from `req.user` instead of header
7. **`src/mcp/tools/platform-credentials.ts`** — MCP tools for managing passwords
8. **Update `src/mcp/tools/tools.ts`** — Register new credential tools
9. **Verify** — `get_errors` across all changed files

---

## Open Questions

- **Session store for production**: In-memory sessions are lost on server restart. When production readiness matters, add `session-file-store` or similar. The session configuration is isolated in `src/auth/passport.ts`, so swapping is a one-file change.
- **"Remember me"**: Easy to add later — pass a `rememberMe` flag from the login form and conditionally extend `cookie.maxAge`.
- **Password reset**: No self-service flow planned yet. An admin can call the `set_user_password` MCP tool to reset any user's password.
- **First-run bootstrap**: With no credentials in the file, nobody can log in. The MCP agent must create the first user + credentials. Could add a `BOOTSTRAP_PASSWORD` env var that creates an initial `admin` account on startup if no credentials exist.
