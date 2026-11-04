import { createClient } from "@/lib/supabase/server";
import { PageHeader, Empty } from "@/components/ui";
import MatrixView from "./MatrixView";

export const dynamic = "force-dynamic";

export default async function MatrixPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [reqsRes, testsRes, linksRes, tasksRes] = await Promise.all([
    supabase.from("requirements").select("id, code, title").eq("project_id", id).order("code"),
    supabase.from("test_cases").select("id, code").eq("project_id", id).order("code"),
    supabase.from("test_case_requirements").select("test_case_id, requirement_id, requirements!inner(project_id)").eq("requirements.project_id", id),
    supabase.from("tasks").select("requirement_id").eq("project_id", id),
  ]);

  const reqs = reqsRes.data ?? [];
  const tests = testsRes.data ?? [];
  const links = (linksRes.data ?? []).map((l) => ({ test_case_id: l.test_case_id, requirement_id: l.requirement_id }));
  const taskCount = new Map<string, number>();
  for (const t of tasksRes.data ?? []) {
    if (t.requirement_id) taskCount.set(t.requirement_id, (taskCount.get(t.requirement_id) ?? 0) + 1);
  }

  return (
    <>
      <PageHeader
        title="Traceability matrix"
        subtitle="Built from your links, never filled in by hand. An empty row is a requirement with no test — the gap to close next."
      />
      {reqs.length === 0 ? (
        <div className="card"><Empty>Add requirements and tests to see the matrix.</Empty></div>
      ) : (
        <MatrixView reqs={reqs} tests={tests} links={links} taskCount={Object.fromEntries(taskCount)} />
      )}
    </>
  );
}
