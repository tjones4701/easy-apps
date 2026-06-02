import { useState } from "react";
import styles from "./submit-form.module.scss";

interface SubmitFormProps {
    onSubmit: (author: string, text: string) => Promise<void>;
}

export default function SubmitForm({ onSubmit }: SubmitFormProps) {
    const [author, setAuthor] = useState("");
    const [text, setText] = useState("");
    const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setStatus("submitting");
        setErrorMsg("");
        try {
            await onSubmit(author.trim(), text.trim());
            setAuthor("");
            setText("");
            setStatus("done");
            setTimeout(() => setStatus("idle"), 3000);
        } catch (err: any) {
            setErrorMsg(err.message ?? "Something went wrong.");
            setStatus("error");
        }
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.heading}>Leave a note</h2>
            <input
                className={styles.input}
                type="text"
                placeholder="Your name"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                maxLength={100}
                disabled={status === "submitting"}
            />
            <textarea
                className={styles.textarea}
                placeholder="Write your note..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                maxLength={1000}
                rows={4}
                disabled={status === "submitting"}
            />
            <div className={styles.footer}>
                <span className={styles.charCount}>{text.length} / 1000</span>
                <button
                    className={styles.button}
                    type="submit"
                    disabled={status === "submitting" || !author.trim() || !text.trim()}
                >
                    {status === "submitting" ? "Posting..." : "Post note"}
                </button>
            </div>
            {status === "done" && (
                <p className={styles.success}>Note submitted — it will appear after review.</p>
            )}
            {status === "error" && <p className={styles.error}>{errorMsg}</p>}
        </form>
    );
}
