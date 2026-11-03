create index if not exists tasks_user_status_position_idx
  on public.tasks (user_id, status, position);

create index if not exists team_members_user_created_idx
  on public.team_members (user_id, created_at);

create unique index if not exists labels_user_name_unique_idx
  on public.labels (user_id, lower(btrim(name)));

create index if not exists task_assignees_user_member_idx
  on public.task_assignees (user_id, member_id);
create index if not exists task_labels_user_label_idx
  on public.task_labels (user_id, label_id);

create index if not exists comments_task_created_idx
  on public.comments (task_id, created_at);
create index if not exists task_activity_task_created_idx
  on public.task_activity (task_id, created_at, id);
