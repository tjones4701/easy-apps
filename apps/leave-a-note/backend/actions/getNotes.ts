import { z } from "zod";
import { defineAction } from "../../../../lib/action.js";
import { readCollection } from "../../../../lib/data.js";
import type { Note } from "../models/note.js";

export const getNotes = defineAction({
  name: "getNotes",
  auth: "public",
  input: z.object({}),
  handler: async ({ appId }) => {
    const notes = await readCollection<Note>(appId, "notes");
    return notes
      .filter((n) => n.status === "approved")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
});
