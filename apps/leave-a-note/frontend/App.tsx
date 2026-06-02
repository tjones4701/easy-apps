import { useState, useEffect, useCallback } from "react";
import { callAction } from "#apps-lib/callAction";
import { useHasRole } from "#apps-lib/hooks/useRoles";
import NoteCard from "./components/note-card/note-card";
import SubmitForm from "./components/submit-form/submit-form";
import AdminPanel from "./components/admin-panel/admin-panel";
import styles from "./App.module.scss";
import type { Note } from "../backend/models/note";

const APP_ID = "leave-a-note";

export default function App() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdmin, setShowAdmin] = useState(false);
    const isAdmin = useHasRole(APP_ID, "admin");

    const loadNotes = useCallback(async () => {
        setLoading(true);
        try {
            const result = await callAction<Note[]>(APP_ID, "getNotes", {});
            setNotes(result);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadNotes(); }, [loadNotes]);

    // Close admin panel if user loses the admin role
    useEffect(() => {
        if (!isAdmin) setShowAdmin(false);
    }, [isAdmin]);

    async function handleSubmit(author: string, text: string) {
        await callAction(APP_ID, "submitNote", { author, text });
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Note Board</h1>
                {isAdmin && (
                    <button className={styles.adminToggle} onClick={() => setShowAdmin((v) => !v)}>
                        {showAdmin ? "Exit admin" : "Admin"}
                    </button>
                )}
            </header>

            <main className={styles.main}>
                {showAdmin && isAdmin ? (
                    <AdminPanel />
                ) : (
                    <>
                        <SubmitForm onSubmit={handleSubmit} />
                        <section className={styles.feed}>
                            <div className={styles.feedHeader}>
                                <h2 className={styles.feedTitle}>Board</h2>
                                <button className={styles.refresh} onClick={loadNotes} title="Refresh">↻</button>
                            </div>
                            {loading ? (
                                <p className={styles.state}>Loading notes...</p>
                            ) : notes.length === 0 ? (
                                <p className={styles.state}>No notes yet. Be the first!</p>
                            ) : (
                                <div className={styles.noteList}>
                                    {notes.map((note) => (
                                        <NoteCard key={note.id} note={note} />
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
