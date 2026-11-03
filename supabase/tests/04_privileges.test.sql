-- Column grants, append-only history, TRUNCATE, the private schema and the anon role.
-- Run with: npx supabase test db. Everything is rolled back at the end.

begin;

\ir helpers/setup.psql

-- Acting as A, because these apply even to a user's own rows.
select tests.as_user('aaaaaaaa-0000-4000-8000-000000000000');

select throws_ok($$update public.tasks set user_id = 'bbbbbbbb-0000-4000-8000-000000000000' where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$, '42501', null, 'owner of a task cannot be changed');
select throws_ok($$update public.tasks set id = gen_random_uuid() where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$, '42501', null, 'task id cannot be changed');
select throws_ok($$update public.tasks set created_at = now() where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$, '42501', null, 'created_at cannot be changed');
select throws_ok($$update public.tasks set updated_at = now() where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$, '42501', null, 'updated_at cannot be changed');
select throws_ok($$insert into public.tasks (title, created_at) values ('x', '2000-01-01')$$, '42501', null, 'created_at cannot be set on insert');
select throws_ok($$update public.comments set user_id = 'bbbbbbbb-0000-4000-8000-000000000000' where id = 'aaaaaaaa-0000-4000-8000-000000000004'$$, '42501', null, 'owner of a comment cannot be changed');
select throws_ok($$update public.comments set task_id = 'aaaaaaaa-0000-4000-8000-000000000001' where id = 'aaaaaaaa-0000-4000-8000-000000000004'$$, '42501', null, 'a comment cannot move to another task');
select throws_ok($$update public.team_members set user_id = 'bbbbbbbb-0000-4000-8000-000000000000' where id = 'aaaaaaaa-0000-4000-8000-000000000002'$$, '42501', null, 'owner of a member cannot be changed');
select throws_ok($$update public.labels set user_id = 'bbbbbbbb-0000-4000-8000-000000000000' where id = 'aaaaaaaa-0000-4000-8000-000000000003'$$, '42501', null, 'owner of a label cannot be changed');
select throws_ok($$update public.task_assignees set member_id = member_id$$, '42501', null, 'join rows cannot be edited: task_assignees');
select throws_ok($$update public.task_labels set label_id = label_id$$, '42501', null, 'join rows cannot be edited: task_labels');

-- History cannot be forged or erased, even by the task's owner.
select throws_ok($$insert into public.task_activity (task_id, user_id, kind) values ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000000', 'moved')$$, '42501', null, 'owner cannot forge activity');
select throws_ok($$update public.task_activity set kind = 'created'$$, '42501', null, 'owner cannot rewrite activity');
select throws_ok($$delete from public.task_activity$$, '42501', null, 'owner cannot erase activity');

-- TRUNCATE is not covered by RLS, so it must be denied by privilege.
select throws_ok($$truncate public.tasks cascade$$, '42501', null, 'authenticated cannot truncate');

-- Trigger functions are out of reach.
select throws_ok($$select private.log_comment_added()$$, '42501', null, 'private schema is not reachable');

-- Forced into anon, no table is reachable at all.
select tests.as_anon();
select throws_ok($$select * from public.tasks$$, '42501', null, 'anon cannot read tasks');
select throws_ok($$select * from public.team_members$$, '42501', null, 'anon cannot read team_members');
select throws_ok($$select * from public.labels$$, '42501', null, 'anon cannot read labels');
select throws_ok($$select * from public.task_assignees$$, '42501', null, 'anon cannot read task_assignees');
select throws_ok($$select * from public.task_labels$$, '42501', null, 'anon cannot read task_labels');
select throws_ok($$select * from public.comments$$, '42501', null, 'anon cannot read comments');
select throws_ok($$select * from public.task_activity$$, '42501', null, 'anon cannot read task_activity');
select throws_ok($$insert into public.tasks (title) values ('x')$$, '42501', null, 'anon cannot create tasks');

select * from finish();

rollback;
