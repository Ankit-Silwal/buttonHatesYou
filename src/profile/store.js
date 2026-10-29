import { START, applyEvent, replay, normalize, chestFor, nextBoughtChest } from '@/economy/rules';
import { legacyReplay } from '@/economy/legacy';
import { newlyReady } from '@/economy/achievements';
import { chestLoot } from '@/economy/chest';

// The player's profile, offline first.
//
// localStorage holds:
//   user    who is signed in (null for a guest)
//   owner   the account the queued events belong to (survives an expired session)
//   base    the last wallet the server sent (or START for a fresh guest)
//   outbox  events made since then that the server has not seen yet
//   v       2 since the economy rework (see migrate)
//   legacy  a guest's events from before it, already folded into `base`;
//           uploaded (and then forgotten) the first time they sign in
//
// What the player sees is `base` with the outbox replayed on top, so buying
// and earning work with no network at all. Whenever we are signed in and
// online, the outbox is sent to /api/sync and the server's answer becomes the
// new base. Guests keep everything on the device; their outbox is uploaded the
// first time they sign in.

const KEY = 'buttonHatesYou.profile.v1';
const BATCH = 200;
const RESYNC_MS = 60_000;

const VERSION = 2;
const fresh = () => ({ user: null, owner: null, base: { ...START, seed: uid() }, outbox: [], legacy: [], v: VERSION });

let data = null;
let net = 'idle'; // idle | syncing | error
let view = null;
let booted = false;
let syncing = null;
let again = false;
const listeners = new Set();

const SERVER_VIEW = Object.freeze({ ready: false, user: null, wallet: START, pending: 0, status: 'guest' });

// Only the last change per outfit slot or house spot matters.
const sameSlot = (a, b) =>
  a.type === b.type && ((a.type === 'equip' && a.slot === b.slot) || (a.type === 'decor' && a.spot === b.spot && (a.room ?? 'living') === (b.room ?? 'living')));
// Only the last move of a free-placed piece matters, and taking it out
// cancels its earlier moves (see 'place' / 'unplace' in economy/rules.js).
const samePiece = (a, b) =>
  (a.type === 'place' || (a.type === 'unplace' && b.type === 'unplace')) && a.item === b.item && (a.room ?? 'living') === (b.room ?? 'living');

const uid = () => crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
const online = () => typeof navigator === 'undefined' || navigator.onLine;

function init() {
  if (data) return;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    data = saved ? { ...fresh(), v: 1, ...saved } : fresh();
  } catch {
    data = fresh();
  }
  data.outbox.forEach((e) => delete e.inflight); // a reload cut off the last request
  if (data.v < VERSION) migrate();
  // A guest's daily chest needs a seed of its own (an account's comes from the server).
  if (!data.owner && !data.base.seed) data.base = { ...data.base, seed: uid() };
  recompute();
}

// The economy rework raised prices and changed how rewards work. A guest's
// wallet is just their queued events replayed, so fold those into a plain
// wallet once, under the old rules, or old purchases would be re-priced (and
// fail). Queues that belong to an account are left for its server to replay.
function migrate() {
  if (!data.owner && data.outbox.length) {
    data.base = legacyReplay(data.base, data.outbox);
    data.legacy = [...data.legacy, ...data.outbox];
    data.outbox = [];
  }
  data.v = VERSION;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
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
  if (ev.type === 'equip' || ev.type === 'decor') {
    // Only the last outfit change per slot (or furniture per spot) matters;
    // don't let the queue grow every time someone tries things on while
    // offline. Events already on their way to the server stay.
    data.outbox = data.outbox.filter((e) => e.inflight || !sameSlot(e, ev));
  }
  if (ev.type === 'place' || ev.type === 'unplace') data.outbox = data.outbox.filter((e) => e.inflight || !samePiece(e, ev));
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

/* ---------- earning (the economy, see economy/rules.js) ---------- */
// What an event added to the wallet, or null when it isn't allowed, plus the
// achievements it made claimable (`ready`, for an "Achievement ready!" line).
function earn(ev) {
  const before = getProfile().wallet;
  const after = applyEvent(before, ev);
  if (!after) return null;
  record(ev);
  return { coins: after.coins - before.coins, diamonds: after.diamonds - before.diamonds, ready: newlyReady(before, after) };
}

// A finished Adventure run: { game, score, extra (Button Run's coins), ms of play }.
// Returns the payout; the server works it out again from the same numbers.
export const recordRun = ({ game, score, extra = 0, ms, continues = 0 }) =>
  earn({ type: 'run', game, score: Math.floor(score), extra: Math.floor(extra), ms: Math.round(ms), at: Date.now(), ...(continues ? { continues } : {}) });

// Paying diamonds for the nth Continue of a run (see economy/rules.js).
// False when the wallet can't afford it.
export const continueRun = (game, n) => tryRecord({ type: 'continue', game, n, at: Date.now() });

// A finished story part (an id in STORY_REWARDS). Pays once; null after that.
export const claimStory = (claim) => earn({ type: 'claim', claim });
export const isClaimed = (wallet, claim) => !!wallet.claimed?.includes(claim);

// Achievements and the daily chest (see economy/achievements.js and chest.js).
// Claims the next level of an achievement: what it paid, or null.
export const claimAchievement = (id, level) => earn({ type: 'achieve', ach: id, level });
// Opens today's chest: { coins, diamonds, food, energy, big, streak }, or null
// when it was already opened today.
export function openChest() {
  const at = Date.now();
  const before = getProfile().wallet;
  const { ready, streak } = chestFor(before, at);
  if (!ready || !earn({ type: 'chest', at })) return null;
  return { ...chestLoot(before.seed, Math.floor(at / 86_400_000), streak), streak };
}
// Buys a coin chest and opens it: { path (rarity after each tap), rarity,
// loot: { coins, diamonds, food, item } }, or null when it can't be afforded.
export function buyChest() {
  const got = nextBoughtChest(getProfile().wallet);
  return earn({ type: 'buychest', at: Date.now() }) ? got : null;
}

export const buy = (item) => tryRecord({ type: 'buy', item });
export const equip = (slot, item) => tryRecord({ type: 'equip', slot, item });

// The house and the button's needs (see economy/house.js and needs.js).
export const decorate = (spot, item, room = 'living') => tryRecord({ type: 'decor', spot, item, ...(room === 'living' ? {} : { room }) });
// Free-placed furniture: put a piece at x, y (percent of its band) or move it there; take it out.
export const placePiece = (item, x, y, room = 'living') => tryRecord({ type: 'place', item, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, ...(room === 'living' ? {} : { room }) });
export const unplacePiece = (item, room = 'living') => tryRecord({ type: 'unplace', item, ...(room === 'living' ? {} : { room }) });
export const feed = (item) => tryRecord({ type: 'feed', item, at: Date.now() });
// Buys a food for the pantry (it is not eaten); feed() then eats from the stock.
export const stockFood = (item) => tryRecord({ type: 'stock', item });
export const sleep = () => tryRecord({ type: 'sleep', at: Date.now() });
// `item`: a paid energy boost (WAKE_OPTIONS id; works awake or asleep), or
// nothing for a free wake-up.
export const wake = (item) => tryRecord({ type: 'wake', at: Date.now(), ...(item ? { item } : {}) });
// Starting a game: spends energy, or returns false when he's too tired/asleep.
// Soaped and showered: he is clean again.
export const wash = () => tryRecord({ type: 'wash', at: Date.now() });
// Buys and drinks a potion (POTIONS id): fills its needs right up.
export const drink = (item) => tryRecord({ type: 'potion', item, at: Date.now() });
export const play = (kind) => tryRecord({ type: 'play', kind, at: Date.now() });

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
    data.base = normalize(state);
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
  if (data.legacy.length) {
    // a guest's events from before the economy rework go up first
    data.outbox = [...data.legacy, ...data.outbox];
    data.legacy = [];
  }
  data.user = user;
  data.owner = user.id;
  data.base = normalize(state);
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
