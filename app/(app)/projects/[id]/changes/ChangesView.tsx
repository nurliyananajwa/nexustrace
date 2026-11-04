"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Tables } from "@/lib/supabase/database.types";
import { CR_STATUS_LABEL, type Role } from "@/lib/constants";
import { StatusPill } from "@/components/ui";
import { decideChange, addComment, getImpact } from "./actions";

type CR = Tables<"change_requests">;
type Req = { id: string; code: string; title: string; description: string; status: string };
type Comment = { id: string; change_request_id: string; author_id: string; body: string; created_at: string };
type ImpactItem = { level: number; kind: string; item_id: string; code: string | null; label: string; via: string | null };

export default function ChangesView({ projectId, role, changes, reqMap, comments, profMap }: {
  projectId: string; role: Role; changes: CR[];
  reqMap: Record<string, Req>; comments: Comment[]; profMap: Record<string, string>;
}) {
  const router = useRouter();
  const [selId, setSelId] = useState<string>(changes[0]?.id ?? "");
  const selected = changes.find((c) => c.id === selId) ?? changes[0];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "230px minmax(0,1fr)", gap: 16, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {changes.map((c) => {
          const req = reqMap[c.requirement_id];
          return (
            <button key={c.id} onClick={() => setSelId(c.id)} className="card"
              style={{ padding: 12, textAlign: "left", cursor: "pointer", border: c.id === selId ? "1.5px solid var(--brand)" : undefined, background: c.id === selId ? "var(--brand-tint)" : undefined }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span className="id">{c.code}</span>
                <StatusPill value={c.status} label={CR_STATUS_LABEL[c.status as keyof typeof CR_STATUS_LABEL] ?? c.status} />
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Change {req?.code ?? "?"}
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <Detail key={selected.id} projectId={projectId} role={role} cr={selected}
          req={reqMap[selected.requirement_id]} comments={comments.filter((c) => c.change_request_id === selected.id)}
          profMap={profMap} onDone={() => router.refresh()} />
      )}
    </div>
  );
}

function Detail({ projectId, role, cr, req, comments, profMap, onDone }: {
  projectId: string; role: Role; cr: CR; req: Req | undefined;
  comments: Comment[]; profMap: Record<string, string>; onDone: () => void;
}) {
  const [impact, setImpact] = useState<ImpactItem[] | null>(null);
  const [comment, setComment] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let ok = true;
    if (cr.status === "pending") {
      getImpact(cr.requirement_id).then((d) => { if (ok) setImpact(d as ImpactItem[]); });
    } else if (Array.isArray(cr.impact)) {
      setImpact(cr.impact as unknown as ImpactItem[]);
    } else {
      setImpact([]);
    }
    return () => { ok = false; };
  }, [cr]);

  const tasks = (impact ?? []).filter((i) => i.kind === "task").length;
  const tests = (impact ?? []).filter((i) => i.kind === "test_case").length;
  const deps = (impact ?? []).filter((i) => i.kind === "requirement").length;

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <h2 style={{ fontSize: 17, margin: 0 }}>{cr.code} · change {req?.code}</h2>
        <StatusPill value={cr.status} label={CR_STATUS_LABEL[cr.status as keyof typeof CR_STATUS_LABEL] ?? cr.status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12 }}>
          <div className="label" style={{ marginBottom: 6 }}>Current wording</div>
          <div style={{ fontSize: 13 }}><b>{req?.title}</b><div style={{ color: "var(--ink-2)", marginTop: 4 }}>{req?.description}</div></div>
        </div>
        <div style={{ border: "1.5px solid var(--brand)", borderRadius: 8, padding: 12 }}>
          <div className="label" style={{ marginBottom: 6 }}>Proposed wording</div>
          <div style={{ fontSize: 13 }}><b>{cr.proposed_title}</b><div style={{ color: "var(--ink-2)", marginTop: 4 }}>{cr.proposed_description}</div></div>
        </div>
      </div>

      <div style={{ fontSize: 13, marginBottom: 12 }}>
        <span className="label">Reason</span>
        <p style={{ margin: "4px 0 0", color: "var(--ink-2)" }}>{cr.reason}</p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <span className="pill p-mute">{tasks} task{tasks === 1 ? "" : "s"}</span>
        <span className="pill p-mute">{tests} test{tests === 1 ? "" : "s"}</span>
        <span className="pill p-mute">{deps} dependent requirement{deps === 1 ? "" : "s"}</span>
      </div>

      <div className="label" style={{ marginBottom: 8 }}>Impact {cr.status === "pending" ? "(live)" : "(when decided)"}</div>
      <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12, marginBottom: 16 }}>
        {impact === null ? (
          <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: 0 }}>Working out the impact…</p>
        ) : impact.length === 0 ? (
          <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: 0 }}>Nothing else depends on this requirement.</p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {impact.map((i, n) => (
              <li key={n} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, paddingLeft: (i.level - (i.kind === "task" ? 0 : 1)) * 14 }}>
                <span className={`pill ${i.kind === "requirement" ? "p-info" : i.kind === "test_case" ? "p-warn" : "p-mute"}`}>
                  {i.kind === "test_case" ? "Test" : i.kind === "requirement" ? "Req" : "Task"}
                </span>
                {i.code && <span className="id">{i.code}</span>}
                <span style={{ color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.label}</span>
                {i.level > 1 && <span style={{ fontSize: 11, color: "var(--ink-3)" }}>· level {i.level}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* discussion */}
      <div className="label" style={{ marginBottom: 8 }}>Discussion</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
        {comments.length === 0 ? (
          <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: 0 }}>No comments yet.</p>
        ) : comments.map((c) => (
          <div key={c.id} style={{ fontSize: 12.5 }}>
            <b>{profMap[c.author_id] ?? "Someone"}</b>{" "}
            <span style={{ color: "var(--ink-3)" }}>{new Date(c.created_at).toLocaleDateString()}</span>
            <div style={{ color: "var(--ink-2)" }}>{c.body}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input className="input" placeholder="Write a comment" value={comment} onChange={(e) => setComment(e.target.value)} />
        <button className="btn" disabled={pending || comment.trim().length === 0}
          onClick={() => start(async () => { const r = await addComment(projectId, cr.id, comment); if (r?.error) setErr(r.error); else { setComment(""); onDone(); } })}>Post</button>
      </div>

      {cr.status === "pending" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          {role === "supervisor" ? (
            <>
              <button className="btn primary" style={{ background: "var(--good)", borderColor: "var(--good)" }} disabled={pending}
                onClick={() => start(async () => { const r = await decideChange(projectId, cr.id, true, comment); if (r?.error) setErr(r.error); else onDone(); })}>
                Approve
              </button>
              <button className="btn" disabled={pending}
                onClick={() => start(async () => { const r = await decideChange(projectId, cr.id, false, comment); if (r?.error) setErr(r.error); else onDone(); })}>
                Reject
              </button>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Approving saves a new version and resets the affected tests.</span>
            </>
          ) : (
            <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Waiting for the supervisor to approve or reject. Only the supervisor can decide.</span>
          )}
        </div>
      )}
      {cr.status !== "pending" && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, fontSize: 12.5, color: "var(--ink-2)" }}>
          {CR_STATUS_LABEL[cr.status as keyof typeof CR_STATUS_LABEL]} by {cr.decided_by ? (profMap[cr.decided_by] ?? "supervisor") : "supervisor"}
          {cr.decided_at ? ` on ${new Date(cr.decided_at).toLocaleDateString()}` : ""}.
        </div>
      )}
      {err && <p style={{ color: "var(--bad)", fontSize: 12.5, marginTop: 10 }}>{err}</p>}
    </div>
  );
}
