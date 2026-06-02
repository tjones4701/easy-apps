import { z } from "zod";
import { defineAction } from "../../../../lib/action.js";
import { readCollection, upsert } from "../../../../lib/data.js";
import type { Pixel, Cooldown } from "../models/pixel.js";

const COOLDOWN_MS = 60_000; // 1 minute
const GRID_SIZE = 256;

export const paintPixel = defineAction({
  name: "paintPixel",
  auth: (ctx) => ctx.isAuthenticated(),
  input: z.object({
    x: z.number().int().min(0).max(GRID_SIZE - 1),
    y: z.number().int().min(0).max(GRID_SIZE - 1),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  handler: async ({ input, appId, authContext }) => {
    const userId = authContext.userId!;

    // Check cooldown
    const cooldowns = await readCollection<Cooldown>(appId, "cooldowns");
    const record = cooldowns.find((c) => c.id === userId);
    if (record) {
      const elapsed = Date.now() - new Date(record.lastPaintedAt).getTime();
      if (elapsed < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - elapsed;
        throw new Error(`Cooldown active. Try again in ${Math.ceil(remainingMs / 1000)}s.`);
      }
    }

    // Paint the pixel
    const pixel: Pixel = {
      id: `${input.x}_${input.y}`,
      x: input.x,
      y: input.y,
      color: input.color,
      paintedAt: new Date().toISOString(),
    };
    await upsert<Pixel>(appId, "pixels", pixel);

    // Update cooldown
    await upsert<Cooldown>(appId, "cooldowns", {
      id: userId,
      lastPaintedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});
