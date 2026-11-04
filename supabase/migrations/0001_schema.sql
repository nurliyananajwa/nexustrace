-- NexusTrace schema: 14 tables (data dictionary, Tables 7-20 of the proposal)
-- "users" from the proposal is public.profiles, linked 1:1 to Supabase auth.users.

create extension if not exists pgcrypto;

-- ---------- tables ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 120),
  description text not null default '',
  current_sprint smallint not null default 1 check (current_sprint between 1 and 12),
  total_sprints smallint not null default 6 check (total_sprints between 1 and 12),
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('student', 'team_lead', 'supervisor')),
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  unique (project_id, name)
);

create table public.requirements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  module_id uuid references public.modules(id) on delete set null,
  code text not null check (code ~ '^(FR|NFR)[0-9]{2,3}$'),
  title text not null check (char_length(title) between 3 and 200),
  description text not null default '',
  type text not null default 'functional' check (type in ('functional', 'non_functional')),
  priority text not null default 'should' check (priority in ('must', 'should', 'could', 'wont')),
  status text not null default 'draft' check (status in ('draft', 'approved', 'implemented', 'verified')),
  quality_score smallint check (quality_score between 0 and 100),
  current_version integer not null default 1,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, code)
);

create table public.requirement_versions (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  version integer not null,
  title text not null,
  description text not null,
  changed_by uuid references public.profiles(id),
  change_request_id uuid,
  created_at timestamptz not null default now(),
  unique (requirement_id, version)
);

create table public.requirement_dependencies (
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  depends_on_id uuid not null references public.requirements(id) on delete cascade,
  primary key (requirement_id, depends_on_id),
  check (requirement_id <> depends_on_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  requirement_id uuid references public.requirements(id) on delete set null,
  title text not null check (char_length(title) between 3 and 200),
  assignee_id uuid references public.profiles(id) on delete set null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  sprint smallint,
  due_date date,
  created_at timestamptz not null default now()
);

create table public.test_cases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  code text not null check (code ~ '^TC[0-9]{2,3}$'),
  title text not null check (char_length(title) between 3 and 200),
  steps text not null default '',
  expected_result text not null default '',
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (project_id, code)
);

create table public.test_case_requirements (
  test_case_id uuid not null references public.test_cases(id) on delete cascade,
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  primary key (test_case_id, requirement_id)
);

create table public.test_runs (
  id uuid primary key default gen_random_uuid(),
  test_case_id uuid not null references public.test_cases(id) on delete cascade,
  result text not null check (result in ('passed', 'failed', 'not_run')),
  notes text not null default '',
  run_by uuid references public.profiles(id),
  run_at timestamptz not null default now()
);

create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  code text not null check (code ~ '^CR[0-9]{2,3}$'),
  proposed_title text not null check (char_length(proposed_title) between 3 and 200),
  proposed_description text not null default '',
  reason text not null check (char_length(reason) between 5 and 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  impact jsonb,
  proposed_by uuid not null default auth.uid() references public.profiles(id),
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (project_id, code)
);

alter table public.requirement_versions
  add constraint requirement_versions_cr_fk foreign key (change_request_id)
  references public.change_requests(id) on delete set null;

create table public.change_request_comments (
  id uuid primary key default gen_random_uuid(),
  change_request_id uuid not null references public.change_requests(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  project_id uuid references public.projects(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- foreign-key indexes
create index on public.project_members (user_id);
create index on public.modules (project_id);
create index on public.requirements (project_id);
create index on public.requirements (module_id);
create index on public.requirement_versions (requirement_id);
create index on public.requirement_versions (change_request_id);
create index on public.requirement_dependencies (depends_on_id);
create index on public.tasks (project_id);
create index on public.tasks (requirement_id);
create index on public.tasks (assignee_id);
create index on public.test_cases (project_id);
create index on public.test_case_requirements (requirement_id);
create index on public.test_runs (test_case_id, run_at desc);
create index on public.change_requests (project_id);
create index on public.change_requests (requirement_id);
create index on public.change_request_comments (change_request_id);
create index on public.audit_log (project_id, created_at desc);

-- ---------- membership helpers (used by every RLS policy) ----------
create or replace function public.is_member(p uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.project_members m
                 where m.project_id = p and m.user_id = (select auth.uid()));
$$;

create or replace function public.member_role(p uuid)
returns text language sql stable security definer set search_path = '' as $$
  select m.role from public.project_members m
  where m.project_id = p and m.user_id = (select auth.uid());
$$;

create or replace function public.shares_project(other uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.project_members a
                 join public.project_members b on a.project_id = b.project_id
                 where a.user_id = (select auth.uid()) and b.user_id = other);
$$;

-- ---------- triggers ----------
-- new Google sign-in -> profile row
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, coalesce(new.email, ''),
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
          new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- whoever creates a project becomes its team lead
create or replace function public.handle_new_project()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.created_by, 'team_lead');
  return new;
end $$;
create trigger on_project_created after insert on public.projects
  for each row execute function public.handle_new_project();

-- wording of a non-draft requirement may change only through an approved change request
create or replace function public.requirements_before_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.title is distinct from old.title or new.description is distinct from old.description then
    if old.status <> 'draft' and coalesce(current_setting('reqweave.via_cr', true), '') <> 'on' then
      raise exception 'Requirement % is %. Propose a change request instead of editing it.', old.code, old.status
        using errcode = 'check_violation';
    end if;
    new.current_version := old.current_version + 1;
  end if;
  new.project_id := old.project_id; -- a requirement cannot be moved to another team
  new.updated_at := now();
  return new;
end $$;
create trigger requirements_before_update before update on public.requirements
  for each row execute function public.requirements_before_update();

-- every saved wording is kept as a version (never overwritten)
create or replace function public.requirements_write_version()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.current_version <> old.current_version then
    insert into public.requirement_versions (requirement_id, version, title, description, changed_by, change_request_id)
    values (new.id, new.current_version, new.title, new.description, auth.uid(),
            nullif(current_setting('reqweave.cr_id', true), '')::uuid);
  end if;
  return new;
end $$;
create trigger requirements_write_version after insert or update on public.requirements
  for each row execute function public.requirements_write_version();

-- audit log for the main records
create or replace function public.write_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  r := case when tg_op = 'DELETE' then old else new end;
  insert into public.audit_log (project_id, actor_id, action, entity, entity_id, details)
  values (r.project_id, auth.uid(), lower(tg_op), tg_table_name, r.id,
          case when tg_op = 'UPDATE' then jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new))
               else to_jsonb(r) end);
  return r;
end $$;
create trigger audit_requirements after insert or update or delete on public.requirements
  for each row execute function public.write_audit();
create trigger audit_tasks after insert or update or delete on public.tasks
  for each row execute function public.write_audit();
create trigger audit_test_cases after insert or update or delete on public.test_cases
  for each row execute function public.write_audit();
create trigger audit_change_requests after insert or update or delete on public.change_requests
  for each row execute function public.write_audit();

-- ---------- latest test result per test case ----------
create view public.test_case_status with (security_invoker = true) as
select tc.id as test_case_id, tc.project_id,
       coalesce(lr.result, 'not_run') as result, lr.run_at as last_run_at
from public.test_cases tc
left join lateral (select tr.result, tr.run_at from public.test_runs tr
                   where tr.test_case_id = tc.id order by tr.run_at desc limit 1) lr on true;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.modules enable row level security;
alter table public.requirements enable row level security;
alter table public.requirement_versions enable row level security;
alter table public.requirement_dependencies enable row level security;
alter table public.tasks enable row level security;
alter table public.test_cases enable row level security;
alter table public.test_case_requirements enable row level security;
alter table public.test_runs enable row level security;
alter table public.change_requests enable row level security;
alter table public.change_request_comments enable row level security;
alter table public.audit_log enable row level security;

-- profiles: see yourself and people on your teams; edit only yourself
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_project(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- projects
create policy projects_select on public.projects for select to authenticated
  using (public.is_member(id));
create policy projects_insert on public.projects for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy projects_update on public.projects for update to authenticated
  using (public.member_role(id) in ('team_lead', 'supervisor'));
create policy projects_delete on public.projects for delete to authenticated
  using (public.member_role(id) = 'team_lead');

-- members: visible to the team; only lead/supervisor manage (adding goes through add_member)
create policy members_select on public.project_members for select to authenticated
  using (public.is_member(project_id));
create policy members_delete on public.project_members for delete to authenticated
  using (public.member_role(project_id) in ('team_lead', 'supervisor') and user_id <> (select auth.uid()));

-- tables that carry project_id: any member reads and writes, only lead/supervisor delete
create policy modules_rw on public.modules for all to authenticated
  using (public.is_member(project_id)) with check (public.is_member(project_id));

create policy req_select on public.requirements for select to authenticated using (public.is_member(project_id));
create policy req_insert on public.requirements for insert to authenticated
  with check (public.is_member(project_id) and created_by = (select auth.uid()));
create policy req_update on public.requirements for update to authenticated
  using (public.is_member(project_id)) with check (public.is_member(project_id));
create policy req_delete on public.requirements for delete to authenticated
  using (public.member_role(project_id) in ('team_lead', 'supervisor'));

create policy tasks_select on public.tasks for select to authenticated using (public.is_member(project_id));
create policy tasks_insert on public.tasks for insert to authenticated with check (public.is_member(project_id));
create policy tasks_update on public.tasks for update to authenticated
  using (public.is_member(project_id)) with check (public.is_member(project_id));
create policy tasks_delete on public.tasks for delete to authenticated
  using (public.member_role(project_id) in ('team_lead', 'supervisor'));

create policy tc_select on public.test_cases for select to authenticated using (public.is_member(project_id));
create policy tc_insert on public.test_cases for insert to authenticated
  with check (public.is_member(project_id) and created_by = (select auth.uid()));
create policy tc_update on public.test_cases for update to authenticated
  using (public.is_member(project_id)) with check (public.is_member(project_id));
create policy tc_delete on public.test_cases for delete to authenticated
  using (public.member_role(project_id) in ('team_lead', 'supervisor'));

-- child tables: membership checked through the parent row
create policy rv_select on public.requirement_versions for select to authenticated
  using (public.is_member((select r.project_id from public.requirements r where r.id = requirement_id)));
-- no insert/update/delete policy: versions are written only by the trigger and never edited

create policy dep_select on public.requirement_dependencies for select to authenticated
  using (public.is_member((select r.project_id from public.requirements r where r.id = requirement_id)));
create policy dep_write on public.requirement_dependencies for insert to authenticated
  with check (
    public.is_member((select r.project_id from public.requirements r where r.id = requirement_id))
    and (select r.project_id from public.requirements r where r.id = requirement_id)
      = (select r.project_id from public.requirements r where r.id = depends_on_id));
create policy dep_delete on public.requirement_dependencies for delete to authenticated
  using (public.is_member((select r.project_id from public.requirements r where r.id = requirement_id)));

create policy tcr_select on public.test_case_requirements for select to authenticated
  using (public.is_member((select t.project_id from public.test_cases t where t.id = test_case_id)));
create policy tcr_insert on public.test_case_requirements for insert to authenticated
  with check (
    public.is_member((select t.project_id from public.test_cases t where t.id = test_case_id))
    and (select t.project_id from public.test_cases t where t.id = test_case_id)
      = (select r.project_id from public.requirements r where r.id = requirement_id));
create policy tcr_delete on public.test_case_requirements for delete to authenticated
  using (public.is_member((select t.project_id from public.test_cases t where t.id = test_case_id)));

create policy runs_select on public.test_runs for select to authenticated
  using (public.is_member((select t.project_id from public.test_cases t where t.id = test_case_id)));
create policy runs_insert on public.test_runs for insert to authenticated
  with check (run_by = (select auth.uid())
    and public.is_member((select t.project_id from public.test_cases t where t.id = test_case_id)));
-- no update/delete: run history is permanent

-- change requests: members propose; nobody updates directly (decide_change_request does it)
create policy cr_select on public.change_requests for select to authenticated using (public.is_member(project_id));
create policy cr_insert on public.change_requests for insert to authenticated
  with check (public.is_member(project_id) and proposed_by = (select auth.uid())
    and status = 'pending' and decided_by is null and decided_at is null
    and project_id = (select r.project_id from public.requirements r where r.id = requirement_id));

create policy crc_select on public.change_request_comments for select to authenticated
  using (public.is_member((select c.project_id from public.change_requests c where c.id = change_request_id)));
create policy crc_insert on public.change_request_comments for insert to authenticated
  with check (author_id = (select auth.uid())
    and public.is_member((select c.project_id from public.change_requests c where c.id = change_request_id)));

create policy audit_select on public.audit_log for select to authenticated using (public.is_member(project_id));
-- audit rows are written only by triggers

-- ---------- functions called from the app ----------
-- change impact analysis (RO2): dependent requirements up to 3 levels, plus their tasks and tests
create or replace function public.impact_of(req uuid)
returns table (level int, kind text, item_id uuid, code text, label text, via uuid)
language sql stable security invoker set search_path = '' as $$
  with recursive affected as (
    select r.id, 0 as level, null::uuid as via from public.requirements r where r.id = req
    union
    select d.requirement_id, a.level + 1, a.id
    from public.requirement_dependencies d join affected a on d.depends_on_id = a.id
    where a.level < 3
  ), dedup as (
    select distinct on (id) id, level, via from affected order by id, level
  )
  select a.level, 'requirement', r.id, r.code, r.title, a.via
    from dedup a join public.requirements r on r.id = a.id where a.level > 0
  union all
  select a.level, 'task', t.id, null, t.title, a.id
    from dedup a join public.tasks t on t.requirement_id = a.id
  union all
  select a.level, 'test_case', tc.id, tc.code, tc.title, a.id
    from dedup a join public.test_case_requirements l on l.requirement_id = a.id
    join public.test_cases tc on tc.id = l.test_case_id;
$$;

-- supervisor-only decision on a change request
create or replace function public.decide_change_request(cr uuid, approve boolean, comment text default null)
returns public.change_requests
language plpgsql security definer set search_path = '' as $$
declare c public.change_requests;
begin
  select * into c from public.change_requests where id = cr for update;
  if not found then raise exception 'Change request not found'; end if;
  if public.member_role(c.project_id) is distinct from 'supervisor' then
    raise exception 'Only the project supervisor can approve or reject a change request'
      using errcode = 'insufficient_privilege';
  end if;
  if c.status <> 'pending' then raise exception 'Change request % is already %', c.code, c.status; end if;

  if approve then
    -- snapshot what the change touched, then apply it
    update public.change_requests set impact = coalesce(
      (select jsonb_agg(to_jsonb(i)) from public.impact_of(c.requirement_id) i), '[]'::jsonb)
    where id = cr;

    perform set_config('reqweave.via_cr', 'on', true);
    perform set_config('reqweave.cr_id', cr::text, true);
    update public.requirements
      set title = c.proposed_title, description = c.proposed_description
      where id = c.requirement_id;
    perform set_config('reqweave.via_cr', '', true);
    perform set_config('reqweave.cr_id', '', true);

    -- every test that touched the changed requirement must be run again
    insert into public.test_runs (test_case_id, result, notes, run_by)
    select distinct i.item_id, 'not_run', 'Reset by approved ' || c.code, auth.uid()
    from public.impact_of(c.requirement_id) i where i.kind = 'test_case';
  end if;

  update public.change_requests
    set status = case when approve then 'approved' else 'rejected' end,
        decided_by = auth.uid(), decided_at = now()
    where id = cr returning * into c;

  if comment is not null and char_length(trim(comment)) > 0 then
    insert into public.change_request_comments (change_request_id, author_id, body)
    values (cr, auth.uid(), trim(comment));
  end if;
  return c;
end $$;

-- lead or supervisor adds an existing NexusTrace user to the team by email
create or replace function public.add_member(p uuid, member_email text, member_role text default 'student')
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid;
begin
  if public.member_role(p) not in ('team_lead', 'supervisor') or public.member_role(p) is null then
    raise exception 'Only the team lead or supervisor can add members' using errcode = 'insufficient_privilege';
  end if;
  if member_role not in ('student', 'team_lead', 'supervisor') then raise exception 'Unknown role'; end if;
  select id into uid from public.profiles where lower(email) = lower(trim(member_email));
  if uid is null then
    raise exception 'No NexusTrace account uses %. Ask them to sign in once first.', member_email;
  end if;
  insert into public.project_members (project_id, user_id, role) values (p, uid, member_role)
  on conflict (project_id, user_id) do update set role = excluded.role;
  insert into public.audit_log (project_id, actor_id, action, entity, entity_id, details)
  values (p, auth.uid(), 'insert', 'project_members', uid, jsonb_build_object('role', member_role));
end $$;

-- lock function access down to signed-in users
revoke execute on function public.impact_of(uuid) from public, anon;
revoke execute on function public.decide_change_request(uuid, boolean, text) from public, anon;
revoke execute on function public.add_member(uuid, text, text) from public, anon;
grant execute on function public.impact_of(uuid) to authenticated;
grant execute on function public.decide_change_request(uuid, boolean, text) to authenticated;
grant execute on function public.add_member(uuid, text, text) to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_project() from public, anon, authenticated;
revoke execute on function public.write_audit() from public, anon, authenticated;
revoke execute on function public.requirements_write_version() from public, anon, authenticated;
revoke all on all tables in schema public from anon;
