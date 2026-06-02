import { defineBackend } from "../../../lib/action.js";
import { getCanvas } from "./actions/getCanvas.js";
import { paintPixel } from "./actions/paintPixel.js";
import { getCooldown } from "./actions/getCooldown.js";

export default defineBackend({
  actions: [getCanvas, paintPixel, getCooldown],
});
