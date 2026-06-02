import { z } from "zod";
import { defineAction } from "../../../../lib/action.js";
import { readCollection } from "../../../../lib/data.js";
import type { Cooldown } from "../models/pixel.js";

const COOLDOWN_MS = 60_000; // 1 minute

export const getCooldown = defineAction({
  name: "getCooldown",
  auth: (ctx) => ctx.isAuthenticated(),
  input: z.object({}),
  handler: async ({ appId, authContext }) => {
    const userId = authContext.userId!;
    const cooldowns = await readCollection<Cooldown>(appId, "cooldowns");
    const record = cooldowns.find((c) => c.id === userId);
    if (!record) return { remainingMs: 0 };
    const elapsed = Date.now() - new Date(record.lastPaintedAt).getTime();
    const remainingMs = Math.max(0, COOLDOWN_MS - elapsed);
    return { remainingMs };
  },
});
