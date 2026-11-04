"use client";

import { useMemo, useState } from "react";

type Req = { id: string; code: string; title: string };
type Test = { id: string; code: string };
type Link = { test_case_id: string; requirement_id: string };

export default function MatrixView({ reqs, tests, links, taskCount }: {
  reqs: Req[]; tests: Test[]; links: Link[]; taskCount: Record<string, number>;
}) {
  const [gapsOnly, setGapsOnly] = useState(false);

  const linkSet = useMemo(() => new Set(links.map((l) => `${l.requirement_id}:${l.test_case_id}`)), [links]);
  const coveredReqs = useMemo(() => new Set(links.map((l) => l.requirement_id)), [links]);

  const rows = gapsOnly ? reqs.filter((r) => !coveredReqs.has(r.id)) : reqs;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 12, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={gapsOnly} onChange={(e) => setGapsOnly(e.target.checked)} />
          Show gaps only
        </label>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ink-2)" }}>
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--brand)" }} /> Test checks it
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ink-2)" }}>
          <span style={{ width: 13, height: 13, borderRadius: 3, background: "var(--warn-tint)", border: "1px solid var(--warn)" }} /> No test yet
        </span>
      </div>

      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        {tests.length === 0 ? (
          <div style={{ padding: 28, textAlign: "center", color: "var(--ink-3)", fontSize: 13.5 }}>
            No test cases yet. Create test cases and link them to requirements.
          </div>
        ) : (
          <table style={{ minWidth: 520 }}>
            <thead>
              <tr>
                <th style={{ position: "sticky", left: 0, background: "var(--surface)" }}>Requirement</th>
                {tests.map((t) => (
                  <th key={t.id} style={{ textAlign: "center", padding: "10px 6px", whiteSpace: "nowrap" }}>{t.code}</th>
                ))}
                <th style={{ textAlign: "center" }}>Tasks</th>
                <th style={{ textAlign: "center" }}>Covered</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const covered = coveredReqs.has(r.id);
                return (
                  <tr key={r.id} style={{ background: covered ? undefined : "var(--warn-tint)" }}>
                    <td style={{ position: "sticky", left: 0, background: covered ? "var(--surface)" : "var(--warn-tint)", whiteSpace: "nowrap" }}>
                      <span className="id">{r.code}</span>
                    </td>
                    {tests.map((t) => (
                      <td key={t.id} style={{ textAlign: "center" }}>
                        {linkSet.has(`${r.id}:${t.id}`)
                          ? <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "var(--brand)" }} />
                          : <span style={{ display: "inline-block", width: 4, height: 4, borderRadius: "50%", background: "var(--border-strong)" }} />}
                      </td>
                    ))}
                    <td style={{ textAlign: "center", fontSize: 12.5 }}>{taskCount[r.id] ?? 0}</td>
                    <td style={{ textAlign: "center" }}>
                      {covered
                        ? <span style={{ color: "var(--good)" }}>✓</span>
                        : <span style={{ color: "var(--warn)", fontWeight: 700 }}>!</span>}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={tests.length + 3} style={{ textAlign: "center", color: "var(--good)", padding: 24 }}>Every requirement has a test. No gaps.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
