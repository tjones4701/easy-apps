import { z } from "zod";
import { defineAction } from "../../../../lib/action.js";
import { readCollection } from "../../../../lib/data.js";
import type { Note } from "../models/note.js";

export const getPendingNotes = defineAction({
  name: "getPendingNotes",
  auth: { roles: ["admin"] },
  input: z.object({}),
  handler: async ({ appId }) => {
    const notes = await readCollection<Note>(appId, "notes");
    return notes
      .filter((n) => n.status === "pending")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
});
