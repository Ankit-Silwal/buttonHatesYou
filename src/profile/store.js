import { START, applyEvent, replay } from '@/economy/rules';

// The player's profile, offline first.
//
// localStorage holds:
//   user    who is signed in (null for a guest)
//   owner   the account the queued events belong to (survives an expired session)
//   base    the last wallet the server sent (or START for a fresh guest)
//   outbox  events made since then that the server has not seen yet
//
// What the player sees is `base` with the outbox replayed on top, so buying
// and earning work with no network at all. Whenever we are signed in and
// online, the outbox is sent to /api/sync and the server's answer becomes the
// new base. Guests keep everything on the device; their outbox is uploaded the
// first time they sign in.

const KEY = 'buttonHatesYou.profile.v1';
const BATCH = 200;
const RESYNC_MS = 60_000;

const fresh = () => ({ user: null, owner: null, base: START, outbox: [] });

let data = null;
let net = 'idle'; // idle | syncing | error
let view = null;
let booted = false;
let syncing = null;
let again = false;
const listeners = new Set();

const SERVER_VIEW = Object.freeze({ ready: false, user: null, wallet: START, pending: 0, status: 'guest' });

const uid = () => crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
const online = () => typeof navigator === 'undefined' || navigator.onLine;

function init() {
  if (data) return;
  try {
    data = { ...fresh(), ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    data = fresh();
  }
  data.outbox.forEach((e) => delete e.inflight); // a reload cut off the last request
  recompute();
}

function status() {
  if (!data.user) return 'guest';
  if (!online()) return 'offline';
  if (net === 'syncing') return 'syncing';
  if (net === 'error') return 'error';
  return data.outbox.length ? 'pending' : 'synced';
}

function recompute() {
  view = {
    ready: true,
    user: data.user,
    wallet: replay(data.base, data.outbox),
    pending: data.outbox.length,
    status: status(),
  };
  listeners.forEach((fn) => fn());
}

function commit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
  recompute();
}

/* ---------- reading (React's useSyncExternalStore shape) ---------- */
export function getProfile() {
  init();
  return view;
}

export const getServerProfile = () => SERVER_VIEW;

export function subscribe(fn) {
  listeners.add(fn);
  boot();
  return () => listeners.delete(fn);
}

/* ---------- changing ---------- */
function record(ev) {
  init();
  const event = { id: uid(), ...ev };
  if (ev.type === 'equip') {
    // Only the last outfit change per slot matters; don't let the queue grow
    // every time someone tries things on while offline. Events already on
    // their way to the server stay.
    data.outbox = data.outbox.filter((e) => e.inflight || !(e.type === 'equip' && e.slot === ev.slot));
  }
  data.outbox.push(event);
  commit();
  sync();
}

// Each returns false when the wallet doesn't allow it.
function tryRecord(ev) {
  if (!applyEvent(getProfile().wallet, ev)) return false;
  record(ev);
  return true;
}

export const grantReward = (game) => tryRecord({ type: 'reward', game });
export const buy = (item) => tryRecord({ type: 'buy', item });
export const equip = (slot, item) => tryRecord({ type: 'equip', slot, item });

/* ---------- talking to the server ---------- */
export function sync() {
  init();
  if (!data.user || !online()) return recompute();
  if (syncing) {
    again = true;
    return syncing;
  }
  syncing = push().finally(() => {
    syncing = null;
    if (again) {
      again = false;
      sync();
    }
  });
  return syncing;
}

async function push() {
  const batch = data.outbox.slice(0, BATCH);
  batch.forEach((e) => (e.inflight = true));
  net = 'syncing';
  recompute();
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ events: batch.map(({ inflight, ...e }) => e) }),
      keepalive: true, // a finished game may navigate away mid-request
    });
    if (res.status === 401) return expire();
    if (!res.ok) throw new Error(res.status);
    const { state } = await res.json();
    const sent = new Set(batch.map((e) => e.id));
    data.base = state;
    data.outbox = data.outbox.filter((e) => !sent.has(e.id));
    net = 'idle';
    commit();
    if (data.outbox.length) again = true;
  } catch {
    batch.forEach((e) => delete e.inflight);
    net = 'error';
    recompute();
  }
}

// The session cookie is gone. Keep playing as a guest; the queued events wait
// for the same account to sign in again.
function expire() {
  data.user = null;
  data.outbox.forEach((e) => delete e.inflight);
  net = 'idle';
  commit();
}

function adopt(user, state) {
  if (data.owner && data.owner !== user.id) data.outbox = []; // another account's leftovers
  data.user = user;
  data.owner = user.id;
  data.base = state;
  commit();
  return sync();
}

export async function signInWithGoogle(credential) {
  init();
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Sign-in failed');
  await adopt(body.user, body.state);
}

export async function signOut() {
  init();
  if (data.outbox.length) await sync();
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  data = fresh();
  net = 'idle';
  commit();
}

// Once per page: find out who the server thinks we are and keep in step.
function boot() {
  if (booted || typeof window === 'undefined') return;
  booted = true;
  init();
  window.addEventListener('online', () => sync());
  window.addEventListener('offline', () => recompute());
  document.addEventListener('visibilitychange', () => !document.hidden && sync());
  setInterval(() => data.user && sync(), RESYNC_MS);

  fetch('/api/me')
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then(({ user, state }) => {
      if (user) return adopt(user, state);
      if (data.user) expire();
    })
    .catch(() => recompute()); // offline or server down: the cache is all we have
}
