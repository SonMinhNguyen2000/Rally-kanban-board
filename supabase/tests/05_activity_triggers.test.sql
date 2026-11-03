-- Each activity kind is logged correctly, and reordering is not logged.
-- Run with: npx supabase test db. Everything is rolled back at the end.

begin;

\ir helpers/setup.psql

select tests.as_user('aaaaaaaa-0000-4000-8000-000000000000');

-- Fixture inserts above.
select is((select payload from public.task_activity where kind = 'created'), '{"title":"A task","status":"todo"}'::jsonb, 'create is logged');
select is((select payload ->> 'name' from public.task_activity where kind = 'assignee_added'), 'A member', 'assignee add is logged with the name');
select is((select payload ->> 'color' from public.task_activity where kind = 'label_added'), 'cobalt', 'label add is logged with the palette name');
select is((select payload ->> 'excerpt' from public.task_activity where kind = 'comment_added'), 'A comment', 'comment is logged with an excerpt');

update public.tasks set status = 'in_progress' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is((select payload from public.task_activity where kind = 'moved'), '{"from":"todo","to":"in_progress"}'::jsonb, 'move is logged with from and to');

update public.tasks set title = 'A task renamed' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is((select payload from public.task_activity where kind = 'title_edited'), '{"from":"A task","to":"A task renamed"}'::jsonb, 'rename is logged');

update public.tasks set description = 'Secret detail' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is((select payload from public.task_activity where kind = 'description_edited'), '{}'::jsonb, 'description edit is logged without copying the text');

update public.tasks set priority = 'high' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is((select payload from public.task_activity where kind = 'priority_changed'), '{"from":"normal","to":"high"}'::jsonb, 'priority change is logged');

update public.tasks set due_date = '2030-01-31' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is((select payload ->> 'to' from public.task_activity where kind = 'due_date_changed'), '2030-01-31', 'due date change is logged');

select is(tests.affected($$update public.tasks set position = 5 where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$), 1, 'position can be updated');
select is((select count(*)::int from public.task_activity where kind not in ('created','moved','title_edited','description_edited','priority_changed','due_date_changed','assignee_added','label_added','comment_added')), 0, 'a position-only update logs nothing');
select is((select count(*)::int from public.task_activity where task_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 9, 'exactly nine entries so far, none from the reorder');

update public.tasks set status = 'in_progress' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is((select count(*)::int from public.task_activity where kind = 'moved'), 1, 'a no-op status write logs nothing');

-- Removing a join row logs the removal.
delete from public.task_labels where task_id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is((select payload ->> 'name' from public.task_activity where kind = 'label_removed'), 'A label', 'label removal is logged');

-- Deleting a member logs the removal once, with the name still readable afterwards.
delete from public.team_members where id = 'aaaaaaaa-0000-4000-8000-000000000002';
select is((select count(*)::int from public.task_activity where kind = 'assignee_removed'), 1, 'member delete logs one removal');
select is((select payload ->> 'name' from public.task_activity where kind = 'assignee_removed'), 'A member', 'the deleted member''s name survives in history');
select is((select count(*)::int from public.task_assignees), 0, 'member delete removes the assignment');

-- Same for labels.
insert into public.task_labels (task_id, label_id) values ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000003');
delete from public.labels where id = 'aaaaaaaa-0000-4000-8000-000000000003';
select is((select count(*)::int from public.task_activity where kind = 'label_removed'), 2, 'label delete logs the removal once more');

select * from finish();

rollback;
