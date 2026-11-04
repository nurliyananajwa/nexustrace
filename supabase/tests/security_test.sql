-- NexusTrace security test. Runs inside one transaction and leaves no data behind.
-- Paste into the Supabase SQL editor. Every row in the result should show ok = true.
-- Result on 3 Nov 2026: 10 of 10 passed.
begin;
create temp table t_res(n serial, step text, ok boolean, info text);
grant all on t_res to authenticated; grant usage on sequence t_res_n_seq to authenticated;
insert into auth.users (id, email, raw_user_meta_data, aud, role) values
('00000000-0000-0000-0000-0000000000a1','lead@test.my','{}','authenticated','authenticated'),
('00000000-0000-0000-0000-0000000000a2','student@test.my','{}','authenticated','authenticated'),
('00000000-0000-0000-0000-0000000000a3','sup@test.my','{}','authenticated','authenticated'),
('00000000-0000-0000-0000-0000000000a4','out@test.my','{}','authenticated','authenticated'),
('00000000-0000-0000-0000-0000000000a5','sock@test.my','{}','authenticated','authenticated');
set local role authenticated;
do $$ begin
  perform set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}',true);
  insert into public.projects(id,name) values ('00000000-0000-0000-0000-00000000bb01','Test FYP');
  perform public.add_member('00000000-0000-0000-0000-00000000bb01','sup@test.my','supervisor');
  perform public.add_member('00000000-0000-0000-0000-00000000bb01','student@test.my','student');
  insert into public.requirements(id,project_id,code,title,status) values ('00000000-0000-0000-0000-00000000cc01','00000000-0000-0000-0000-00000000bb01','FR01','Users sign in','approved');
  insert into public.change_requests(id,project_id,requirement_id,code,proposed_title,reason) values ('00000000-0000-0000-0000-00000000ee01','00000000-0000-0000-0000-00000000bb01','00000000-0000-0000-0000-00000000cc01','CR01','Users sign in with Google','More precise wording');
  begin perform public.add_member('00000000-0000-0000-0000-00000000bb01','lead@test.my','supervisor');
    insert into t_res(step,ok,info) values ('lead promotes self', false, 'allowed!');
  exception when others then insert into t_res(step,ok,info) values ('lead promotes self', true, sqlerrm); end;
  begin perform public.add_member('00000000-0000-0000-0000-00000000bb01','sock@test.my','supervisor');
    insert into t_res(step,ok,info) values ('lead adds 2nd supervisor', false, 'allowed!');
  exception when others then insert into t_res(step,ok,info) values ('lead adds 2nd supervisor', true, sqlerrm); end;
  begin perform public.add_member('00000000-0000-0000-0000-00000000bb01','sup@test.my','student');
    insert into t_res(step,ok,info) values ('lead demotes supervisor', false, 'allowed!');
  exception when others then insert into t_res(step,ok,info) values ('lead demotes supervisor', true, sqlerrm); end;
  delete from public.project_members where user_id='00000000-0000-0000-0000-0000000000a3';
  insert into t_res(step,ok,info) values ('lead removes supervisor', (select count(*) from public.project_members where role='supervisor')=1, 'supervisors left: '||(select count(*) from public.project_members where role='supervisor'));
  begin perform public.decide_change_request('00000000-0000-0000-0000-00000000ee01', true);
    insert into t_res(step,ok,info) values ('lead approves CR', false, 'allowed!');
  exception when others then insert into t_res(step,ok,info) values ('lead approves CR', true, sqlerrm); end;
end $$;
do $$ begin
  perform set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}',true);
  begin perform public.add_member('00000000-0000-0000-0000-00000000bb01','out@test.my','student');
    insert into t_res(step,ok,info) values ('student adds member', false, 'allowed!');
  exception when others then insert into t_res(step,ok,info) values ('student adds member', true, sqlerrm); end;
  begin update public.requirements set title='Changed silently' where id='00000000-0000-0000-0000-00000000cc01';
    insert into t_res(step,ok,info) values ('student edits approved req', false, 'allowed!');
  exception when others then insert into t_res(step,ok,info) values ('student edits approved req', true, sqlerrm); end;
end $$;
do $$ begin
  perform set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}',true);
  insert into t_res(step,ok,info) values ('outsider sees anything', (select count(*) from public.projects)+(select count(*) from public.requirements)=0, 'rows visible: '||((select count(*) from public.projects)+(select count(*) from public.requirements)));
end $$;
do $$ begin
  perform set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}',true);
  perform public.decide_change_request('00000000-0000-0000-0000-00000000ee01', true);
  insert into t_res(step,ok,info) values ('supervisor approves', (select current_version from public.requirements where id='00000000-0000-0000-0000-00000000cc01')=2, (select title from public.requirements where id='00000000-0000-0000-0000-00000000cc01'));
end $$;
reset role;
select step, ok, info from t_res order by n;
rollback;
