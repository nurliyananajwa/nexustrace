-- keep RLS helpers out of the public REST API
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
alter function public.is_member(uuid) set schema private;
alter function public.member_role(uuid) set schema private;
alter function public.shares_project(uuid) set schema private;
revoke execute on function private.is_member(uuid) from public, anon;
revoke execute on function private.member_role(uuid) from public, anon;
revoke execute on function private.shares_project(uuid) from public, anon;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.member_role(uuid) to authenticated;
grant execute on function private.shares_project(uuid) to authenticated;

create or replace function public.decide_change_request(cr uuid, approve boolean, comment text default null)
returns public.change_requests
language plpgsql security definer set search_path = '' as $$
declare c public.change_requests;
begin
  select * into c from public.change_requests where id = cr for update;
  if not found then raise exception 'Change request not found'; end if;
  if private.member_role(c.project_id) is distinct from 'supervisor' then
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

create or replace function public.add_member(p uuid, member_email text, member_role text default 'student')
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid; caller_role text := private.member_role(p); existing text;
begin
  if caller_role is null or caller_role not in ('team_lead', 'supervisor') then
    raise exception 'Only the team lead or supervisor can add members' using errcode = 'insufficient_privilege';
  end if;
  if member_role not in ('student', 'team_lead', 'supervisor') then raise exception 'Unknown role'; end if;
  select id into uid from public.profiles where lower(email) = lower(trim(member_email));
  if uid is null then
    raise exception 'No NexusTrace account uses %. Ask them to sign in once first.', member_email;
  end if;
  -- nobody changes their own role (stops a lead making themselves supervisor and self-approving)
  if uid = auth.uid() then
    raise exception 'You cannot change your own role' using errcode = 'insufficient_privilege';
  end if;
  select role into existing from public.project_members where project_id = p and user_id = uid;
  -- only a supervisor may change an existing member's role to or from supervisor
  if existing is not null and (existing = 'supervisor' or member_role = 'supervisor')
     and existing is distinct from member_role and caller_role <> 'supervisor' then
    raise exception 'Only the supervisor can change supervisor roles' using errcode = 'insufficient_privilege';
  end if;
  -- a lead may bring in the first supervisor, but once a team has one only a supervisor adds another
  if member_role = 'supervisor' and caller_role <> 'supervisor'
     and exists (select 1 from public.project_members where project_id = p and role = 'supervisor') then
    raise exception 'This team already has a supervisor' using errcode = 'insufficient_privilege';
  end if;
  insert into public.project_members (project_id, user_id, role) values (p, uid, member_role)
  on conflict (project_id, user_id) do update set role = excluded.role;
  insert into public.audit_log (project_id, actor_id, action, entity, entity_id, details)
  values (p, auth.uid(), case when existing is null then 'insert' else 'update' end, 'project_members', uid,
          jsonb_build_object('role', member_role, 'previous_role', existing));
end $$;

-- a team lead cannot remove the supervisor; nobody removes themselves through this policy
drop policy members_delete on public.project_members;
create policy members_delete on public.project_members for delete to authenticated
  using (user_id <> (select auth.uid()) and (
    private.member_role(project_id) = 'supervisor'
    or (private.member_role(project_id) = 'team_lead' and role <> 'supervisor')));
