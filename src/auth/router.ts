import { Router, Request, Response } from "express";
import crypto from "crypto";
import passport from "./passport.js";
import { findByUsername, setPassword } from "#lib/credentials.js";
import { getUserById, upsertUser } from "#lib/users.js";

const SHARED_STYLES = `
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f5f5f5;
      font-family: system-ui, sans-serif;
      color: #111;
    }
    .card {
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 2px 16px rgba(0,0,0,.10);
      padding: 2.5rem 2rem;
      width: 100%;
      max-width: 360px;
    }
    h1 { margin: 0 0 1.5rem; font-size: 1.4rem; font-weight: 600; }
    label { display: block; margin-bottom: .25rem; font-size: .875rem; font-weight: 500; }
    input {
      width: 100%;
      padding: .5rem .75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1rem;
      margin-bottom: 1rem;
      outline: none;
      transition: border-color .15s;
    }
    input:focus { border-color: #6366f1; }
    button {
      width: 100%;
      padding: .6rem;
      background: #6366f1;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background .15s;
    }
    button:hover { background: #4f46e5; }
    .error {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: .5rem .75rem;
      font-size: .875rem;
      margin-bottom: 1rem;
    }
    .link {
      display: block;
      text-align: center;
      margin-top: 1rem;
      font-size: .875rem;
      color: #6366f1;
      text-decoration: none;
    }
    .link:hover { text-decoration: underline; }
`;

const LOGIN_PAGE = (error?: string, next?: string) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in — Easy Apps</title>
  <style>${SHARED_STYLES}</style>
</head>
<body>
  <div class="card">
    <h1>Sign in</h1>
    ${error ? `<div class="error">${error}</div>` : ""}
    <form method="POST" action="/auth/login${next ? `?next=${encodeURIComponent(next)}` : ""}">
      <label for="username">Username</label>
      <input id="username" name="username" type="text" autocomplete="username" required autofocus />
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required />
      <button type="submit">Sign in</button>
    </form>
    <a class="link" href="/auth/signup">Create an account</a>
  </div>
</body>
</html>`;

const SIGNUP_PAGE = (error?: string) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Create account — Easy Apps</title>
  <style>${SHARED_STYLES}</style>
</head>
<body>
  <div class="card">
    <h1>Create account</h1>
    ${error ? `<div class="error">${error}</div>` : ""}
    <form method="POST" action="/auth/signup">
      <label for="name">Display name</label>
      <input id="name" name="name" type="text" autocomplete="name" required autofocus />
      <label for="username">Username</label>
      <input id="username" name="username" type="text" autocomplete="username" required />
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="new-password" required minlength="8" />
      <button type="submit">Create account</button>
    </form>
    <a class="link" href="/auth/login">Already have an account? Sign in</a>
  </div>
</body>
</html>`;

export function createAuthRouter(): Router {
  const router = Router();

  router.get("/login", (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      res.redirect("/");
      return;
    }
    const next =
      typeof req.query.next === "string" ? req.query.next : undefined;
    const error =
      req.query.error === "1" ? "Invalid username or password." : undefined;
    res.send(LOGIN_PAGE(error, next));
  });

  router.post("/login", (req: Request, res: Response, next) => {
    const nextUrl = typeof req.query.next === "string" ? req.query.next : "/";
    // Validate next is a relative path to prevent open redirect
    const safeNext =
      nextUrl.startsWith("/") && !nextUrl.startsWith("//") ? nextUrl : "/";

    passport.authenticate(
      "local",
      (err: unknown, user: Express.User | false) => {
        if (err) return next(err);
        if (!user) {
          const dest = `/auth/login?error=1${safeNext !== "/" ? `&next=${encodeURIComponent(safeNext)}` : ""}`;
          res.redirect(dest);
          return;
        }
        req.logIn(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          res.redirect(safeNext);
        });
      },
    )(req, res, next);
  });

  router.post("/logout", (req: Request, res: Response, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect("/auth/login");
    });
  });

  router.get("/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    res.json(req.user);
  });

  router.get("/signup", (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      res.redirect("/");
      return;
    }
    const error =
      req.query.error === "taken"
        ? "That username is already taken."
        : req.query.error === "weak"
          ? "Password must be at least 8 characters."
          : req.query.error === "1"
            ? "Something went wrong. Please try again."
            : undefined;
    res.send(SIGNUP_PAGE(error));
  });

  router.post("/signup", async (req: Request, res: Response, next) => {
    try {
      const { name, username, password } = req.body as {
        name?: string;
        username?: string;
        password?: string;
      };

      if (!name?.trim() || !username?.trim() || !password) {
        res.redirect("/auth/signup?error=1");
        return;
      }
      if (password.length < 8) {
        res.redirect("/auth/signup?error=weak");
        return;
      }

      const existing = await findByUsername(username.trim());
      if (existing) {
        res.redirect("/auth/signup?error=taken");
        return;
      }

      const userId = crypto.randomUUID();
      await upsertUser({ id: userId, name: name.trim() });
      await setPassword(userId, username.trim(), password);

      // Auto-login after signup
      const user = await getUserById(userId);
      req.logIn(user!, (err) => {
        if (err) return next(err);
        res.redirect("/");
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
