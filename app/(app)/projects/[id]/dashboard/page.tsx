import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { checkQuality } from "@/lib/quality";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [reqsRes, statusRes, linksRes, tasksRes, pendingRes] = await Promise.all([
    supabase.from("requirements").select("id, code, title, description, status, quality_score").eq("project_id", id),
    supabase.from("test_case_status").select("test_case_id, result").eq("project_id", id),
    supabase.from("test_case_requirements").select("requirement_id, test_case_id, requirements!inner(project_id)").eq("requirements.project_id", id),
    supabase.from("tasks").select("id, title, status, due_date, requirement_id").eq("project_id", id),
    supabase.from("change_requests").select("id", { count: "exact", head: true }).eq("project_id", id).eq("status", "pending"),
  ]);

  const reqs = reqsRes.data ?? [];
  const statuses = statusRes.data ?? [];
  const links = linksRes.data ?? [];
  const tasks = tasksRes.data ?? [];

  const total = reqs.length;
  const coveredReqs = new Set(links.map((l) => l.requirement_id));
  const coverage = total ? Math.round((coveredReqs.size / total) * 100) : 0;

  const passed = statuses.filter((s) => s.result === "passed").length;
  const failed = statuses.filter((s) => s.result === "failed").length;
  const notRun = statuses.filter((s) => s.result === "not_run").length;
  const passRate = passed + failed ? Math.round((passed / (passed + failed)) * 100) : 0;

  const today = new Date().toISOString().slice(0, 10);
  const failedTestCaseIds = new Set(statuses.filter((s) => s.result === "failed").map((s) => s.test_case_id));
  const reqsWithFailingTest = new Set(
    links.filter((l) => failedTestCaseIds.has(l.test_case_id)).map((l) => l.requirement_id),
  );

  // needs attention: failing tests, then no test, then overdue tasks
  const attention: { kind: string; label: string; href: string }[] = [];
  for (const r of reqs) {
    if (reqsWithFailingTest.has(r.id))
      attention.push({ kind: "Failed", label: `${r.code} ${r.title}`, href: `/projects/${id}/requirements?open=${r.id}` });
  }
  for (const r of reqs) {
    if (!coveredReqs.has(r.id)) attention.push({ kind: "No test", label: `${r.code} ${r.title}`, href: `/projects/${id}/requirements?open=${r.id}` });
  }
  for (const t of tasks) {
    if (t.status !== "done" && t.due_date && t.due_date < today)
      attention.push({ kind: "Overdue", label: t.title, href: `/projects/${id}/requirements` });
  }

  // quality: score each requirement live
  const scores = reqs.map((r) => checkQuality(`${r.title}. ${r.description ?? ""}`));
  const good = scores.filter((s) => s.grade === "good").length;
  const review = scores.filter((s) => s.grade === "review").length;
  const poor = scores.filter((s) => s.grade === "poor").length;
  const avgQuality = scores.length ? Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length) : 0;

  const kpis = [
    { label: "Requirements", value: total },
    { label: "Test coverage", value: `${coverage}%` },
    { label: "Test pass rate", value: `${passRate}%` },
    { label: "Pending changes", value: pendingRes.count ?? 0 },
  ];

  return (
    <>
      <PageHeader title="Project overview" subtitle="Everything on this page updates the moment a requirement, test or change is saved." />

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
        {kpis.map((k) => (
          <div key={k.label} className="card" style={{ padding: 16 }}>
            <div className="label">{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{k.value}</div>
          </div>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, margin: 0 }}>Test results</h2>
            <Link className="btn sm" href={`/projects/${id}/tests`}>Open</Link>
          </div>
          <Bars rows={[
            { label: "Passed", value: passed, color: "var(--good)" },
            { label: "Failed", value: failed, color: "var(--bad)" },
            { label: "Not run", value: notRun, color: "var(--border-strong)" },
          ]} />
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, margin: 0 }}>Requirement quality</h2>
            <Link className="btn sm" href={`/projects/${id}/quality`}>Open</Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 30, fontWeight: 800 }}>{avgQuality}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5 }}>
              <span><b>{good}</b> good</span>
              <span><b>{review}</b> need review</span>
              <span><b>{poor}</b> poor</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: 0 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 15, margin: 0 }}>Needs attention</h2>
          <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{attention.length} item{attention.length === 1 ? "" : "s"}</span>
        </div>
        {attention.length === 0 ? (
          <div style={{ padding: 28, textAlign: "center", color: "var(--good)", fontSize: 13.5 }}>
            Nothing needs attention. Every requirement has a test and no task is overdue.
          </div>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {attention.slice(0, 8).map((a, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderBottom: "1px solid var(--border)" }}>
                <span className={`pill ${a.kind === "No test" ? "p-warn" : "p-bad"}`}>{a.kind}</span>
                <span style={{ flex: 1, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.label}</span>
                <Link className="btn sm" href={a.href}>Open</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {total === 0 && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Link className="btn primary" href={`/projects/${id}/requirements`}>Add your first requirement</Link>
        </div>
      )}
    </>
  );
}

function Bars({ rows }: { rows: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r) => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 60, fontSize: 12.5, color: "var(--ink-2)" }}>{r.label}</span>
          <div style={{ flex: 1, height: 10, background: "var(--surface-2)", borderRadius: 5, overflow: "hidden" }}>
            <div style={{ width: `${(r.value / max) * 100}%`, height: "100%", background: r.color }} />
          </div>
          <span style={{ width: 24, textAlign: "right", fontSize: 12.5, fontWeight: 600 }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}
