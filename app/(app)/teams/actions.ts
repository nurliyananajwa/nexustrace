"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (name.length < 3) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data, error } = await supabase
    .from("projects")
    .insert({ name, description, created_by: user.id })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not create project");

  revalidatePath("/teams");
  redirect(`/projects/${data.id}/dashboard`);
}
