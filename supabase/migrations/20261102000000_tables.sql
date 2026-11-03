-- Tables, with their column defaults and check constraints.
--
-- Tenancy model: each anonymous guest is one auth.users row and one tenant.
-- Every table carries user_id, and three independent layers keep tenants apart:
--
--   1. Row Level Security: every operation is scoped to (select auth.uid()) = user_id.
--      See the policies migration.
--   2. Composite foreign keys: a child row's (parent_id, user_id) must match a parent
--      row with the same owner, so a guessed UUID from another tenant cannot be linked.
--      Defined here.
--   3. Column grants: the owner and server-managed columns are not client-writable.
--      See the privileges migration.

-- Supabase grants ALL on new public tables to anon and authenticated. This has to run before
-- the tables exist, so that neither they nor task_activity's identity sequence ever hold
-- those grants, and a table added later is unreachable until it is granted access on purpose.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  status      text not null default 'todo',
  priority    text not null default 'normal',
  due_date    date,
  -- Fractional sort key within a (user_id, status) column. Left null on insert, it is
  -- assigned by private.set_task_position.
  position    double precision not null,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint tasks_title_not_blank check (title ~ '\S'),
  constraint tasks_title_length check (char_length(title) <= 200),
  constraint tasks_description_length check (char_length(description) <= 10000),
  constraint tasks_status_valid check (status in ('todo', 'in_progress', 'in_review', 'done')),
  constraint tasks_priority_valid check (priority in ('low', 'normal', 'high')),
  -- Rejects Infinity, -Infinity and NaN (Postgres orders NaN above Infinity).
  constraint tasks_position_finite check (position > '-Infinity' and position < 'Infinity'),
  -- Target of the composite foreign keys below.
  constraint tasks_id_user_id_key unique (id, user_id)
);

create table if not exists public.team_members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text not null default 'graphite',
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint team_members_name_not_blank check (name ~ '\S'),
  constraint team_members_name_length check (char_length(name) <= 80),
  -- A palette name, because each one has separate light and dark values in tokens.css.
  constraint team_members_color_palette check (color in (
    'rose', 'rust', 'ochre', 'olive', 'moss', 'teal', 'azure', 'cobalt', 'plum', 'graphite'
  )),
  constraint team_members_id_user_id_key unique (id, user_id)
);

create table if not exists public.labels (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text not null default 'graphite',
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint labels_name_not_blank check (name ~ '\S'),
  constraint labels_name_length check (char_length(name) <= 50),
  -- A palette name, because each one has separate light and dark values in tokens.css.
  constraint labels_color_palette check (color in (
    'rose', 'rust', 'ochre', 'olive', 'moss', 'teal', 'azure', 'cobalt', 'plum', 'graphite'
  )),
  constraint labels_id_user_id_key unique (id, user_id)
);

-- user_id on the tables below has no direct foreign key to auth.users. It is tied to the
-- owner through the composite keys, and account deletion reaches these rows through them.

create table if not exists public.task_assignees (
  task_id    uuid not null,
  member_id  uuid not null,
  user_id    uuid not null default auth.uid(),
  created_at timestamptz not null default now(),

  primary key (task_id, member_id),
  constraint task_assignees_task_fk foreign key (task_id, user_id)
    references public.tasks (id, user_id) on delete cascade,
  constraint task_assignees_member_fk foreign key (member_id, user_id)
    references public.team_members (id, user_id) on delete cascade
);

create table if not exists public.task_labels (
  task_id    uuid not null,
  label_id   uuid not null,
  user_id    uuid not null default auth.uid(),
  created_at timestamptz not null default now(),

  primary key (task_id, label_id),
  constraint task_labels_task_fk foreign key (task_id, user_id)
    references public.tasks (id, user_id) on delete cascade,
  constraint task_labels_label_fk foreign key (label_id, user_id)
    references public.labels (id, user_id) on delete cascade
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null,
  user_id    uuid not null default auth.uid(),
  body       text not null,
  created_at timestamptz not null default now(),

  constraint comments_body_not_blank check (body ~ '\S'),
  constraint comments_body_length check (char_length(body) <= 5000),
  constraint comments_task_fk foreign key (task_id, user_id)
    references public.tasks (id, user_id) on delete cascade
);

-- Append-only history, written only by the triggers migration.
-- Payload by kind:
--   created                              { title, status }
--   title_edited                         { from, to }
--   description_edited                   { }  (the text itself is not copied)
--   moved, priority_changed,
--   due_date_changed                     { from, to }
--   assignee_added, assignee_removed     { member_id, name, color (palette name) }
--   label_added, label_removed           { label_id, name, color (palette name) }
--   comment_added                        { comment_id, excerpt }
-- Names are copied, so an entry still reads correctly after the member or label is gone.
create table if not exists public.task_activity (
  id         bigint generated always as identity primary key,
  task_id    uuid not null,
  user_id    uuid not null,
  kind       text not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint task_activity_kind_valid check (kind in (
    'created', 'title_edited', 'description_edited', 'moved', 'priority_changed',
    'due_date_changed', 'assignee_added', 'assignee_removed', 'label_added',
    'label_removed', 'comment_added'
  )),
  constraint task_activity_task_fk foreign key (task_id, user_id)
    references public.tasks (id, user_id) on delete cascade
);
