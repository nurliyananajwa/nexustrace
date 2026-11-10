-- The quality score is always computed live from the wording (lib/quality.ts).
-- A stored copy was never updated when wording changed, so it went stale.
alter table public.requirements drop column quality_score;
