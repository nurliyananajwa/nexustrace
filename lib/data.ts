import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import type { Role } from "@/lib/constants";

export type Profile = Tables<"profiles">;
export type Project = Tables<"projects">;

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data;
}

export type ProjectWithRole = Project & { role: Role };

export async function getMyProjects(): Promise<ProjectWithRole[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // project_members is readable by members only (RLS), so this returns just the
  // projects this user belongs to.
  const { data } = await supabase
    .from("project_members")
    .select("role, projects(*)")
    .eq("user_id", user.id);

  return (data ?? [])
    .filter((r) => r.projects)
    .map((r) => ({ ...(r.projects as unknown as Project), role: r.role as Role }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type ProjectContext = {
  project: Project;
  role: Role;
  profile: Profile;
};

// cache(): the project layout and the page both call this; it runs once per request.
export const getProjectContext = cache(async (
  projectId: string,
): Promise<ProjectContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("project_members")
    .select("role, projects(*), profiles:user_id(*)")
    .eq("user_id", user.id)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!membership || !membership.projects) return null;

  return {
    project: membership.projects as unknown as Project,
    role: membership.role as Role,
    profile: membership.profiles as unknown as Profile,
  };
});
