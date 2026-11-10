"use client";

import { REQ_STATUS_LABEL, PRIORITY_LABEL } from "@/lib/constants";
import { checkQuality, GRADE_LABEL } from "@/lib/quality";
import { StatusPill } from "@/components/ui";
import Highlighted from "@/components/Highlighted";
import type { Req, Test, Link, Task, Version } from "./types";

// Right-hand panel for the selected requirement: wording, quality, links, history.
export default function DetailPanel({ req, tests, links, tasks, versions, onClose, onTask, onLink, onPropose }: {
  req: Req; tests: Test[]; links: Link[]; tasks: Task[]; versions: Version[];
  onClose: () => void; onTask: () => void; onLink: () => void; onPropose: () => void;
}) {
  const qr = checkQuality(`${req.title}. ${req.description ?? ""}`);
  const linkedTestIds = links.filter((l) => l.requirement_id === req.id).map((l) => l.test_case_id);
  const linkedTests = tests.filter((t) => linkedTestIds.includes(t.id));

  return (
    <div className="card detail-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="id" style={{ fontSize: 14 }}>{req.code}</span>
          <StatusPill value={req.status} label={REQ_STATUS_LABEL[req.status as keyof typeof REQ_STATUS_LABEL] ?? req.status} />
        </div>
        <button className="btn sm" onClick={onClose}>Close</button>
      </div>

      <h3 style={{ fontSize: 15, margin: "4px 0 8px" }}>{req.title}</h3>
      <div style={{ background: "var(--surface-2)", borderRadius: 8, padding: 12, fontSize: 13, lineHeight: 1.6 }}>
        <Highlighted text={req.description || "(no description)"} words={qr.flagged} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0" }}>
        <StatusPill value={qr.grade} label={`Quality ${qr.score} · ${GRADE_LABEL[qr.grade]}`} />
        <span className="pill p-mute">{PRIORITY_LABEL[req.priority as keyof typeof PRIORITY_LABEL] ?? req.priority}</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className="btn sm" onClick={onTask}>Add task</button>
        <button className="btn sm" onClick={onLink}>Link a test</button>
      </div>

      <div className="label" style={{ marginBottom: 6 }}>Linked tasks and tests</div>
      {tasks.length === 0 && linkedTests.length === 0 ? (
        <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "0 0 14px" }}>Nothing linked yet.</p>
      ) : (
        <ul style={{ margin: "0 0 14px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {tasks.map((t) => (
            <li key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
              <span className="pill p-mute">Task</span>
              <span style={{ flex: 1 }}>{t.title}</span>
              <span style={{ color: "var(--ink-3)" }}>{t.status}</span>
            </li>
          ))}
          {linkedTests.map((t) => (
            <li key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
              <span className="pill p-info">Test</span>
              <span className="id">{t.code}</span>
              <span style={{ flex: 1 }}>{t.title}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="label" style={{ marginBottom: 6 }}>Version history</div>
      <ul style={{ margin: "0 0 16px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
        {versions.map((v) => (
          <li key={v.id} style={{ display: "flex", gap: 8, fontSize: 12.5 }}>
            <b>v{v.version}</b>
            <span style={{ flex: 1, color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</span>
            <span style={{ color: "var(--ink-3)" }}>{new Date(v.created_at).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>

      <button className="btn primary" style={{ width: "100%" }} onClick={onPropose}>Propose a change</button>
    </div>
  );
}
