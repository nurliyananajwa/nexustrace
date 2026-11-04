import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import QualityChecker from "./QualityChecker";

export const dynamic = "force-dynamic";

export default async function QualityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: reqs } = await supabase
    .from("requirements")
    .select("id, code, title, description, quality_score")
    .eq("project_id", id)
    .order("quality_score", { ascending: true, nullsFirst: false });

  return (
    <>
      <PageHeader
        title="Quality check"
        subtitle="Scores a requirement's wording against ISO/IEC/IEEE 29148 and flags what makes it hard to test. The same check runs on the requirement form."
      />
      <QualityChecker projectId={id} lowest={(reqs ?? []).slice(0, 8)} />
    </>
  );
}
