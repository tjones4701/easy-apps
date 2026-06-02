import { z } from "zod";
import { defineAction } from "../../../../lib/action.js";
import { readCollection, upsert } from "../../../../lib/data.js";
import type { Note } from "../models/note.js";

export const approveNote = defineAction({
  name: "approveNote",
  auth: { roles: ["admin"] },
  input: z.object({ id: z.string() }),
  handler: async ({ input, appId }) => {
    const notes = await readCollection<Note>(appId, "notes");
    const note = notes.find((n) => n.id === input.id);
    if (!note) throw new Error(`Note "${input.id}" not found`);
    await upsert<Note>(appId, "notes", {
      ...note,
      status: "approved",
      reviewedAt: new Date().toISOString(),
    });
    return { success: true };
  },
});
