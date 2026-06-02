import { z } from "zod";
import { defineAction } from "../../../../lib/action.js";
import { readCollection, upsert } from "../../../../lib/data.js";
import type { Note } from "../models/note.js";

export const submitNote = defineAction({
  name: "submitNote",
  auth: "public",
  input: z.object({
    author: z.string().min(1).max(100),
    text: z.string().min(1).max(1000),
  }),
  handler: async ({ input, appId }) => {
    const note: Note = {
      id: crypto.randomUUID(),
      author: input.author,
      text: input.text,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    await upsert<Note>(appId, "notes", note);
    return { success: true, id: note.id };
  },
});
