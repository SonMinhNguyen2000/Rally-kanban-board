-- B cannot change, remove, impersonate or link to A's rows, and A's rows survive the attempts.
-- Run with: npx supabase test db. Everything is rolled back at the end.

begin;

\ir helpers/setup.psql

-- Acting as B, the would-be attacker, until A checks the damage at the end.
select tests.as_user('bbbbbbbb-0000-4000-8000-000000000000');

select is(tests.affected($$update public.tasks set title = 'hacked' where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$), 0, 'B cannot update A''s task');
select is(tests.affected($$delete from public.tasks where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$), 0, 'B cannot delete A''s task');
select is(tests.affected($$update public.team_members set name = 'hacked' where id = 'aaaaaaaa-0000-4000-8000-000000000002'$$), 0, 'B cannot update A''s member');
select is(tests.affected($$delete from public.team_members where id = 'aaaaaaaa-0000-4000-8000-000000000002'$$), 0, 'B cannot delete A''s member');
select is(tests.affected($$update public.labels set name = 'hacked' where id = 'aaaaaaaa-0000-4000-8000-000000000003'$$), 0, 'B cannot update A''s label');
select is(tests.affected($$delete from public.labels where id = 'aaaaaaaa-0000-4000-8000-000000000003'$$), 0, 'B cannot delete A''s label');
select is(tests.affected($$delete from public.task_assignees where task_id = 'aaaaaaaa-0000-4000-8000-000000000001'$$), 0, 'B cannot remove A''s assignee');
select is(tests.affected($$delete from public.task_labels where task_id = 'aaaaaaaa-0000-4000-8000-000000000001'$$), 0, 'B cannot remove A''s task label');
select is(tests.affected($$update public.comments set body = 'hacked' where id = 'aaaaaaaa-0000-4000-8000-000000000004'$$), 0, 'B cannot update A''s comment');
select is(tests.affected($$delete from public.comments where id = 'aaaaaaaa-0000-4000-8000-000000000004'$$), 0, 'B cannot delete A''s comment');

-- Creating rows under A's identity.
select throws_ok($$insert into public.tasks (title, user_id) values ('x', 'aaaaaaaa-0000-4000-8000-000000000000')$$, '42501', null, 'B cannot create a task owned by A');
select throws_ok($$insert into public.team_members (name, user_id) values ('x', 'aaaaaaaa-0000-4000-8000-000000000000')$$, '42501', null, 'B cannot create a member owned by A');
select throws_ok($$insert into public.labels (name, user_id) values ('x', 'aaaaaaaa-0000-4000-8000-000000000000')$$, '42501', null, 'B cannot create a label owned by A');
select throws_ok($$insert into public.comments (task_id, body, user_id) values ('aaaaaaaa-0000-4000-8000-000000000001', 'x', 'aaaaaaaa-0000-4000-8000-000000000000')$$, '42501', null, 'B cannot comment on A''s task as A');
select throws_ok($$insert into public.task_assignees (task_id, member_id, user_id) values ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000000')$$, '42501', null, 'B cannot add an assignee as A');
select throws_ok($$insert into public.task_labels (task_id, label_id, user_id) values ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000000')$$, '42501', null, 'B cannot add a task label as A');

-- Linking across tenants under B's own identity: stopped by the composite foreign keys.
select throws_ok($$insert into public.comments (task_id, body) values ('aaaaaaaa-0000-4000-8000-000000000001', 'x')$$, '23503', null, 'B cannot comment on A''s task');
select throws_ok($$insert into public.task_assignees (task_id, member_id) values ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002')$$, '23503', null, 'B cannot assign B''s member to A''s task');
select throws_ok($$insert into public.task_assignees (task_id, member_id) values ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002')$$, '23503', null, 'B cannot assign A''s member to B''s task');
select throws_ok($$insert into public.task_labels (task_id, label_id) values ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000003')$$, '23503', null, 'B cannot put B''s label on A''s task');
select throws_ok($$insert into public.task_labels (task_id, label_id) values ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000003')$$, '23503', null, 'B cannot put A''s label on B''s task');

-- A's rows came through all of that unchanged.
select tests.as_user('aaaaaaaa-0000-4000-8000-000000000000');
select is((select title from public.tasks where id = 'aaaaaaaa-0000-4000-8000-000000000001'), 'A task', 'A''s task is intact');
select is((select name from public.team_members where id = 'aaaaaaaa-0000-4000-8000-000000000002'), 'A member', 'A''s member is intact');
select is((select name from public.labels where id = 'aaaaaaaa-0000-4000-8000-000000000003'), 'A label', 'A''s label is intact');
select is((select body from public.comments where id = 'aaaaaaaa-0000-4000-8000-000000000004'), 'A comment', 'A''s comment is intact');
select is((select count(*)::int from public.task_assignees), 1, 'A''s assignee is intact');
select is((select count(*)::int from public.task_labels), 1, 'A''s task label is intact');

select * from finish();

rollback;
