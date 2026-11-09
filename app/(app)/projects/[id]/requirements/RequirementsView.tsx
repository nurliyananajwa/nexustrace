"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Tables } from "@/lib/supabase/database.types";
import {
  REQ_STATUS, REQ_STATUS_LABEL, PRIORITY_LABEL, type Role,
} from "@/lib/constants";
import { checkQuality, GRADE_LABEL } from "@/lib/quality";
import { StatusPill, Empty } from "@/components/ui";
import { createRequirement, addTask, linkTest, proposeChange } from "./actions";
import CircuitView from "./CircuitView";

type Req = Tables<"requirements">;
type Mod = Tables<"modules">;
type Test = { id: string; code: string; title: string; result: string };
type Link = { test_case_id: string; requirement_id: string };
type Task = { id: string; title: string; status: string; requirement_id: string | null };
type Version = { id: string; requirement_id: string; version: number; title: string; created_at: string };

export default function RequirementsView(props: {
  projectId: string;
  role: Role;
  requirements: Req[];
  modules: Mod[];
  tests: Test[];
  links: Link[];
  tasks: Task[];
  versions: Version[];
}) {
  const { projectId, requirements, modules, tests, links, tasks, versions } = props;
  const router = useRouter();
  const search = useSearchParams();
  const [q, setQ] = useState("");
  const [mod, setMod] = useState("all");
  const [status, setStatus] = useState("all");
  const [selId, setSelId] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "new" | "propose" | "task" | "link">(null);
  const [mode, setMode] = useState<"list" | "visual">("list");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const open = search.get("open");
    if (open) setSelId(open);
  }, [search]);

  const testsByReq = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const l of links) {
      const arr = m.get(l.requirement_id) ?? [];
      arr.push(l.test_case_id);
      m.set(l.requirement_id, arr);
    }
    return m;
  }, [links]);

  const filtered = requirements.filter((r) => {
    if (mod !== "all" && r.module_id !== mod) return false;
    if (status !== "all" && r.status !== status) return false;
    if (q && !`${r.code} ${r.title} ${r.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const selected = requirements.find((r) => r.id === selId) || null;

  return (
    <>
      <header className="page-heading">
        <div><p className="page-kicker">REQUIREMENTS</p><h1 className="page-title">The source of every trace.</h1><p className="page-lead">Write what the system must do, then connect the work and tests that support it.</p></div>
        <button className="btn primary" onClick={() => setModal("new")}>+ New requirement</button>
      </header>

      <div className="toolbar">
        <div className="mode-switch" role="group" aria-label="Requirement view">
          <button className={mode === "list" ? "active" : ""} aria-pressed={mode === "list"} onClick={() => setMode("list")}>▦ &nbsp; Card view</button>
          <button className={mode === "visual" ? "active" : ""} aria-pressed={mode === "visual"} onClick={() => setMode("visual")}>⌁ &nbsp; Circuit view</button>
        </div>
        <input className="input search" aria-label="Search requirements" placeholder="Search by ID or title" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" aria-label="Filter by module" value={mod} onChange={(e) => setMod(e.target.value)}><option value="all">All modules</option>{modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        <select className="input" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option>{REQ_STATUS.map((s) => <option key={s} value={s}>{REQ_STATUS_LABEL[s]}</option>)}</select>
      </div>

      <div className={`data-layout ${selected ? "" : "no-selection"} ${mode === "visual" ? "visual-mode" : ""}`}>
        <div>
          {mode === "visual" ? <CircuitView requirements={filtered} tasks={tasks} tests={tests} links={links} selectedId={selId} onSelect={setSelId} /> : <div className="req-grid">
            {filtered.length === 0 ? (
              <Empty>No requirements yet. Add your first with “New requirement”.</Empty>
            ) : (
              filtered.map((r) => {
                    const qr = checkQuality(`${r.title}. ${r.description ?? ""}`);
                    const nTests = testsByReq.get(r.id)?.length ?? 0;
                    const nTasks = tasks.filter((task) => task.requirement_id === r.id).length;
                    return (
                      <button type="button" key={r.id} onClick={() => setSelId(r.id)} className={`req-tile ${r.id === selId ? "selected" : ""}`} aria-pressed={r.id === selId}>
                        <span className="req-tile-top"><span className="id">{r.code}</span><StatusPill value={r.status} label={REQ_STATUS_LABEL[r.status as keyof typeof REQ_STATUS_LABEL] ?? r.status} /></span>
                        <strong>{r.title}</strong>
                        <span className="req-tile-bottom"><span>{nTasks} task{nTasks === 1 ? "" : "s"}</span><span className={nTests === 0 ? "missing-link" : ""}>{nTests} test{nTests === 1 ? "" : "s"}</span><span>Quality {qr.score}</span></span>
                      </button>
                    );
                  })
            )}</div>}
        </div>

        {selected && (
          <DetailPanel
            key={selected.id}
            req={selected}
            tests={tests}
            links={links}
            tasks={tasks.filter((t) => t.requirement_id === selected.id)}
            versions={versions.filter((v) => v.requirement_id === selected.id)}
            onClose={() => setSelId(null)}
            onTask={() => setModal("task")}
            onLink={() => setModal("link")}
            onPropose={() => setModal("propose")}
          />
        )}
      </div>

      {modal === "new" && (
        <NewRequirementModal projectId={projectId} modules={modules} onClose={() => setModal(null)}
          onDone={() => { setModal(null); router.refresh(); }} />
      )}
      {modal === "task" && selected && (
        <SimpleModal title={`Add a task to ${selected.code}`} label="Task title"
          placeholder="For example: Build the sign-in page"
          onClose={() => setModal(null)}
          onSubmit={async (v) => { const result = await addTask(projectId, selected.id, v); if (result.error) { setError(result.error); return; } setError(null); setModal(null); router.refresh(); }} />
      )}
      {modal === "link" && selected && (
        <LinkTestModal projectId={projectId} requirementId={selected.id}
          tests={tests.filter((t) => !(testsByReq.get(selected.id) ?? []).includes(t.id))}
          onClose={() => setModal(null)} onDone={() => { setModal(null); router.refresh(); }} />
      )}
      {modal === "propose" && selected && (
        <ProposeModal projectId={projectId} req={selected}
          onClose={() => setModal(null)} onDone={() => { setModal(null); router.refresh(); }} />
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </>
  );
}

function DetailPanel({ req, tests, links, tasks, versions, onClose, onTask, onLink, onPropose }: {
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

function Highlighted({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>;
  const esc = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`\\b(${esc.join("|")})\\b`, "gi");
  return <>{text.split(re).map((p, i) => words.some((w) => w.toLowerCase() === p.toLowerCase()) ? <span key={i} className="hl">{p}</span> : <span key={i}>{p}</span>)}</>;
}

function Modal({ title, children, onClose, width = 460 }: { title: string; children: React.ReactNode; onClose: () => void; width?: number }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,25,35,0.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}>
      <div className="card" onClick={(e) => e.stopPropagation()} style={{ width, maxWidth: "100%", padding: 24, maxHeight: "90vh", overflow: "auto" }}>
        <h2 style={{ fontSize: 19, margin: "0 0 16px" }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function NewRequirementModal({ projectId, modules, onClose, onDone }: { projectId: string; modules: Mod[]; onClose: () => void; onDone: () => void }) {
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

function SimpleModal({ title, label, placeholder, onClose, onSubmit }: { title: string; label: string; placeholder: string; onClose: () => void; onSubmit: (v: string) => Promise<void> }) {
  const [v, setV] = useState("");
  const [pending, start] = useTransition();
  return (
    <Modal title={title} onClose={onClose}>
      <label className="label">{label}</label>
      <input className="input" value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} style={{ margin: "6px 0 16px" }} autoFocus />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={pending || v.trim().length < 3} onClick={() => start(async () => { await onSubmit(v); })}>{pending ? "Saving…" : "Save"}</button>
      </div>
    </Modal>
  );
}

function LinkTestModal({ projectId, requirementId, tests, onClose, onDone }: { projectId: string; requirementId: string; tests: Test[]; onClose: () => void; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <Modal title="Link a test" onClose={onClose}>
      {tests.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--ink-2)" }}>Every test is already linked, or none exist yet. Create test cases on the Test cases screen first.</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
          {tests.map((t) => (
            <li key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="id">{t.code}</span>
              <span style={{ flex: 1, fontSize: 13 }}>{t.title}</span>
              <button className="btn sm" disabled={pending} onClick={() => start(async () => {
                const r = await linkTest(projectId, requirementId, t.id); if (r?.error) setErr(r.error); else onDone();
              })}>Link</button>
            </li>
          ))}
        </ul>
      )}
      {err && <p style={{ color: "var(--bad)", fontSize: 12.5, marginTop: 10 }}>{err}</p>}
    </Modal>
  );
}

function ProposeModal({ projectId, req, onClose, onDone }: { projectId: string; req: Req; onClose: () => void; onDone: () => void }) {
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
