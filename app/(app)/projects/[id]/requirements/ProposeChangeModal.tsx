"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal";
import { proposeChange } from "./actions";
import type { Req } from "./types";

// Sends a change request for the supervisor to approve or reject.
export default function ProposeChangeModal({ projectId, req, onClose, onDone }: {
  projectId: string; req: Req; onClose: () => void; onDone: () => void;
}) {
  const [title, setTitle] = useState(req.title);
  const [description, setDescription] = useState(req.description || "");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Modal title={`Propose a change to ${req.code}`} onClose={onClose} width={520}>
      <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: "0 0 14px" }}>
        Your supervisor will see the impact and approve or reject. The current wording is kept as a version.
      </p>
      <label className="label">Proposed title</label>
      <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} style={{ margin: "6px 0 12px" }} />
      <label className="label">Proposed description</label>
      <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ margin: "6px 0 12px" }} />
      <label className="label">Reason for the change</label>
      <textarea className="input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this change needed?" style={{ margin: "6px 0 14px" }} />
      {err && <p style={{ color: "var(--bad)", fontSize: 12.5 }}>{err}</p>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={pending || reason.trim().length < 5 || title.trim().length < 3} onClick={() => start(async () => {
          const res = await proposeChange(projectId, req.id, { proposed_title: title, proposed_description: description, reason });
          if (res?.error) setErr(res.error); else onDone();
        })}>{pending ? "Sending…" : "Send change request"}</button>
      </div>
    </Modal>
  );
}
