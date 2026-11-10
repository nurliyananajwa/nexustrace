"use client";

import { useState, useTransition } from "react";
import { PRIORITY_LABEL } from "@/lib/constants";
import { checkQuality, GRADE_LABEL } from "@/lib/quality";
import { StatusPill } from "@/components/ui";
import Modal from "@/components/Modal";
import { createRequirement } from "./actions";
import type { Mod } from "./types";

// Form for a new requirement, with the live quality score while typing.
export default function NewRequirementModal({ projectId, modules, onClose, onDone }: {
  projectId: string; modules: Mod[]; onClose: () => void; onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"functional" | "non_functional">("functional");
  const [priority, setPriority] = useState("should");
  const [moduleId, setModuleId] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const qr = checkQuality(`${title}. ${description}`);

  return (
    <Modal title="New requirement" onClose={onClose} width={520}>
      <label className="label">Title</label>
      <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The system must…" style={{ margin: "6px 0 12px" }} />
      <label className="label">Description</label>
      <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ margin: "6px 0 6px" }} />
      {(title + description).trim() && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <StatusPill value={qr.grade} label={`Quality ${qr.score} · ${GRADE_LABEL[qr.grade]}`} />
          {qr.issues[0] && <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{qr.issues[0].message}</span>}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label className="label">Type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as "functional" | "non_functional")} style={{ marginTop: 6 }}>
            <option value="functional">Functional (FR)</option>
            <option value="non_functional">Non-functional (NFR)</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className="label">Priority</label>
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)} style={{ marginTop: 6 }}>
            {Object.entries(PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      {modules.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <label className="label">Module</label>
          <select className="input" value={moduleId} onChange={(e) => setModuleId(e.target.value)} style={{ marginTop: 6 }}>
            <option value="">(none)</option>
            {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      )}
      {err && <p style={{ color: "var(--bad)", fontSize: 12.5 }}>{err}</p>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={pending || title.trim().length < 3} onClick={() => start(async () => {
          const res = await createRequirement(projectId, { title, description, type, priority, module_id: moduleId || null });
          if (res?.error) setErr(res.error); else onDone();
        })}>{pending ? "Saving…" : "Save requirement"}</button>
      </div>
    </Modal>
  );
}
