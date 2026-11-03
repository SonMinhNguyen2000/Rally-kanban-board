// Two real anonymous sessions against the running local stack, through the same API the
// browser uses: Auth, PostgREST and Realtime. It complements the pgTAP *.test.sql files, which
// cannot exercise JWT handling or Realtime delivery.
//
// Run: npm run test:api (needs .env.local and the local stack)

import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert/strict';

// The same public values the app uses. No service role key is involved.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
assert.ok(url && key, 'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
assert.match(url, /127\.0\.0\.1|localhost/, 'This test writes data, so it only runs against a local stack');

// Each client keeps its session in memory, so A and B stay separate.
const options = { auth: { persistSession: false, autoRefreshToken: false } };

/**
 * Waits, giving Realtime time to process what was just written.
 * @param ms - How long to wait, in milliseconds.
 * @returns A promise that resolves after the wait.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Running totals, which decide the exit code.
let passed = 0;
let failed = 0;

/**
 * Records and prints one check, with `detail` shown only if it fails.
 * @param name - What is being checked.
 * @param condition - True if the check passed.
 * @param detail - Shown only on failure.
 */
function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`ok   ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL ${name} ${detail}`);
  }
}

const noSession = createClient(url, key, options);
const { error: anonReadError } = await noSession.from('tasks').select('id');
check('anon key without a session cannot read tasks', anonReadError?.code === '42501', JSON.stringify(anonReadError));

const a = createClient(url, key, options);
const b = createClient(url, key, options);
const signInA = await a.auth.signInAnonymously();
const signInB = await b.auth.signInAnonymously();
assert.ifError(signInA.error);
assert.ifError(signInB.error);
const aId = signInA.data.user.id;
const bId = signInB.data.user.id;
check('two guests get different identities', aId !== bId);

// Realtime: B listens with the filter the app uses and with none at all.

/**
 * Subscribes to changes on three tables and resolves once the listener is really ready.
 * Resolves with the channel and an array that collects each event as it arrives.
 * @param client - The Supabase client to listen with.
 * @param name - The channel's name.
 * @param filter - A Realtime filter, or null for none.
 * @returns A promise for the channel and its collected events, once the listener is ready.
 */
function listen(client, name, filter) {
  const events = []; // Filled by the callback below, then read after the writes settle.
  const channel = client.channel(name);
  for (const table of ['tasks', 'comments', 'task_activity']) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) },
      (payload) => events.push({ table, type: payload.eventType, old: payload.old, new: payload.new }),
    );
  }
  // SUBSCRIBED arrives before the Postgres listener is ready, and changes made in that gap
  // are lost. The system message is the real signal.
  return new Promise((resolve, reject) => {
    channel.on('system', {}, (message) => {
      if (message.extension === 'postgres_changes' && message.status === 'ok') resolve({ channel, events });
    });
    channel.subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(err ?? new Error(status));
    });
    setTimeout(() => reject(new Error(`${name}: Realtime listener not ready after 20s`)), 20000);
  });
}

await a.realtime.setAuth(signInA.data.session.access_token);
await b.realtime.setAuth(signInB.data.session.access_token);
const aFiltered = await listen(a, 'a-filtered', `user_id=eq.${aId}`);
const bFiltered = await listen(b, 'b-filtered', `user_id=eq.${bId}`);
const bUnfiltered = await listen(b, 'b-unfiltered', null);

const created = await a.from('tasks').insert({ title: 'A secret task' }).select().single();
assert.ifError(created.error);
const taskId = created.data.id;

const bRead = await b.from('tasks').select('id').eq('id', taskId);
check('B cannot read A\'s task over the API', bRead.data?.length === 0, JSON.stringify(bRead));

const bUpdate = await b.from('tasks').update({ title: 'hacked' }).eq('id', taskId).select();
check('B cannot update A\'s task over the API', bUpdate.data?.length === 0, JSON.stringify(bUpdate));

const bDelete = await b.from('tasks').delete().eq('id', taskId).select();
check('B cannot delete A\'s task over the API', bDelete.data?.length === 0, JSON.stringify(bDelete));

const bComment = await b.from('comments').insert({ task_id: taskId, body: 'x' });
check('B cannot comment on A\'s task over the API', bComment.error?.code === '23503', JSON.stringify(bComment.error));

const bSpoof = await b.from('tasks').insert({ title: 'x', user_id: aId });
check('B cannot create a task as A over the API', bSpoof.error?.code === '42501', JSON.stringify(bSpoof.error));

const embed = await a
  .from('tasks')
  .select('id, title, task_assignees(member_id), task_labels(label_id), comments(count)')
  .eq('id', taskId)
  .single();
check('the board query embeds relations and a comment count', embed.data?.comments?.[0]?.count === 0, JSON.stringify(embed));

const comment = await a.from('comments').insert({ task_id: taskId, body: 'A secret comment' }).select().single();
assert.ifError(comment.error);
await a.from('tasks').update({ status: 'in_progress', title: 'A secret task renamed' }).eq('id', taskId);

// Realtime checks RLS against the live row, so the row must still exist when the insert and
// update are processed. A row deleted within milliseconds yields only its DELETE event.
await sleep(2000);

await a.from('comments').delete().eq('id', comment.data.id);
await a.from('tasks').delete().eq('id', taskId);

await sleep(3000);

// The control. If A hears nothing, delivery is broken and the isolation checks below prove
// nothing, so stop rather than report them as passes.
check(
  'A receives A\'s own inserts, updates and deletes',
  ['INSERT', 'UPDATE', 'DELETE'].every((type) => aFiltered.events.some((e) => e.table === 'tasks' && e.type === type)),
  JSON.stringify(aFiltered.events.map((e) => `${e.table}:${e.type}`)),
);
if (failed > 0) {
  console.log('\nRealtime delivery control failed; isolation results would be meaningless.');
  process.exit(1);
}
// Only rows B doesn't own count. A local demo-data trigger can give B rows of its own at sign-up.
/**
 * Keeps only the events about other users' rows.
 * @param events - The events a channel received.
 * @returns The events for rows B doesn't own.
 */
const foreign = (events) => events.filter((e) => e.new?.user_id && e.new.user_id !== bId);
check('B\'s filtered channel receives nothing from A', foreign(bFiltered.events).length === 0, JSON.stringify(foreign(bFiltered.events)));

const unfilteredLeaks = foreign(bUnfiltered.events);
check('B\'s unfiltered channel receives no inserts or updates from A', unfilteredLeaks.length === 0, JSON.stringify(unfilteredLeaks));

const deletes = bUnfiltered.events.filter((e) => e.type === 'DELETE');
console.log(`info B's unfiltered channel received ${deletes.length} DELETE event(s):`);
for (const event of deletes) {
  console.log(`     ${event.table}: old = ${JSON.stringify(event.old)}`);
}
check(
  'an unfiltered DELETE event exposes no more than the primary key',
  deletes.every((e) => Object.keys(e.old).every((column) => column === 'id' || column === 'task_id')),
  JSON.stringify(deletes.map((e) => e.old)),
);

await Promise.all([a.removeAllChannels(), b.removeAllChannels()]);
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
