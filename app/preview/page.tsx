"use client";

import { useState } from "react";
import Link from "next/link";
import CircuitView from "@/components/CircuitView";

type Requirement = { id: string; code: string; title: string; status: string };
type Task = { id: string; requirement_id: string; title: string; status: string };
type Test = { id: string; code: string; title: string; result: string };
type LinkRow = { requirement_id: string; test_case_id: string };

const initialReqs: Requirement[] = [
  { id: "r1", code: "FR01", title: "Users can create a project workspace", status: "approved" },
  { id: "r2", code: "FR02", title: "Members can record requirements", status: "implemented" },
  { id: "r3", code: "FR03", title: "Each requirement links to a test", status: "draft" },
  { id: "r4", code: "FR04", title: "Leads can review proposed changes", status: "approved" },
  { id: "r5", code: "NFR01", title: "The interface remains usable on mobile", status: "draft" },
];
const initialTasks: Task[] = [
  { id: "t1", requirement_id: "r1", title: "Build project creation flow", status: "done" },
  { id: "t2", requirement_id: "r2", title: "Create requirement form", status: "done" },
  { id: "t3", requirement_id: "r3", title: "Build test linking", status: "in_progress" },
  { id: "t4", requirement_id: "r4", title: "Create approval flow", status: "todo" },
];
const initialTests: Test[] = [
  { id: "c1", code: "TC01", title: "Project is created", result: "passed" },
  { id: "c2", code: "TC02", title: "Requirement is saved", result: "passed" },
  { id: "c3", code: "TC03", title: "Linked test is visible", result: "failed" },
  { id: "c4", code: "TC04", title: "Change is reviewed", result: "not_run" },
];
const initialLinks: LinkRow[] = [{ requirement_id: "r1", test_case_id: "c1" }, { requirement_id: "r2", test_case_id: "c2" }, { requirement_id: "r3", test_case_id: "c3" }, { requirement_id: "r4", test_case_id: "c4" }];

export default function PreviewPage() {
  const [reqs, setReqs] = useState(initialReqs);
  const [tasks, setTasks] = useState(initialTasks);
  const [tests, setTests] = useState(initialTests);
  const [links, setLinks] = useState(initialLinks);
  const [mode, setMode] = useState<"list" | "visual">("list");
  const [selectedId, setSelectedId] = useState<string | null>("r3");
  const [query, setQuery] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [activeSection, setActiveSection] = useState<"overview" | "requirements" | "tests">("requirements");
  const visible = reqs.filter((req) => `${req.code} ${req.title}`.toLowerCase().includes(query.toLowerCase()));
  const selected = reqs.find((req) => req.id === selectedId);
  const linkedTasks = tasks.filter((task) => task.requirement_id === selectedId);
  const linkedTests = tests.filter((test) => links.some((link) => link.requirement_id === selectedId && link.test_case_id === test.id));
  const coverage = reqs.length ? Math.round(new Set(links.map((link) => link.requirement_id)).size / reqs.length * 100) : 0;

  function addRequirement() {
    if (newTitle.trim().length < 3) return;
    const id = `r${Date.now()}`;
    const req = { id, code: `FR${String(reqs.length + 1).padStart(2, "0")}`, title: newTitle.trim(), status: "draft" };
    setReqs((current) => [...current, req]);
    setSelectedId(id);
    setNewTitle("");
    setAdding(false);
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="brand-mark"><i /><i /><i /></span><span>Nexus<span className="brand-accent">Trace</span><small>PROJECT WORKSPACE</small></span></Link>
      <div className="project-picker"><span className="eyebrow">DESIGN PREVIEW</span><div style={{ fontWeight: 700, marginTop: 8 }}>Sample FYP project</div><span className="project-caption">Try the two viewing modes</span></div>
      <nav className="side-nav" aria-label="Preview navigation"><div className="nav-section"><div className="eyebrow nav-caption">Workspace</div>
        {([ ["overview","Overview"],["requirements","Requirements"],["tests","Test cases"] ] as const).map(([key,label]) => <button key={key} className={`nav-link preview-nav ${activeSection === key ? "active" : ""}`} onClick={() => setActiveSection(key)}><span className={`nav-glyph glyph-${key === "overview" ? "dashboard" : key}`} />{label}</button>)}
      </div></nav><div className="side-bottom"><p style={{ color: "var(--ink-3)", fontSize: 11 }}>Sample data for design review</p><Link className="btn primary" href="/signin">Open real workspace</Link></div>
    </aside>
    <main className="main-content">
      <div className="preview-banner">INTERACTIVE DESIGN PREVIEW <span>Changes here stay in this browser session. The real workspace uses reqweave.</span></div>
      {activeSection === "overview" ? <><header className="page-heading"><div><p className="page-kicker">PROJECT OVERVIEW</p><h1 className="page-title">See what connects.</h1><p className="page-lead">Follow each requirement through the work and tests that prove it is ready.</p></div></header><section className="metric-grid">{[["Requirements",reqs.length],["Test coverage",`${coverage}%`],["Tasks complete",`${tasks.filter((task) => task.status === "done").length}/${tasks.length}`],["Changes awaiting review",0]].map(([label,value]) => <div className="card metric" key={label}><small>{label}</small><strong>{value}</strong></div>)}</section><section className="card overview-panel"><h2 className="section-title">Your path through the project</h2><ol className="step-list"><li><span className="step-number">1</span><strong>Write a requirement</strong></li><li><span className="step-number">2</span><strong>Connect the work</strong></li><li><span className="step-number">3</span><strong>Prove it with a test</strong></li></ol></section></> : activeSection === "tests" ? <><header className="page-heading"><div><p className="page-kicker">TEST CASES</p><h1 className="page-title">Prove the requirements.</h1><p className="page-lead">Test results tell the team what is ready and what needs work.</p></div></header><div className="card data-table-wrap"><table><thead><tr><th>ID</th><th>Test case</th><th>Result</th></tr></thead><tbody>{tests.map((test) => <tr key={test.id}><td className="id">{test.code}</td><td>{test.title}</td><td><select className="input" aria-label={`Result for ${test.code}`} value={test.result} onChange={(event) => setTests((current) => current.map((item) => item.id === test.id ? { ...item, result: event.target.value } : item))}><option value="not_run">Not run</option><option value="passed">Passed</option><option value="failed">Failed</option></select></td></tr>)}</tbody></table></div></> : <>
        <header className="page-heading"><div><p className="page-kicker">REQUIREMENTS</p><h1 className="page-title">The source of every trace.</h1><p className="page-lead">Write what the system must do, then connect the work and tests that support it.</p></div><button className="btn primary" onClick={() => setAdding(true)}>+ New requirement</button></header>
        <div className="toolbar"><div className="mode-switch" role="group" aria-label="Requirement view"><button className={mode === "list" ? "active" : ""} onClick={() => setMode("list")}>▦ &nbsp; Card view</button><button className={mode === "visual" ? "active" : ""} onClick={() => setMode("visual")}>⌁ &nbsp; Circuit view</button></div><input className="input search" aria-label="Search requirements" placeholder="Search by ID or title" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className={`data-layout ${selected ? "" : "no-selection"} ${mode === "visual" ? "visual-mode" : ""}`}>
          <div>{mode === "visual" ? <CircuitView requirements={visible} tasks={tasks} tests={tests} links={links} selectedId={selectedId} onSelect={setSelectedId} /> : <div className="req-grid">{visible.map((req) => {
            const taskCount = tasks.filter((task) => task.requirement_id === req.id).length;
            const testCount = links.filter((link) => link.requirement_id === req.id).length;
            return <button type="button" className={`req-tile ${selectedId === req.id ? "selected" : ""}`} key={req.id} onClick={() => setSelectedId(req.id)}><span className="req-tile-top"><span className="id">{req.code}</span><span className="pill p-info">{req.status}</span></span><strong>{req.title}</strong><span className="req-tile-bottom"><span>{taskCount} tasks</span><span className={testCount === 0 ? "missing-link" : ""}>{testCount} tests</span></span></button>;
          })}</div>}</div>
          {selected && <aside className="card detail-panel"><div className="id">{selected.code}</div><h2>{selected.title}</h2><span className="pill p-info">{selected.status}</span><div className="detail-section"><h3>Connected tasks</h3><ul className="detail-items">{linkedTasks.map((task) => <li key={task.id}>• {task.title}</li>)}{linkedTasks.length === 0 && <li>Nothing linked yet.</li>}</ul><button className="btn sm" onClick={() => setTasks((current) => [...current,{ id: `t${Date.now()}`, requirement_id: selected.id, title: `New task for ${selected.code}`, status: "todo" }])}>+ Add sample task</button></div><div className="detail-section"><h3>Linked tests</h3><ul className="detail-items">{linkedTests.map((test) => <li key={test.id}>{test.code} · {test.title}</li>)}{linkedTests.length === 0 && <li>No linked test yet.</li>}</ul>{tests.some((test) => !linkedTests.includes(test)) && <button className="btn sm" onClick={() => { const available = tests.find((test) => !linkedTests.includes(test)); if (available) setLinks((current) => [...current,{ requirement_id: selected.id, test_case_id: available.id }]); }}>+ Link sample test</button>}</div></aside>}
        </div>
      </>}
      {adding && <div className="modal-backdrop" onClick={() => setAdding(false)}><div className="modal-box" onClick={(event) => event.stopPropagation()}><h2>New requirement</h2><div className="form-field"><label htmlFor="preview-title">Title</label><input id="preview-title" autoFocus className="input" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addRequirement(); }} placeholder="The system must…" /></div><div className="form-actions"><button className="btn" onClick={() => setAdding(false)}>Cancel</button><button className="btn primary" disabled={newTitle.trim().length < 3} onClick={addRequirement}>Add requirement</button></div></div></div>}
    </main>
  </div>;
}
