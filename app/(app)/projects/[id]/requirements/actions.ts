"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkQuality } from "@/lib/quality";

async function nextCode(projectId: string, prefix: "FR" | "NFR") {
  const supabase = await createClient();
  const { data } = await supabase
    .from("requirements")
    .select("code")
    .eq("project_id", projectId)
    .like("code", `${prefix}%`);
  let max = 0;
  for (const r of data ?? []) {
    const m = r.code.match(/\d+/);
    if (m) max = Math.max(max, parseInt(m[0], 10));
  }
  return `${prefix}${String(max + 1).padStart(2, "0")}`;
}

export async function createRequirement(projectId: string, form: {
  title: string;
  description: string;
  type: "functional" | "non_functional";
  priority: string;
  module_id: string | null;
}) {
  const supabase = await createClient();
  const prefix = form.type === "non_functional" ? "NFR" : "FR";
  const code = await nextCode(projectId, prefix);
  const q = checkQuality(`${form.title}. ${form.description}`);

  const { error } = await supabase.from("requirements").insert({
    project_id: projectId,
    code,
    title: form.title.trim(),
    description: form.description.trim(),
    type: form.type,
    priority: form.priority,
    module_id: form.module_id,
    quality_score: q.score,
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/requirements`);
  return { ok: true, code };
}

export async function addTask(projectId: string, requirementId: string, title: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    project_id: projectId,
    requirement_id: requirementId,
    title: title.trim(),
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/requirements`);
  return { ok: true };
}

export async function linkTest(projectId: string, requirementId: string, testCaseId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("test_case_requirements")
    .insert({ requirement_id: requirementId, test_case_id: testCaseId });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/requirements`);
  return { ok: true };
}

export async function proposeChange(projectId: string, requirementId: string, form: {
  proposed_title: string;
  proposed_description: string;
  reason: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("change_requests")
    .select("code")
    .eq("project_id", projectId)
    .like("code", "CR%");
  let max = 0;
  for (const r of data ?? []) {
    const m = r.code.match(/\d+/);
    if (m) max = Math.max(max, parseInt(m[0], 10));
  }
  const code = `CR${String(max + 1).padStart(2, "0")}`;

  const { error } = await supabase.from("change_requests").insert({
    project_id: projectId,
    requirement_id: requirementId,
    code,
    proposed_title: form.proposed_title.trim(),
    proposed_description: form.proposed_description.trim(),
    reason: form.reason.trim(),
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true, code };
}
