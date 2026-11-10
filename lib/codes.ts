import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type CodedTable = "requirements" | "test_cases" | "change_requests";

// Next readable ID for a project, e.g. FR03, NFR01, TC12, CR04.
// Known limit: two people saving at the same moment can get the same code; the
// database's unique (project_id, code) rule rejects the second one with an error.
export async function nextCode(
  db: SupabaseClient<Database>,
  table: CodedTable,
  projectId: string,
  prefix: "FR" | "NFR" | "TC" | "CR",
): Promise<string> {
  const { data } = await db.from(table).select("code").eq("project_id", projectId).like("code", `${prefix}%`);
  let max = 0;
  for (const row of data ?? []) {
    const n = parseInt(row.code.slice(prefix.length), 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  return `${prefix}${String(max + 1).padStart(2, "0")}`;
}
