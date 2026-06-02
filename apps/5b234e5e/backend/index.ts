import { Router } from "express";
import { requireUser } from "../../../lib/index.js";
import { readCollection, upsert, deleteById } from "../../../lib/data.js";

const APP_ID = "template";

interface Note {
  id: string;
  text: string;
  createdBy: string;
}

const router = Router();

// GET /apps/template/api/notes
router.get("/notes", async (req, res) => {
  const user = requireUser(req);
  const notes = await readCollection<Note>(APP_ID, "notes");
  const userNotes = notes.filter((n) => n.createdBy === user.id);
  res.json(userNotes);
});

// POST /apps/template/api/notes
router.post("/notes", async (req, res) => {
  const user = requireUser(req);
  const { id, text } = req.body as { id: string; text: string };
  const note: Note = { id, text, createdBy: user.id };
  await upsert<Note>(APP_ID, "notes", note);
  res.status(201).json(note);
});

// DELETE /apps/template/api/notes/:id
router.delete("/notes/:id", async (req, res) => {
  requireUser(req);
  await deleteById<Note>(APP_ID, "notes", req.params.id);
  res.status(204).send();
});

export default router;
