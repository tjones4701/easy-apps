import { z } from "zod";
import { defineAction } from "../../../../lib/action.js";
import { readCollection } from "../../../../lib/data.js";
import type { Pixel } from "../models/pixel.js";

export const getCanvas = defineAction({
  name: "getCanvas",
  auth: "public",
  input: z.object({}),
  handler: async ({ appId }) => {
    const pixels = await readCollection<Pixel>(appId, "pixels");
    return pixels;
  },
});
