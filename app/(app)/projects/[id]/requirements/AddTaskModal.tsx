"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal";
import { addTask } from "./actions";

// Adds a task that builds the given requirement.
export default function AddTaskModal({ projectId, requirementId, requirementCode, onClose, onDone }: {
  projectId: string; requirementId: string; requirementCode: string; onClose: () => void; onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Modal title={`Add a task to ${requirementCode}`} onClose={onClose}>
      <label className="label">Task title</label>
      <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="For example: Build the sign-in page" style={{ margin: "6px 0 16px" }} autoFocus />
      {err && <p style={{ color: "var(--bad)", fontSize: 12.5 }}>{err}</p>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={pending || title.trim().length < 3} onClick={() => start(async () => {
          const res = await addTask(projectId, requirementId, title);
          if (res.error) setErr(res.error); else onDone();
        })}>{pending ? "Saving…" : "Save"}</button>
      </div>
    </Modal>
  );
}
