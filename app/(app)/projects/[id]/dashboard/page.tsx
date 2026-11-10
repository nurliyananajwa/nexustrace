import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const [reqResult, testResult, linkResult, taskResult, changeResult] = await Promise.all([
    db.from("requirements").select("id, code, title").eq("project_id", id),
    db.from("test_case_status").select("test_case_id, result").eq("project_id", id),
    db.from("test_case_requirements").select("requirement_id, test_case_id, requirements!inner(project_id)").eq("requirements.project_id", id),
    db.from("tasks").select("id, status").eq("project_id", id),
    db.from("change_requests").select("id", { count: "exact", head: true }).eq("project_id", id).eq("status", "pending"),
  ]);
  const requirements = reqResult.data ?? [];
  const tests = testResult.data ?? [];
  const links = linkResult.data ?? [];
  const tasks = taskResult.data ?? [];
  const covered = new Set(links.map((link) => link.requirement_id));
  const failed = new Set(tests.filter((test) => test.result === "failed").map((test) => test.test_case_id));
  const failedReqs = new Set(links.filter((link) => failed.has(link.test_case_id)).map((link) => link.requirement_id));
  const uncovered = requirements.filter((req) => !covered.has(req.id));
  const failing = requirements.filter((req) => failedReqs.has(req.id));
  const coverage = requirements.length ? Math.round(covered.size / requirements.length * 100) : 0;
  const doneTasks = tasks.filter((task) => task.status === "done").length;
  const metrics = [
    { label: "Requirements", value: requirements.length, hint: "What the system must do" },
    { label: "Test coverage", value: `${coverage}%`, hint: `${covered.size} of ${requirements.length} linked to tests` },
    { label: "Tasks complete", value: `${doneTasks}/${tasks.length}`, hint: "Work linked to requirements" },
    { label: "Changes awaiting review", value: changeResult.count ?? 0, hint: "Proposals needing a decision" },
  ];

  return <>
    <header className="page-heading">
      <div><p className="page-kicker">PROJECT OVERVIEW</p><h1 className="page-title">See what connects.</h1><p className="page-lead">Follow each requirement through the work and tests that prove it is ready.</p></div>
      <Link className="btn primary" href={`/projects/${id}/requirements`}>Open requirements →</Link>
    </header>
    <section className="metric-grid" aria-label="Project progress">
      {metrics.map((metric) => <div className="card metric" key={metric.label}><small>{metric.label}</small><strong>{metric.value}</strong><em>{metric.hint}</em></div>)}
    </section>
    <div className="overview-grid">
      <section className="card overview-panel">
        <h2 className="section-title">Your path through the project</h2><p className="section-lead">Three steps make a complete trace.</p>
        <ol className="step-list">
          <li><span className="step-number">1</span><span><strong>Write a requirement</strong><small>Describe what should happen.</small></span><Link href={`/projects/${id}/requirements`}>View →</Link></li>
          <li><span className="step-number">2</span><span><strong>Connect the work</strong><small>Add the tasks that build it.</small></span><Link href={`/projects/${id}/requirements`}>View →</Link></li>
          <li><span className="step-number">3</span><span><strong>Prove it with a test</strong><small>Link a test case and record its result.</small></span><Link href={`/projects/${id}/tests`}>View →</Link></li>
        </ol>
      </section>
      <section className="card overview-panel">
        <h2 className="section-title">Needs attention</h2><p className="section-lead">The next useful things to check.</p>
        {requirements.length === 0 ? <p className="page-lead">Start by adding your first requirement.</p> : failing.length === 0 && uncovered.length === 0 ? <p className="page-lead">No failing or unlinked requirements right now.</p> : <ul className="attention-list">
          {failing.slice(0, 3).map((req) => <li key={`fail-${req.id}`}><span className="pill p-bad">Failed test</span><span>{req.code} {req.title}</span><Link href={`/projects/${id}/requirements?open=${req.id}`}>Open</Link></li>)}
          {uncovered.slice(0, 4).map((req) => <li key={`empty-${req.id}`}><span className="pill p-warn">No test</span><span>{req.code} {req.title}</span><Link href={`/projects/${id}/requirements?open=${req.id}`}>Open</Link></li>)}
        </ul>}
      </section>
    </div>
  </>;
}
