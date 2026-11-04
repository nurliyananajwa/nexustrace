"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TEST_RESULT_LABEL, type TestResult } from "@/lib/constants";
import { PageHeader, Empty } from "@/components/ui";
import { recordResult, createTest } from "./actions";

type Test = {
  id: string; code: string; title: string; created_at: string;
  result: TestResult; lastRun: string | null; reqs: { id: string; code: string }[];
};
type Req = { id: string; code: string; title: string };

const FILTERS: (TestResult | "all")[] = ["all", "passed", "failed", "not_run"];

export default function TestsView({ projectId, tests, allReqs }: { projectId: string; tests: Test[]; allReqs: Req[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<TestResult | "all">("all");
  const [modal, setModal] = useState(false);

  const count = (f: TestResult | "all") => f === "all" ? tests.length : tests.filter((t) => t.result === f).length;
  const rows = tests.filter((t) => filter === "all" || t.result === filter);

  return (
    <>
      <PageHeader
        title="Test cases"
        subtitle="Record the result each time you run a test. Coverage and pass rate update straight away, and every run is kept."
        actions={<button className="btn primary" onClick={() => setModal(true)}>+ New test case</button>}
      />

      <div style={{ display: "inline-flex", gap: 2, padding: 3, background: "var(--surface-2)", borderRadius: 9, marginBottom: 12 }}>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              border: "none", cursor: "pointer", borderRadius: 7, padding: "6px 12px", fontSize: 12.5, fontWeight: 600,
              background: filter === f ? "var(--surface)" : "transparent",
              color: filter === f ? "var(--ink)" : "var(--ink-2)",
              boxShadow: filter === f ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
            }}>
            {f === "all" ? "All" : TEST_RESULT_LABEL[f]} <span style={{ color: "var(--ink-3)" }}>{count(f)}</span>
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {rows.length === 0 ? (
          <Empty>No test cases with this result.</Empty>
        ) : (
          <table>
            <thead>
              <tr><th>ID</th><th>Test case</th><th>Checks</th><th>Result</th><th>Last run</th></tr>
            </thead>
            <tbody>
              {rows.map((t) => <TestRow key={t.id} projectId={projectId} test={t} onChange={() => router.refresh()} />)}
            </tbody>
          </table>
        )}
      </div>

      {modal && <NewTestModal projectId={projectId} reqs={allReqs} onClose={() => setModal(false)} onDone={() => { setModal(false); router.refresh(); }} />}
    </>
  );
}

function TestRow({ projectId, test, onChange }: { projectId: string; test: Test; onChange: () => void }) {
  const [pending, start] = useTransition();
  return (
    <tr>
      <td><span className="id">{test.code}</span></td>
      <td style={{ maxWidth: 280 }}>{test.title}</td>
      <td>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {test.reqs.length === 0 ? <span className="pill p-warn">none</span> : test.reqs.map((r) => <span key={r.id} className="id">{r.code}</span>)}
        </div>
      </td>
      <td>
        <select
          className="input"
          style={{ height: 30, width: 110, fontSize: 12.5, opacity: pending ? 0.6 : 1 }}
          value={test.result}
          disabled={pending}
          onChange={(e) => start(async () => { await recordResult(projectId, test.id, e.target.value as TestResult); onChange(); })}
        >
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
          <option value="not_run">Not run</option>
        </select>
      </td>
      <td style={{ color: "var(--ink-3)", fontSize: 12.5, whiteSpace: "nowrap" }}>
        {test.lastRun ? new Date(test.lastRun).toLocaleDateString() : "Never"}
      </td>
    </tr>
  );
}

function NewTestModal({ projectId, reqs, onClose, onDone }: { projectId: string; reqs: Req[]; onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [result, setResult] = useState<TestResult>("not_run");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggle(id: string) {
    setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,25,35,0.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}>
      <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: 500, maxWidth: "100%", padding: 24, maxHeight: "90vh", overflow: "auto" }}>
        <h2 style={{ fontSize: 19, margin: "0 0 16px" }}>New test case</h2>
        <label className="label">What does this test check?</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="For example: Signing in records a session" style={{ margin: "6px 0 14px" }} />

        <label className="label">Requirements it checks</label>
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 8, margin: "6px 0 14px", maxHeight: 180, overflow: "auto" }}>
          {reqs.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: 6 }}>No requirements yet. Add requirements first so a test can be traced to one.</p>
          ) : reqs.map((r) => (
            <label key={r.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 6px", fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={picked.includes(r.id)} onChange={() => toggle(r.id)} />
              <span className="id">{r.code}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
            </label>
          ))}
        </div>

        <label className="label">Result so far</label>
        <select className="input" value={result} onChange={(e) => setResult(e.target.value as TestResult)} style={{ margin: "6px 0 16px" }}>
          <option value="not_run">Not run</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
        </select>

        {err && <p style={{ color: "var(--bad)", fontSize: 12.5 }}>{err}</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={pending || title.trim().length < 3 || picked.length === 0}
            onClick={() => start(async () => {
              const res = await createTest(projectId, { title, requirementIds: picked, result });
              if (res?.error) setErr(res.error); else onDone();
            })}>{pending ? "Saving…" : "Save test case"}</button>
        </div>
        {picked.length === 0 && title.trim().length >= 3 && (
          <p style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 8 }}>Tick at least one requirement so the test is traceable.</p>
        )}
      </div>
    </div>
  );
}
