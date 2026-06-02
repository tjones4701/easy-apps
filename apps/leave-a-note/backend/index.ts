import { defineBackend } from "../../../lib/action.js";
import { submitNote } from "./actions/submitNote.js";
import { getNotes } from "./actions/getNotes.js";
import { getPendingNotes } from "./actions/getPendingNotes.js";
import { approveNote } from "./actions/approveNote.js";
import { declineNote } from "./actions/declineNote.js";

export default defineBackend({
  actions: [submitNote, getNotes, getPendingNotes, approveNote, declineNote],
});
