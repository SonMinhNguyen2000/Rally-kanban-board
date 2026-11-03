-- Check constraints and label name uniqueness.
-- Run with: npx supabase test db. Everything is rolled back at the end.

begin;

\ir helpers/setup.psql

-- Acting as B, who owns a label named "A label" from the shared fixtures.
select tests.as_user('bbbbbbbb-0000-4000-8000-000000000000');

select throws_ok($$insert into public.tasks (title) values ('   ')$$, '23514', null, 'blank title rejected');
select throws_ok($$insert into public.tasks (title) values (repeat('x', 201))$$, '23514', null, 'over-long title rejected');
select throws_ok($$insert into public.tasks (title, status) values ('x', 'archived')$$, '23514', null, 'unknown status rejected');
select throws_ok($$insert into public.tasks (title, priority) values ('x', 'urgent')$$, '23514', null, 'unknown priority rejected');
select throws_ok($$insert into public.tasks (title, position) values ('x', 'Infinity')$$, '23514', null, 'infinite position rejected');
select throws_ok($$insert into public.tasks (title, position) values ('x', 'NaN')$$, '23514', null, 'NaN position rejected');
select throws_ok($$insert into public.comments (task_id, body) values ('bbbbbbbb-0000-4000-8000-000000000001', '  ')$$, '23514', null, 'blank comment rejected');
select throws_ok($$insert into public.team_members (name, color) values ('x', '#ff0000')$$, '23514', null, 'hex member colour rejected');
select throws_ok($$insert into public.labels (name, color) values ('x', 'magenta')$$, '23514', null, 'unknown label colour rejected');
select throws_ok($$insert into public.labels (name) values ('  a LABEL ')$$, '23505', null, 'label names are unique per user, ignoring case and spaces');

select * from finish();

rollback;
