import { useState, useEffect, useCallback } from "react";
import { callAction } from "#apps-lib/callAction";
import NoteCard from "../note-card/note-card";
import styles from "./admin-panel.module.scss";
import type { Note } from "../../../backend/models/note";

const APP_ID = "leave-a-note";

export default function AdminPanel() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const result = await callAction<Note[]>(APP_ID, "getPendingNotes", {});
            setNotes(result);
        } catch (err: any) {
            setError(err.message ?? "Failed to load pending notes.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    async function handleApprove(id: string) {
        await callAction(APP_ID, "approveNote", { id });
        setNotes((prev) => prev.filter((n) => n.id !== id));
    }

    async function handleDecline(id: string) {
        await callAction(APP_ID, "declineNote", { id });
        setNotes((prev) => prev.filter((n) => n.id !== id));
    }

    if (loading) return <p className={styles.state}>Loading pending notes...</p>;
    if (error) return <p className={`${styles.state} ${styles.error}`}>{error}</p>;

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <h2 className={styles.heading}>Review queue</h2>
                <span className={styles.badge}>{notes.length}</span>
                <button className={styles.refresh} onClick={load} title="Refresh">↻</button>
            </div>
            {notes.length === 0 ? (
                <p className={styles.state}>No notes pending review.</p>
            ) : (
                <div className={styles.list}>
                    {notes.map((note) => (
                        <div key={note.id} className={styles.item}>
                            <NoteCard note={note} />
                            <div className={styles.actions}>
                                <button
                                    className={`${styles.btn} ${styles.approve}`}
                                    onClick={() => handleApprove(note.id)}
                                >
                                    Approve
                                </button>
                                <button
                                    className={`${styles.btn} ${styles.decline}`}
                                    onClick={() => handleDecline(note.id)}
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
