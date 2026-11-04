"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { checkQuality, GRADE_LABEL, QUALITY_EXAMPLES } from "@/lib/quality";
import { StatusPill } from "@/components/ui";

type Low = { id: string; code: string; title: string; description: string | null; quality_score: number | null };

export default function QualityChecker({ projectId, lowest }: { projectId: string; lowest: Low[] }) {
  const [text, setText] = useState("");
  const result = useMemo(() => checkQuality(text), [text]);
  const show = text.trim().length > 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 16, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <label className="label" htmlFor="q">Requirement text</label>
          <textarea
            id="q"
            className="input"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste a requirement, for example: The system must display the dashboard within 3 seconds."
            style={{ margin: "8px 0 12px" }}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn sm" onClick={() => setText(QUALITY_EXAMPLES.vague)}>Try a vague one</button>
            <button className="btn sm" onClick={() => setText(QUALITY_EXAMPLES.good)}>Try a good one</button>
            {show && <button className="btn sm" onClick={() => setText("")}>Clear</button>}
          </div>
        </div>

        {show && (
          <div className="card" style={{ padding: 18 }}>
            <div className="label" style={{ marginBottom: 10 }}>Preview with flagged words</div>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7 }}>
              <Highlighted text={text} words={result.flagged} />
            </p>
          </div>
        )}
      </div>

      {/* score panel */}
      <div className="card" style={{ padding: 18 }}>
        {show ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Ring score={result.score} grade={result.grade} />
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{result.score}</div>
                <div style={{ marginTop: 4 }}>
                  <StatusPill value={result.grade} label={GRADE_LABEL[result.grade]} />
                </div>
              </div>
            </div>
            <div className="label" style={{ margin: "18px 0 8px" }}>
              {result.issues.length ? "Issues found" : "No issues found"}
            </div>
            {result.issues.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--good)", margin: 0 }}>
                This requirement is clear and testable.
              </p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
                {result.issues.map((i, n) => (
                  <li key={n} style={{ display: "flex", gap: 8, fontSize: 12.5 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                      background: i.severity === "bad" ? "var(--bad)" : "var(--warn)",
                    }} />
                    <span style={{ color: "var(--ink-2)" }}>{i.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>
            Start typing to see the score and the issues.
          </p>
        )}
      </div>

      {/* lowest scoring */}
      <div className="card" style={{ padding: 0, gridColumn: "1 / -1" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <div className="label">Lowest-scoring requirements in this project</div>
        </div>
        {lowest.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
            No requirements scored yet.
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>ID</th><th>Requirement</th><th>Score</th><th></th></tr>
            </thead>
            <tbody>
              {lowest.map((r) => {
                const live = checkQuality(`${r.title}. ${r.description ?? ""}`);
                return (
                  <tr key={r.id}>
                    <td><span className="id">{r.code}</span></td>
                    <td>{r.title}</td>
                    <td><StatusPill value={live.grade} label={String(live.score)} /></td>
                    <td style={{ textAlign: "right" }}>
                      <Link className="btn sm" href={`/projects/${projectId}/requirements?open=${r.id}`}>Open</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Highlighted({ text, words }: { text: string; words: string[] }) {
  if (words.length === 0) return <>{text}</>;
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        words.some((w) => w.toLowerCase() === part.toLowerCase()) ? (
          <span key={i} className="hl">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function Ring({ score, grade }: { score: number; grade: string }) {
  const color = grade === "good" ? "var(--good)" : grade === "review" ? "var(--warn)" : "var(--bad)";
  const r = 30;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76">
      <circle cx="38" cy="38" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="9" />
      <circle
        cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`} transform="rotate(-90 38 38)"
      />
    </svg>
  );
}
