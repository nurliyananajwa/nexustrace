"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function decideChange(projectId: string, crId: string, approve: boolean, comment: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_change_request", {
    cr: crId,
    approve,
    comment: comment.trim() || undefined,
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function addComment(projectId: string, crId: string, body: string) {
  const supabase = await createClient();
  // author_id is filled in by the database from the signed-in user.
  const { error } = await supabase.from("change_request_comments").insert({
    change_request_id: crId,
    body: body.trim(),
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/changes`);
  return { ok: true };
}

export async function getImpact(requirementId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("impact_of", { req: requirementId });
  return data ?? [];
}
