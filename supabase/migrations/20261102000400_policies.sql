alter table public.tasks          enable row level security;
alter table public.team_members   enable row level security;
alter table public.labels         enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_labels    enable row level security;
alter table public.comments       enable row level security;
alter table public.task_activity  enable row level security;

drop policy if exists tasks_select_own on public.tasks;
create policy tasks_select_own on public.tasks for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists tasks_insert_own on public.tasks;
create policy tasks_insert_own on public.tasks for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists tasks_update_own on public.tasks;
create policy tasks_update_own on public.tasks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists tasks_delete_own on public.tasks;
create policy tasks_delete_own on public.tasks for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists team_members_select_own on public.team_members;
create policy team_members_select_own on public.team_members for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists team_members_insert_own on public.team_members;
create policy team_members_insert_own on public.team_members for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists team_members_update_own on public.team_members;
create policy team_members_update_own on public.team_members for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists team_members_delete_own on public.team_members;
create policy team_members_delete_own on public.team_members for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists labels_select_own on public.labels;
create policy labels_select_own on public.labels for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists labels_insert_own on public.labels;
create policy labels_insert_own on public.labels for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists labels_update_own on public.labels;
create policy labels_update_own on public.labels for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists labels_delete_own on public.labels;
create policy labels_delete_own on public.labels for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists task_assignees_select_own on public.task_assignees;
create policy task_assignees_select_own on public.task_assignees for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists task_assignees_insert_own on public.task_assignees;
create policy task_assignees_insert_own on public.task_assignees for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists task_assignees_delete_own on public.task_assignees;
create policy task_assignees_delete_own on public.task_assignees for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists task_labels_select_own on public.task_labels;
create policy task_labels_select_own on public.task_labels for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists task_labels_insert_own on public.task_labels;
create policy task_labels_insert_own on public.task_labels for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists task_labels_delete_own on public.task_labels;
create policy task_labels_delete_own on public.task_labels for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists comments_select_own on public.comments;
create policy comments_select_own on public.comments for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists comments_update_own on public.comments;
create policy comments_update_own on public.comments for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own on public.comments for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists task_activity_select_own on public.task_activity;
create policy task_activity_select_own on public.task_activity for select to authenticated
  using ((select auth.uid()) = user_id);
