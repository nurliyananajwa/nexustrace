import { createClient } from "@/lib/supabase/server";
import { getProjectContext } from "@/lib/data";
import { notFound } from "next/navigation";
import RequirementsView from "./RequirementsView";

export const dynamic = "force-dynamic";

export default async function RequirementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getProjectContext(id);
  if (!ctx) notFound();
  const supabase = await createClient();

  const [reqs, modules, tests, links, tasks, versions, testStatuses] = await Promise.all([
    supabase.from("requirements").select("*").eq("project_id", id).order("code"),
    supabase.from("modules").select("*").eq("project_id", id).order("name"),
    supabase.from("test_cases").select("id, code, title").eq("project_id", id).order("code"),
    supabase.from("test_case_requirements").select("test_case_id, requirement_id, requirements!inner(project_id)").eq("requirements.project_id", id),
    supabase.from("tasks").select("id, title, status, requirement_id").eq("project_id", id),
    supabase.from("requirement_versions").select("id, requirement_id, version, title, created_at").order("version", { ascending: false }),
    supabase.from("test_case_status").select("test_case_id, result").eq("project_id", id),
  ]);

  return (
    <RequirementsView
      projectId={id}
      role={ctx.role}
      requirements={reqs.data ?? []}
      modules={modules.data ?? []}
      tests={(tests.data ?? []).map((test) => ({ ...test, result: testStatuses.data?.find((status) => status.test_case_id === test.id)?.result ?? "not_run" }))}
      links={(links.data ?? []).map((l) => ({ test_case_id: l.test_case_id, requirement_id: l.requirement_id }))}
      tasks={tasks.data ?? []}
      versions={versions.data ?? []}
    />
  );
}
