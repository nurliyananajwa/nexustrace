import type { Tables } from "@/lib/supabase/database.types";

export type Req = Tables<"requirements">;
export type Mod = Tables<"modules">;
export type Test = { id: string; code: string; title: string; result: string };
export type Link = { test_case_id: string; requirement_id: string };
export type Task = { id: string; title: string; status: string; requirement_id: string | null };
export type Version = { id: string; requirement_id: string; version: number; title: string; created_at: string };
