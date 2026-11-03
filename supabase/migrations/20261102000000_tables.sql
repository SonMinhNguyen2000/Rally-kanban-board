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

  position    double precision not null,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint tasks_title_not_blank check (title ~ '\S'),
  constraint tasks_title_length check (char_length(title) <= 200),
  constraint tasks_description_length check (char_length(description) <= 10000),
  constraint tasks_status_valid check (status in ('todo', 'in_progress', 'in_review', 'done')),
  constraint tasks_priority_valid check (priority in ('low', 'normal', 'high')),

  constraint tasks_position_finite check (position > '-Infinity' and position < 'Infinity'),

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

  constraint labels_color_palette check (color in (
    'rose', 'rust', 'ochre', 'olive', 'moss', 'teal', 'azure', 'cobalt', 'plum', 'graphite'
  )),
  constraint labels_id_user_id_key unique (id, user_id)
);

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
