# Leave a Note

A moderated public message board. Anyone can submit a note; users with the `admin` role review the queue and approve or decline submissions before they appear on the board.

---

## How it works

1. A visitor fills in their name and a message using the submit form.
2. The note is saved with status `pending` and does **not** appear on the public board yet.
3. An admin opens the admin panel (visible automatically if they have the `admin` role) and approves or declines each pending note.
4. Approved notes appear on the board in reverse-chronological order.

---

## Roles

| Role              | Access                                                  |
| ----------------- | ------------------------------------------------------- |
| _(none / public)_ | Submit notes, view the approved board                   |
| `admin`           | Everything above + view pending queue, approve, decline |

Roles are managed at the platform level via the MCP tools `set_user_membership` or `create_group` / `add_group_member`. There is no in-app role management UI.

---

## Backend actions

All actions live in `backend/actions/`. They are registered in `backend/index.ts` and mounted automatically at `/apps/leave-a-note/api/actions/<name>`.

| Action            | Auth    | Input              | Description                                |
| ----------------- | ------- | ------------------ | ------------------------------------------ |
| `submitNote`      | public  | `{ author, text }` | Creates a note with status `pending`       |
| `getNotes`        | public  | `{}`               | Returns all `approved` notes, newest first |
| `getPendingNotes` | `admin` | `{}`               | Returns all `pending` notes, oldest first  |
| `approveNote`     | `admin` | `{ id }`           | Sets a note's status to `approved`         |
| `declineNote`     | `admin` | `{ id }`           | Sets a note's status to `declined`         |

---

## Data

Stored in `data/leave-a-note/notes.json` as a flat JSON array. Each record matches the `Note` interface:

```ts
interface Note {
  id: string; // UUID
  author: string;
  text: string;
  status: "pending" | "approved" | "declined";
  createdAt: string; // ISO 8601
  reviewedAt?: string;
}
```

---

## Frontend components

| Component    | Path                               | Purpose                                      |
| ------------ | ---------------------------------- | -------------------------------------------- |
| `SubmitForm` | `frontend/components/submit-form/` | Author + message form, character counter     |
| `NoteCard`   | `frontend/components/note-card/`   | Displays a single approved note              |
| `AdminPanel` | `frontend/components/admin-panel/` | Pending queue with approve / decline buttons |

The admin panel is only rendered when `useHasRole("leave-a-note", "admin")` returns `true`. The button to enter it is hidden from non-admins entirely.

---

## Key imports used in this app

```ts
// Backend
import { defineAction } from "../../../../lib/action.js";
import { readCollection, upsert } from "../../../../lib/data.js";

// Frontend
import { callAction } from "#apps-lib/callAction";
import { useHasRole } from "#apps-lib/hooks/useRoles";
```
