"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal";
import { linkTest } from "./actions";
import type { Test } from "./types";

// Links an existing test case to the requirement. `tests` excludes ones already linked.
export default function LinkTestModal({ projectId, requirementId, tests, onClose, onDone }: {
  projectId: string; requirementId: string; tests: Test[]; onClose: () => void; onDone: () => void;
}) {
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
                const r = await linkTest(projectId, requirementId, t.id);
                if (r?.error) setErr(r.error); else onDone();
              })}>Link</button>
            </li>
          ))}
        </ul>
      )}
      {err && <p style={{ color: "var(--bad)", fontSize: 12.5, marginTop: 10 }}>{err}</p>}
    </Modal>
  );
}
