-- Schema-wide guarantees: RLS on every table, policy roles, grants and Realtime setup.
-- Run with: npx supabase test db. Everything is rolled back at the end.

begin;

\ir helpers/setup.psql

select tests.as_admin();

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity),
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'),
  'every public table has RLS enabled');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'),
  7, 'public schema has exactly the seven expected tables');

select is(
  (select count(*)::int from pg_policies where schemaname = 'public'
    and not (roles = '{authenticated}')),
  0, 'every policy applies to authenticated only');

select is(
  (select count(*)::int from information_schema.role_table_grants
    where table_schema = 'public' and grantee in ('anon', 'public')),
  0, 'anon and public hold no table privileges');

select is(
  (select count(*)::int from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'),
  7, 'all seven tables are published to Realtime');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relreplident = 'f'),
  7, 'all seven tables use REPLICA IDENTITY FULL');

select * from finish();

rollback;
