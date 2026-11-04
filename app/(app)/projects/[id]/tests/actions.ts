"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function recordResult(projectId: string, testCaseId: string, result: "passed" | "failed" | "not_run") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("test_runs").insert({
    test_case_id: testCaseId,
    result,
    run_by: user?.id ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/tests`);
  return { ok: true };
}

export async function createTest(projectId: string, form: { title: string; requirementIds: string[]; result: "passed" | "failed" | "not_run" }) {
  const supabase = await createClient();
  const { data } = await supabase.from("test_cases").select("code").eq("project_id", projectId).like("code", "TC%");
  let max = 0;
  for (const r of data ?? []) {
    const m = r.code.match(/\d+/);
    if (m) max = Math.max(max, parseInt(m[0], 10));
  }
  const code = `TC${String(max + 1).padStart(2, "0")}`;

  const { data: tc, error } = await supabase
    .from("test_cases")
    .insert({ project_id: projectId, code, title: form.title.trim() })
    .select("id")
    .single();
  if (error || !tc) return { error: error?.message ?? "Could not create test case" };

  if (form.requirementIds.length) {
    await supabase.from("test_case_requirements").insert(
      form.requirementIds.map((rid) => ({ test_case_id: tc.id, requirement_id: rid })),
    );
  }
  if (form.result !== "not_run") {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("test_runs").insert({ test_case_id: tc.id, result: form.result, run_by: user?.id ?? null });
  }
  revalidatePath(`/projects/${projectId}/tests`);
  return { ok: true, code };
}
