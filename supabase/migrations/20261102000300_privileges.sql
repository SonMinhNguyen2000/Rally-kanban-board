revoke all on public.tasks, public.team_members, public.labels, public.task_assignees,
              public.task_labels, public.comments, public.task_activity
  from anon, authenticated;

grant select, delete on public.tasks to authenticated;
grant insert (id, title, description, status, priority, due_date, position, user_id) on public.tasks to authenticated;
grant update (title, description, status, priority, due_date, position) on public.tasks to authenticated;

grant select, delete on public.team_members to authenticated;
grant insert (id, name, color, user_id) on public.team_members to authenticated;
grant update (name, color) on public.team_members to authenticated;

grant select, delete on public.labels to authenticated;
grant insert (id, name, color, user_id) on public.labels to authenticated;
grant update (name, color) on public.labels to authenticated;

grant select, delete on public.task_assignees to authenticated;
grant insert (task_id, member_id, user_id) on public.task_assignees to authenticated;

grant select, delete on public.task_labels to authenticated;
grant insert (task_id, label_id, user_id) on public.task_labels to authenticated;

grant select, delete on public.comments to authenticated;
grant insert (id, task_id, body, user_id) on public.comments to authenticated;
grant update (body) on public.comments to authenticated;

grant select on public.task_activity to authenticated;
