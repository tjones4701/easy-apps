export type NoteStatus = "pending" | "approved" | "declined";

export interface Note {
  id: string;
  author: string;
  text: string;
  status: NoteStatus;
  createdAt: string;
  reviewedAt?: string;
}
