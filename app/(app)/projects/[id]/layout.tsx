import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getMyProjects, getProjectContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getProjectContext(id);
  if (!ctx) notFound();
  const projects = await getMyProjects();
  const supabase = await createClient();
  const { count } = await supabase.from("change_requests").select("id", { count: "exact", head: true }).eq("project_id", id).eq("status", "pending");
  return <div className="app-shell">
    <Sidebar projects={projects} project={ctx.project} role={ctx.role} userName={ctx.profile.full_name || ctx.profile.email} pendingChanges={count ?? 0} />
    <main className="main-content">{children}</main>
  </div>;
}
