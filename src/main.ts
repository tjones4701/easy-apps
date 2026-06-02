import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import ViteExpress from "vite-express";
import { createMcpServer } from "./mcp/mcp.js";
import { getRouter } from "./backend-registry.js";
import { createPlatformRouter } from "./platform/router.js";
import passport from "./auth/passport.js";
import { createAuthRouter } from "./auth/router.js";

const app = express();

// Block access to raw source files
app.use((req, _res, next) => {
  const isBlockedPath = /^\/src(\/|$)/.test(req.path);
  if (isBlockedPath) {
    _res.status(403).send("Forbidden: /src routes are not allowed.");
    return;
  }
  next();
});

// Session + Passport middleware
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
app.use(passport.initialize());
app.use(passport.session());

// Auth routes (public — login/logout/me)
app.use("/auth", express.urlencoded({ extended: false }), createAuthRouter());

// Require authentication for all app and platform routes
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  const isApiRequest =
    req.path.includes("/api/") ||
    (req.headers.accept ?? "").includes("application/json");
  if (isApiRequest) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.redirect(`/auth/login?next=${encodeURIComponent(req.originalUrl)}`);
}

app.use("/apps", requireAuth);
app.use("/platform", requireAuth);

app.get("/apps/hello", (_, res) => {
  res.send("Hello Vite + React + TypeScript!");
});

// Platform admin routes: /platform/:appId/admin and /platform/:appId/api/*
app.use("/platform", createPlatformRouter());

// Dynamically route /apps/:appId/api/* to each app's backend router
app.use("/apps/:appId/api", async (req, res, next) => {
  const { appId } = req.params;
  const router = await getRouter(appId);
  if (!router) {
    res.status(404).json({ error: `No backend found for app "${appId}"` });
    return;
  }
  router(req, res, next);
});

// Stateless handler (one transport per request)
app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  const server = createMcpServer();
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);
