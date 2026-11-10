"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { REQ_STATUS, REQ_STATUS_LABEL, type Role } from "@/lib/constants";
import { checkQuality } from "@/lib/quality";
import { StatusPill, Empty } from "@/components/ui";
import CircuitView from "@/components/CircuitView";
import DetailPanel from "./DetailPanel";
import NewRequirementModal from "./NewRequirementModal";
import AddTaskModal from "./AddTaskModal";
import LinkTestModal from "./LinkTestModal";
import ProposeChangeModal from "./ProposeChangeModal";
import type { Req, Mod, Test, Link, Task, Version } from "./types";

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
  const done = () => { setModal(null); router.refresh(); };

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
        <NewRequirementModal projectId={projectId} modules={modules} onClose={() => setModal(null)} onDone={done} />
      )}
      {modal === "task" && selected && (
        <AddTaskModal projectId={projectId} requirementId={selected.id} requirementCode={selected.code}
          onClose={() => setModal(null)} onDone={done} />
      )}
      {modal === "link" && selected && (
        <LinkTestModal projectId={projectId} requirementId={selected.id}
          tests={tests.filter((t) => !(testsByReq.get(selected.id) ?? []).includes(t.id))}
          onClose={() => setModal(null)} onDone={done} />
      )}
      {modal === "propose" && selected && (
        <ProposeChangeModal projectId={projectId} req={selected} onClose={() => setModal(null)} onDone={done} />
      )}
    </>
  );
}

