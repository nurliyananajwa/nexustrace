import { createClient } from "@/lib/supabase/server";
import TestsView from "./TestsView";

export const dynamic = "force-dynamic";

export default async function TestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [testsRes, statusRes, linksRes, reqsRes] = await Promise.all([
    supabase.from("test_cases").select("id, code, title, created_at").eq("project_id", id).order("code"),
    supabase.from("test_case_status").select("test_case_id, result, last_run_at").eq("project_id", id),
    supabase.from("test_case_requirements").select("test_case_id, requirement_id, requirements!inner(project_id, code)").eq("requirements.project_id", id),
    supabase.from("requirements").select("id, code, title").eq("project_id", id).order("code"),
  ]);

  const statusMap = new Map((statusRes.data ?? []).map((s) => [s.test_case_id, s]));
  const reqByTest = new Map<string, { id: string; code: string }[]>();
  for (const l of linksRes.data ?? []) {
    const arr = reqByTest.get(l.test_case_id) ?? [];
    const rq = l.requirements as unknown as { code: string };
    arr.push({ id: l.requirement_id, code: rq.code });
    reqByTest.set(l.test_case_id, arr);
  }

  const tests = (testsRes.data ?? []).map((t) => ({
    ...t,
    result: (statusMap.get(t.id)?.result ?? "not_run") as "passed" | "failed" | "not_run",
    lastRun: statusMap.get(t.id)?.last_run_at ?? null,
    reqs: reqByTest.get(t.id) ?? [],
  }));

  return <TestsView projectId={id} tests={tests} allReqs={reqsRes.data ?? []} />;
}
