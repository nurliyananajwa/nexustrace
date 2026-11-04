import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getMyProjects, getProjectContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getProjectContext(id);
  if (!ctx) notFound();

  const projects = await getMyProjects();

  const supabase = await createClient();
  const { count } = await supabase
    .from("change_requests")
    .select("id", { count: "exact", head: true })
    .eq("project_id", id)
    .eq("status", "pending");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar
        projects={projects}
        project={ctx.project}
        role={ctx.role}
        userName={ctx.profile.full_name || ctx.profile.email}
        pendingChanges={count ?? 0}
      />
      <main style={{ flex: 1, minWidth: 0, padding: "28px 32px", maxWidth: 1180 }}>
        {children}
      </main>
    </div>
  );
}
