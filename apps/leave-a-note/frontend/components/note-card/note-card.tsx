import styles from "./note-card.module.scss";
import type { Note } from "../../../backend/models/note";

interface NoteCardProps {
    note: Note;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

export default function NoteCard({ note }: NoteCardProps) {
    return (
        <div className={styles.card}>
            <p className={styles.text}>{note.text}</p>
            <div className={styles.meta}>
                <span className={styles.author}>{note.author}</span>
                <span className={styles.date}>{formatDate(note.createdAt)}</span>
            </div>
        </div>
    );
}
