-- Maintenance and activity triggers. task_activity is written only from here, so history
-- cannot be forged or skipped by a client.

-- Trigger functions live outside the schemas exposed by the API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Maintenance triggers
-- -----------------------------------------------------------------------------

-- Stamps updated_at on any update that changes the row. Fires BEFORE UPDATE on tasks.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Places a new task at the bottom of its column when the client sends no position.
-- Fires BEFORE INSERT on tasks.
-- Runs as the caller, so RLS limits the lookup to the caller's own rows.
create or replace function private.set_task_position()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.position := coalesce(
    (select max(t.position) from public.tasks t
      where t.user_id = new.user_id and t.status = new.status),
    0
  ) + 1024;
  return new;
end;
$$;

create or replace trigger tasks_set_updated_at
  before update on public.tasks
  for each row
  when (old.* is distinct from new.*)
  execute function private.set_updated_at();

create or replace trigger tasks_set_position
  before insert on public.tasks
  for each row
  when (new.position is null)
  execute function private.set_task_position();

-- -----------------------------------------------------------------------------
-- Activity triggers
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER lets these write to task_activity, which clients have no write access
-- to. search_path is empty and every name is qualified, so a caller cannot redirect them.
-- The actor is taken from the row, not auth.uid(), so changes made outside a user session
-- are logged correctly too.

-- Logs task creation and each changed field as its own entry. Fires AFTER INSERT or UPDATE on tasks.
create or replace function private.log_task_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.task_activity (task_id, user_id, kind, payload)
    values (new.id, new.user_id, 'created',
            jsonb_build_object('title', new.title, 'status', new.status));
    return new;
  end if;

  -- position is deliberately absent: reordering is not history.
  if new.title is distinct from old.title then
    insert into public.task_activity (task_id, user_id, kind, payload)
    values (new.id, new.user_id, 'title_edited',
            jsonb_build_object('from', old.title, 'to', new.title));
  end if;

  if new.description is distinct from old.description then
    insert into public.task_activity (task_id, user_id, kind)
    values (new.id, new.user_id, 'description_edited');
  end if;

  if new.status is distinct from old.status then
    insert into public.task_activity (task_id, user_id, kind, payload)
    values (new.id, new.user_id, 'moved',
            jsonb_build_object('from', old.status, 'to', new.status));
  end if;

  if new.priority is distinct from old.priority then
    insert into public.task_activity (task_id, user_id, kind, payload)
    values (new.id, new.user_id, 'priority_changed',
            jsonb_build_object('from', old.priority, 'to', new.priority));
  end if;

  if new.due_date is distinct from old.due_date then
    insert into public.task_activity (task_id, user_id, kind, payload)
    values (new.id, new.user_id, 'due_date_changed',
            jsonb_build_object('from', old.due_date, 'to', new.due_date));
  end if;

  return new;
end;
$$;

-- Logs a member being assigned to or removed from a task. Fires AFTER INSERT or DELETE on
-- task_assignees.
--
-- On removal the INSERT ... SELECT finds nothing, and so logs nothing, in two cascades:
--   * the task is being deleted, so its history is going too and a new row would violate
--     the foreign key;
--   * the member is being deleted, which private.log_member_delete has already logged
--     while the name could still be read.
create or replace function private.log_assignee_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.task_activity (task_id, user_id, kind, payload)
    select new.task_id, new.user_id, 'assignee_added',
           jsonb_build_object('member_id', m.id, 'name', m.name, 'color', m.color)
      from public.team_members m
     where m.id = new.member_id and m.user_id = new.user_id;
    return new;
  end if;

  insert into public.task_activity (task_id, user_id, kind, payload)
  select old.task_id, old.user_id, 'assignee_removed',
         jsonb_build_object('member_id', m.id, 'name', m.name, 'color', m.color)
    from public.team_members m
   where m.id = old.member_id and m.user_id = old.user_id
     and exists (select 1 from public.tasks t where t.id = old.task_id);
  return old;
end;
$$;

-- Logs a label being added to or removed from a task. Same two cascade cases as
-- private.log_assignee_change.
create or replace function private.log_label_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.task_activity (task_id, user_id, kind, payload)
    select new.task_id, new.user_id, 'label_added',
           jsonb_build_object('label_id', l.id, 'name', l.name, 'color', l.color)
      from public.labels l
     where l.id = new.label_id and l.user_id = new.user_id;
    return new;
  end if;

  insert into public.task_activity (task_id, user_id, kind, payload)
  select old.task_id, old.user_id, 'label_removed',
         jsonb_build_object('label_id', l.id, 'name', l.name, 'color', l.color)
    from public.labels l
   where l.id = old.label_id and l.user_id = old.user_id
     and exists (select 1 from public.tasks t where t.id = old.task_id);
  return old;
end;
$$;

-- BEFORE DELETE, because by the time the cascade reaches the join rows the member row is gone
-- and its name can no longer be read.
--
-- The join to tasks matters when a whole account is deleted. That cascade removes the task
-- first and reaches the join rows only at the end of the statement, so this trigger can still
-- see a join row whose task is gone. Logging against it would violate task_activity_task_fk
-- and abort the account delete.
create or replace function private.log_member_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.task_activity (task_id, user_id, kind, payload)
  select a.task_id, a.user_id, 'assignee_removed',
         jsonb_build_object('member_id', old.id, 'name', old.name, 'color', old.color)
    from public.task_assignees a
    join public.tasks t on t.id = a.task_id
   where a.member_id = old.id and a.user_id = old.user_id;
  return old;
end;
$$;

-- Same as private.log_member_delete, for labels.
create or replace function private.log_label_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.task_activity (task_id, user_id, kind, payload)
  select tl.task_id, tl.user_id, 'label_removed',
         jsonb_build_object('label_id', old.id, 'name', old.name, 'color', old.color)
    from public.task_labels tl
    join public.tasks t on t.id = tl.task_id
   where tl.label_id = old.id and tl.user_id = old.user_id;
  return old;
end;
$$;

-- Logs a new comment with a short excerpt. Fires AFTER INSERT on comments.
create or replace function private.log_comment_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.task_activity (task_id, user_id, kind, payload)
  values (new.task_id, new.user_id, 'comment_added',
          jsonb_build_object('comment_id', new.id, 'excerpt', left(new.body, 140)));
  return new;
end;
$$;

-- Trigger functions cannot be called directly, but nothing needs EXECUTE on them either.
revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.set_task_position() from public, anon, authenticated;
revoke all on function private.log_task_change() from public, anon, authenticated;
revoke all on function private.log_assignee_change() from public, anon, authenticated;
revoke all on function private.log_label_change() from public, anon, authenticated;
revoke all on function private.log_member_delete() from public, anon, authenticated;
revoke all on function private.log_label_delete() from public, anon, authenticated;
revoke all on function private.log_comment_added() from public, anon, authenticated;

create or replace trigger tasks_log_insert
  after insert on public.tasks
  for each row execute function private.log_task_change();

-- UPDATE OF skips the function altogether for a position-only update.
create or replace trigger tasks_log_update
  after update of title, description, status, priority, due_date on public.tasks
  for each row execute function private.log_task_change();

create or replace trigger task_assignees_log
  after insert or delete on public.task_assignees
  for each row execute function private.log_assignee_change();

create or replace trigger task_labels_log
  after insert or delete on public.task_labels
  for each row execute function private.log_label_change();

create or replace trigger team_members_log_delete
  before delete on public.team_members
  for each row execute function private.log_member_delete();

create or replace trigger labels_log_delete
  before delete on public.labels
  for each row execute function private.log_label_delete();

create or replace trigger comments_log_insert
  after insert on public.comments
  for each row execute function private.log_comment_added();
