-- Indexes for the board, the pickers and the task detail panel.
--
-- Foreign keys that lead a primary key or unique index are already covered:
--   task_assignees (task_id, ...), task_labels (task_id, ...), and the owner columns of
--   tasks, team_members and labels through the indexes below.

-- Board query: one user's tasks, per column, in order. Also covers tasks.user_id.
create index if not exists tasks_user_status_position_idx
  on public.tasks (user_id, status, position);

-- Member and label pickers, in creation order.
create index if not exists team_members_user_created_idx
  on public.team_members (user_id, created_at);

-- One label per name per owner, ignoring case and surrounding spaces.
create unique index if not exists labels_user_name_unique_idx
  on public.labels (user_id, lower(btrim(name)));

-- Reverse lookups, and the cascade when a member or label is deleted.
create index if not exists task_assignees_user_member_idx
  on public.task_assignees (user_id, member_id);
create index if not exists task_labels_user_label_idx
  on public.task_labels (user_id, label_id);

-- Task detail panel: comments and timeline for one task, oldest first.
create index if not exists comments_task_created_idx
  on public.comments (task_id, created_at);
create index if not exists task_activity_task_created_idx
  on public.task_activity (task_id, created_at, id);
