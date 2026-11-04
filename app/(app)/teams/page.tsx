import Link from "next/link";
import { getMyProjects, getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL } from "@/lib/constants";
import NewProjectButton from "./NewProjectButton";

export const dynamic = "force-dynamic";

type Stat = { reqs: number; coverage: number; pending: number };

export default async function TeamsPage() {
  const profile = await getCurrentProfile();
  const projects = await getMyProjects();
  const supabase = await createClient();

  // per-project headline stats
  const stats: Record<string, Stat> = {};
  await Promise.all(
    projects.map(async (p) => {
      const [{ count: reqs }, { data: links }, { count: pending }] = await Promise.all([
        supabase.from("requirements").select("id", { count: "exact", head: true }).eq("project_id", p.id),
        supabase.from("test_case_requirements").select("requirement_id, requirements!inner(project_id)").eq("requirements.project_id", p.id),
        supabase.from("change_requests").select("id", { count: "exact", head: true }).eq("project_id", p.id).eq("status", "pending"),
      ]);
      const covered = new Set((links ?? []).map((l) => l.requirement_id)).size;
      const total = reqs ?? 0;
      stats[p.id] = {
        reqs: total,
        coverage: total ? Math.round((covered / total) * 100) : 0,
        pending: pending ?? 0,
      };
    }),
  );

  const greeting = profile?.full_name?.split(" ")[0] || "there";

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, margin: 0 }}>Your teams</h1>
          <p style={{ color: "var(--ink-2)", margin: "4px 0 0", fontSize: 14 }}>
            Hi {greeting}. You belong to {projects.length} {projects.length === 1 ? "project" : "projects"}.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <NewProjectButton />
          <form action="/auth/signout" method="post">
            <button className="btn" type="submit">Sign out</button>
          </form>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <h2 style={{ fontSize: 17, margin: "0 0 6px" }}>No projects yet</h2>
          <p style={{ color: "var(--ink-2)", margin: "0 0 18px", fontSize: 13.5 }}>
            Create your project to start adding requirements, or ask your team lead to add you by your Google email ({profile?.email}).
          </p>
          <NewProjectButton />
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {projects.map((p) => {
            const s = stats[p.id];
            return (
              <Link key={p.id} href={`/projects/${p.id}/dashboard`} className="card" style={{ padding: 18, display: "block" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
                  <h2 style={{ fontSize: 16, margin: 0 }}>{p.name}</h2>
                  <span className="pill p-mute">{ROLE_LABEL[p.role]}</span>
                </div>
                {p.description && (
                  <p style={{ color: "var(--ink-2)", fontSize: 13, margin: "6px 0 0", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {p.description}
                  </p>
                )}
                <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 12.5, color: "var(--ink-2)" }}>
                  <span><b style={{ color: "var(--ink)" }}>{s.reqs}</b> requirements</span>
                  <span><b style={{ color: "var(--ink)" }}>{s.coverage}%</b> covered</span>
                  {s.pending > 0 && <span className="pill p-warn" style={{ fontSize: 11 }}>{s.pending} pending</span>}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 10 }}>
                  Sprint {p.current_sprint} of {p.total_sprints}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
