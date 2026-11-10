import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { checkQuality } from "@/lib/quality";
import QualityChecker from "./QualityChecker";

export const dynamic = "force-dynamic";

export default async function QualityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: reqs } = await supabase
    .from("requirements")
    .select("id, code, title, description")
    .eq("project_id", id);

  // Scored live, so the list always matches the current wording.
  const lowest = (reqs ?? [])
    .map((r) => ({ ...r, quality: checkQuality(`${r.title}. ${r.description ?? ""}`) }))
    .sort((a, b) => a.quality.score - b.quality.score)
    .slice(0, 8);

  return (
    <>
      <PageHeader
        title="Quality check"
        subtitle="Scores a requirement's wording against ISO/IEC/IEEE 29148 and flags what makes it hard to test. The same check runs on the requirement form."
      />
      <QualityChecker projectId={id} lowest={lowest} />
    </>
  );
}
