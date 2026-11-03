-- Local-only demo data. Every row is owned by an anonymous guest, so the seed
-- attaches the same complete board to each local guest account.

create schema if not exists private;

create or replace function private.seed_demo_data(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  maya uuid;
  theo uuid;
  priya uuid;
  jonah uuid;
  sofia uuid;
  marcus uuid;
  design_label uuid;
  engineering_label uuid;
  research_label uuid;
  growth_label uuid;
  urgent_label uuid;
  accessibility_label uuid;
  planning_label uuid;
  launch_label uuid;
  task_discovery uuid;
  task_wireframes uuid;
  task_research uuid;
  task_copy uuid;
  task_api uuid;
  task_auth uuid;
  task_qa uuid;
  task_mobile uuid;
  task_release uuid;
  task_metrics uuid;
  task_docs uuid;
  task_archive uuid;
begin
  if exists (select 1 from public.tasks where user_id = p_user_id) then
    return;
  end if;

  insert into public.team_members (name, color, user_id)
  values
    ('Maya Chen', 'rose', p_user_id),
    ('Theo Brooks', 'azure', p_user_id),
    ('Priya Shah', 'ochre', p_user_id),
    ('Jonah Williams', 'teal', p_user_id),
    ('Sofia Alvarez', 'plum', p_user_id),
    ('Marcus Green', 'cobalt', p_user_id);

  select id into maya from public.team_members where user_id = p_user_id and name = 'Maya Chen';
  select id into theo from public.team_members where user_id = p_user_id and name = 'Theo Brooks';
  select id into priya from public.team_members where user_id = p_user_id and name = 'Priya Shah';
  select id into jonah from public.team_members where user_id = p_user_id and name = 'Jonah Williams';
  select id into sofia from public.team_members where user_id = p_user_id and name = 'Sofia Alvarez';
  select id into marcus from public.team_members where user_id = p_user_id and name = 'Marcus Green';

  insert into public.labels (name, color, user_id)
  values
    ('Design', 'rose', p_user_id),
    ('Engineering', 'azure', p_user_id),
    ('Research', 'plum', p_user_id),
    ('Growth', 'moss', p_user_id),
    ('Urgent', 'rust', p_user_id),
    ('Accessibility', 'teal', p_user_id),
    ('Planning', 'ochre', p_user_id),
    ('Launch', 'cobalt', p_user_id);

  select id into design_label from public.labels where user_id = p_user_id and name = 'Design';
  select id into engineering_label from public.labels where user_id = p_user_id and name = 'Engineering';
  select id into research_label from public.labels where user_id = p_user_id and name = 'Research';
  select id into growth_label from public.labels where user_id = p_user_id and name = 'Growth';
  select id into urgent_label from public.labels where user_id = p_user_id and name = 'Urgent';
  select id into accessibility_label from public.labels where user_id = p_user_id and name = 'Accessibility';
  select id into planning_label from public.labels where user_id = p_user_id and name = 'Planning';
  select id into launch_label from public.labels where user_id = p_user_id and name = 'Launch';

  insert into public.tasks (title, description, status, priority, due_date, position, user_id)
  values (
    'Outline the Q4 launch plan',
    'Bring the product, marketing, and support milestones into one launch plan.',
    'todo', 'high', '2026-11-05', 1024, p_user_id
  ) returning id into task_discovery;
  insert into public.tasks (title, description, status, priority, due_date, position, user_id)
  values (
    'Review mobile navigation',
    'Check the compact navigation flows and document any friction before handoff.',
    'todo', 'normal', '2026-11-08', 2048, p_user_id
  ) returning id into task_wireframes;
  insert into public.tasks (title, description, status, priority, due_date, position, user_id)
  values (
    'Interview five active customers',
    'Learn where teams lose momentum between planning and shipping.',
    'todo', 'low', '2026-11-12', 3072, p_user_id
  ) returning id into task_research;

  insert into public.tasks (title, description, status, priority, due_date, position, user_id)
  values (
    'Write onboarding empty states',
    'Draft concise guidance for a new workspace, empty lane, and first task.',
    'in_progress', 'high', '2026-11-04', 1024, p_user_id
  ) returning id into task_copy;
  insert into public.tasks (title, description, status, priority, due_date, position, user_id)
  values (
    'Add optimistic task updates',
    'Keep cards responsive while edits, moves, and deletes are sent to Supabase.',
    'in_progress', 'high', '2026-11-06', 2048, p_user_id
  ) returning id into task_api;
  insert into public.tasks (title, description, status, priority, due_date, position, user_id)
  values (
    'Persist theme preference',
    'Save system, light, and dark theme choices without injecting a client script.',
    'in_progress', 'normal', null, 3072, p_user_id
  ) returning id into task_auth;

  insert into public.tasks (title, description, status, priority, due_date, position, user_id)
  values (
    'Run keyboard accessibility pass',
    'Verify focus order, menu keyboard behavior, drag announcements, and dialog escape.',
    'in_review', 'high', '2026-11-03', 1024, p_user_id
  ) returning id into task_qa;
  insert into public.tasks (title, description, status, priority, due_date, position, user_id)
  values (
    'Test narrow board layout',
    'Check filters, task cards, and the details panel at phone and tablet widths.',
    'in_review', 'normal', '2026-11-07', 2048, p_user_id
  ) returning id into task_mobile;
  insert into public.tasks (title, description, status, priority, due_date, position, user_id)
  values (
    'Confirm release checklist',
    'Review migrations, error states, analytics, and the final handoff notes.',
    'in_review', 'low', '2026-11-10', 3072, p_user_id
  ) returning id into task_release;

  insert into public.tasks (title, description, status, priority, due_date, position, user_id)
  values (
    'Ship the board refresh',
    'The updated board is live with the new visual system and task interactions.',
    'done', 'high', '2026-10-30', 1024, p_user_id
  ) returning id into task_metrics;
  insert into public.tasks (title, description, status, priority, due_date, position, user_id)
  values (
    'Set up product metrics',
    'Track task creation, completion, filtering, and time to first useful action.',
    'done', 'normal', '2026-10-31', 2048, p_user_id
  ) returning id into task_docs;
  insert into public.tasks (title, description, status, priority, due_date, position, user_id)
  values (
    'Archive the old visual tokens',
    'Remove references to the retired palette after the migration is verified.',
    'done', 'low', null, 3072, p_user_id
  ) returning id into task_archive;

  insert into public.task_assignees (task_id, member_id, user_id)
  values
    (task_discovery, maya, p_user_id),
    (task_discovery, priya, p_user_id),
    (task_wireframes, sofia, p_user_id),
    (task_research, priya, p_user_id),
    (task_copy, maya, p_user_id),
    (task_copy, jonah, p_user_id),
    (task_api, theo, p_user_id),
    (task_auth, theo, p_user_id),
    (task_qa, marcus, p_user_id),
    (task_qa, maya, p_user_id),
    (task_mobile, sofia, p_user_id),
    (task_release, jonah, p_user_id),
    (task_metrics, theo, p_user_id),
    (task_docs, priya, p_user_id),
    (task_archive, marcus, p_user_id);

  insert into public.task_labels (task_id, label_id, user_id)
  values
    (task_discovery, planning_label, p_user_id),
    (task_discovery, launch_label, p_user_id),
    (task_wireframes, design_label, p_user_id),
    (task_wireframes, accessibility_label, p_user_id),
    (task_research, research_label, p_user_id),
    (task_copy, design_label, p_user_id),
    (task_copy, growth_label, p_user_id),
    (task_api, engineering_label, p_user_id),
    (task_api, urgent_label, p_user_id),
    (task_auth, engineering_label, p_user_id),
    (task_qa, accessibility_label, p_user_id),
    (task_qa, launch_label, p_user_id),
    (task_mobile, design_label, p_user_id),
    (task_release, launch_label, p_user_id),
    (task_metrics, growth_label, p_user_id),
    (task_docs, planning_label, p_user_id),
    (task_archive, engineering_label, p_user_id);

  insert into public.comments (task_id, user_id, body, created_at)
  values
    (task_discovery, p_user_id, 'I added the support handoff and beta feedback milestones to the outline.', '2026-11-01T10:00:00Z'),
    (task_discovery, p_user_id, 'Let’s review the launch risks together before Thursday.', '2026-11-01T14:30:00Z'),
    (task_copy, p_user_id, 'The first draft uses the same language as the empty filters state.', '2026-10-31T09:15:00Z'),
    (task_api, p_user_id, 'Optimistic deletes now restore the card and show a toast when the request fails.', '2026-11-01T16:45:00Z'),
    (task_qa, p_user_id, 'The menu and confirmation dialog are ready for a keyboard-only pass.', '2026-11-02T08:20:00Z'),
    (task_mobile, p_user_id, 'The details panel covers the board below the wide-screen breakpoint.', '2026-11-02T11:10:00Z'),
    (task_metrics, p_user_id, 'The initial events are visible in the local dashboard.', '2026-10-30T17:00:00Z');
end;
$$;

revoke all on function private.seed_demo_data(uuid) from public, anon, authenticated;

create or replace function private.seed_new_anonymous_user()
returns trigger
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  -- The auth service creates guests as supabase_auth_admin. Database tests and
  -- fixture imports insert auth.users as postgres and must remain isolated.
  if session_user = 'supabase_auth_admin' and coalesce(new.is_anonymous, false) then
    perform private.seed_demo_data(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists seed_new_anonymous_user on auth.users;
create trigger seed_new_anonymous_user
  after insert on auth.users
  for each row
  execute function private.seed_new_anonymous_user();

-- Populate guests that already existed before this seed was installed.
do $$
declare
  guest record;
begin
  for guest in select id from auth.users where coalesce(is_anonymous, false) loop
    perform private.seed_demo_data(guest.id);
  end loop;
end;
$$;
