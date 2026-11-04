-- latest test run must win even when two runs share a timestamp (same transaction)
alter table public.test_runs add column seq bigint generated always as identity;
alter table public.test_runs alter column run_at set default clock_timestamp();
drop index if exists public.test_runs_test_case_id_run_at_idx;
create index test_runs_latest_idx on public.test_runs (test_case_id, seq desc);
create or replace view public.test_case_status with (security_invoker = true) as
select tc.id as test_case_id, tc.project_id,
       coalesce(lr.result, 'not_run') as result, lr.run_at as last_run_at
from public.test_cases tc
left join lateral (select tr.result, tr.run_at from public.test_runs tr
                   where tr.test_case_id = tc.id order by tr.seq desc limit 1) lr on true;
