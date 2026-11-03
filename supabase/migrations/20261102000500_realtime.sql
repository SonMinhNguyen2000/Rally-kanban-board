-- Realtime publication and replica identity.
--
-- By default the WAL records only the primary key of a deleted row, so Realtime cannot
-- apply a `user_id=eq.<uid>` subscription filter to a DELETE. REPLICA IDENTITY FULL records
-- the whole old row so that it can.
--
-- RLS cannot be evaluated against a row that no longer exists, so Realtime does not run
-- policies for DELETE. The app's filter keeps other tenants' delete events away. A client that
-- subscribes without a filter still receives them, with payload.old limited to primary key
-- columns, which is accepted because no content is exposed. supabase/tests/api_isolation.mjs
-- measures both.
alter table public.tasks          replica identity full;
alter table public.team_members   replica identity full;
alter table public.labels         replica identity full;
alter table public.task_assignees replica identity full;
alter table public.task_labels    replica identity full;
alter table public.comments       replica identity full;
alter table public.task_activity  replica identity full;

do $$
declare
  table_name text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach table_name in array array[
    'tasks', 'team_members', 'labels', 'task_assignees', 'task_labels', 'comments', 'task_activity'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;
