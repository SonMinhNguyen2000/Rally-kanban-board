-- Automatic positions and updated_at.
-- Run with: npx supabase test db. Everything is rolled back at the end.

begin;

\ir helpers/setup.psql

-- Acting as A until the per-user check below.
select tests.as_user('aaaaaaaa-0000-4000-8000-000000000000');

insert into public.tasks (id, title, status) values ('aaaaaaaa-0000-4000-8000-000000000011', 'One', 'in_review');
insert into public.tasks (id, title, status) values ('aaaaaaaa-0000-4000-8000-000000000012', 'Two', 'in_review');
select is((select position from public.tasks where id = 'aaaaaaaa-0000-4000-8000-000000000011'), 1024::double precision, 'first task in a column gets position 1024');
select is((select position from public.tasks where id = 'aaaaaaaa-0000-4000-8000-000000000012'), 2048::double precision, 'next task lands below it');

select tests.as_user('bbbbbbbb-0000-4000-8000-000000000000');
insert into public.tasks (id, title, status) values ('bbbbbbbb-0000-4000-8000-000000000011', 'B one', 'in_review');
select is((select position from public.tasks where id = 'bbbbbbbb-0000-4000-8000-000000000011'), 1024::double precision, 'positions are computed per user');

insert into public.tasks (id, title, position) values ('bbbbbbbb-0000-4000-8000-000000000012', 'Placed', 7.5);
select is((select position from public.tasks where id = 'bbbbbbbb-0000-4000-8000-000000000012'), 7.5::double precision, 'an explicit position is kept');

select tests.as_admin();
update public.tasks set updated_at = '2000-01-01' where id = 'bbbbbbbb-0000-4000-8000-000000000001';
select tests.as_user('bbbbbbbb-0000-4000-8000-000000000000');
update public.tasks set title = 'B task renamed' where id = 'bbbbbbbb-0000-4000-8000-000000000001';
select isnt((select updated_at from public.tasks where id = 'bbbbbbbb-0000-4000-8000-000000000001'), '2000-01-01'::timestamptz, 'updated_at is maintained');

select * from finish();

rollback;
