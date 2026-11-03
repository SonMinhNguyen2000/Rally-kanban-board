-- B cannot see any of A's rows, in any table, by listing or by id.
-- Run with: npx supabase test db. Everything is rolled back at the end.

begin;

\ir helpers/setup.psql

select tests.as_user('bbbbbbbb-0000-4000-8000-000000000000');

select is((select count(*)::int from public.tasks where user_id <> auth.uid()), 0, 'B reads no foreign tasks');
select is((select count(*)::int from public.team_members where user_id <> auth.uid()), 0, 'B reads no foreign team_members');
select is((select count(*)::int from public.labels where user_id <> auth.uid()), 0, 'B reads no foreign labels');
select is((select count(*)::int from public.task_assignees where user_id <> auth.uid()), 0, 'B reads no foreign task_assignees');
select is((select count(*)::int from public.task_labels where user_id <> auth.uid()), 0, 'B reads no foreign task_labels');
select is((select count(*)::int from public.comments where user_id <> auth.uid()), 0, 'B reads no foreign comments');
select is((select count(*)::int from public.task_activity where user_id <> auth.uid()), 0, 'B reads no foreign task_activity');

select is((select count(*)::int from public.tasks where id = 'aaaaaaaa-0000-4000-8000-000000000001'), 0, 'B cannot fetch A''s task by id');
select is((select count(*)::int from public.task_activity where task_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 0, 'B cannot fetch A''s timeline by task id');

select is((select count(*)::int from public.tasks), 1, 'B sees exactly B''s own task');

select * from finish();

rollback;
