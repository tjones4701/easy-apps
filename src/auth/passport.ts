import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { findByUsername } from "#lib/credentials.js";
import { getUserById } from "#lib/users.js";
import type { UserRecord } from "#lib/types.js";

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const cred = await findByUsername(username);
      if (!cred) return done(null, false, { message: "Invalid credentials" });

      const ok = await bcrypt.compare(password, cred.passwordHash);
      if (!ok) return done(null, false, { message: "Invalid credentials" });

      const user = await getUserById(cred.userId);
      if (!user)
        return done(null, false, { message: "User account not found" });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, (user as UserRecord).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await getUserById(id);
    done(null, user ?? false);
  } catch (err) {
    done(err);
  }
});

export default passport;
