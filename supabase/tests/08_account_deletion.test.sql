-- Deleting an account cascades through everything, without tripping a trigger.
-- Run with: npx supabase test db. Everything is rolled back at the end.

begin;

\ir helpers/setup.psql

select tests.as_user('bbbbbbbb-0000-4000-8000-000000000000');
insert into public.task_assignees (task_id, member_id) values ('bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002');
insert into public.task_labels (task_id, label_id) values ('bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000003');
insert into public.comments (task_id, body) values ('bbbbbbbb-0000-4000-8000-000000000001', 'Goes with the account');

select tests.as_admin();
select lives_ok($$delete from auth.users where id = 'bbbbbbbb-0000-4000-8000-000000000000'$$, 'deleting an account succeeds');
select is((select count(*)::int from public.tasks where user_id = 'bbbbbbbb-0000-4000-8000-000000000000'), 0, 'account delete removes tasks');
select is((select count(*)::int from public.team_members where user_id = 'bbbbbbbb-0000-4000-8000-000000000000'), 0, 'account delete removes members');
select is((select count(*)::int from public.labels where user_id = 'bbbbbbbb-0000-4000-8000-000000000000'), 0, 'account delete removes labels');
select is((select count(*)::int from public.comments where user_id = 'bbbbbbbb-0000-4000-8000-000000000000'), 0, 'account delete removes comments');
select is((select count(*)::int from public.task_activity where user_id = 'bbbbbbbb-0000-4000-8000-000000000000'), 0, 'account delete removes history');
select isnt((select count(*)::int from public.tasks where user_id = 'aaaaaaaa-0000-4000-8000-000000000000'), 0, 'the other user''s tasks remain');

select * from finish();

rollback;
