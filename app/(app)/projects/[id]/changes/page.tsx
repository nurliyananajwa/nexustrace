import { createClient } from "@/lib/supabase/server";
import { getProjectContext } from "@/lib/data";
import { notFound } from "next/navigation";
import { PageHeader, Empty } from "@/components/ui";
import ChangesView from "./ChangesView";

export const dynamic = "force-dynamic";

export default async function ChangesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getProjectContext(id);
  if (!ctx) notFound();
  const supabase = await createClient();

  const [crRes, reqRes, commentRes, profRes] = await Promise.all([
    supabase.from("change_requests").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("requirements").select("id, code, title, description, status").eq("project_id", id),
    supabase.from("change_request_comments").select("id, change_request_id, author_id, body, created_at").order("created_at"),
    supabase.from("profiles").select("id, full_name, email"),
  ]);

  const reqMap = Object.fromEntries((reqRes.data ?? []).map((r) => [r.id, r]));
  const profMap = Object.fromEntries((profRes.data ?? []).map((p) => [p.id, p.full_name || p.email]));

  return (
    <>
      <PageHeader
        title="Change requests"
        subtitle="See what a change will touch before deciding. Only the supervisor can approve or reject."
      />
      {(crRes.data ?? []).length === 0 ? (
        <div className="card"><Empty>No change requests yet. Propose one from a requirement&rsquo;s detail panel.</Empty></div>
      ) : (
        <ChangesView
          projectId={id}
          role={ctx.role}
          changes={crRes.data ?? []}
          reqMap={reqMap}
          comments={commentRes.data ?? []}
          profMap={profMap}
        />
      )}
    </>
  );
}
