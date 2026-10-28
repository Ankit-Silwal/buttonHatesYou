import { ITEM, REWARDS, DEFAULT_LOOK, GAME, STORY_REWARDS, RUN_LIMITS } from './catalog';
import { HOUSE_ITEM, DEFAULT_HOUSE, DEFAULT_ROOMS, ROOMS, SPOT, FOOD, WAKE_OPTION, roomOf } from './house';
import { DEFAULT_NEEDS, PLAY_COST, PLAY_DIRT, FILTHY_AT, PLAY_MIN_HUNGER, needsAt, normalizeNeeds } from './needs';
import { tierPayout } from './tiers';
import { ACHIEVEMENT, EMPTY_STATS, levelOf, statsOf } from './achievements';
import { CHEST, chestLoot } from './chest';

export { tierPayout };

// A wallet only ever changes through events, and the browser and the server
// run the very same `applyEvent`. The browser applies them right away (so it
// works offline) and queues them; the server replays the queue and its answer
// becomes the new truth.
//
//   { id, type: 'run', game, score, extra, ms, at, continues }
//                                       finished an Adventure run: its score,
//                                       `extra` (Button Run: coins picked up),
//                                       `ms` of play and when it ended; the
//                                       payout is worked out here, not sent.
//                                       `continues` (optional, informational):
//                                       how many paid Continues it used; their
//                                       play time is already in `ms`
//   { id, type: 'continue', game, n, at }
//                                       paid diamonds to carry on a run (see
//                                       applyContinueEvent at the bottom)
//   { id, type: 'claim', claim }        finished a story part (STORY_REWARDS);
//                                       pays once per wallet, ever
//   { id, type: 'reward', game }        old fixed payout from REWARDS: only
//                                       events queued before the economy rework
//   { id, type: 'buy', item }           bought an item
//   { id, type: 'equip', slot, item }   put an owned item on
//   { id, type: 'achieve', ach, level } claimed an achievement level (pays diamonds)
//   { id, type: 'chest', at }           opened the daily chest
//
// Economy fields a wallet picks up as it is used (all optional, so wallets
// saved before them still work):
//   claimed  story reward ids already paid
//   runs     { [game]: best payout of a single run } (for the diamonds)
//   day      { n: day number (UTC), coins: run coins earned that day, ms: play time }
//   legacy   { [REWARDS id]: times paid } (old events are paid a limited number of times)
//   stats    what achievements count (see achievements.js); achieved { [id]: levels claimed }
//   seed     the daily chest's seed (set by the server); pantry { [food]: free snacks from chests }
//
// The house and the button's needs have their own events, handled by
// applyHouseEvent below.

export const START = Object.freeze({
  coins: 300, // a little welcome money: enough for one cheap item, so the wardrobe isn't just a window
  diamonds: 0,
  owned: [],
  equipped: DEFAULT_LOOK,
  house: DEFAULT_HOUSE, // the living room, see house.js
  rooms: DEFAULT_ROOMS, // the kitchen and the bedroom
  needs: DEFAULT_NEEDS, // see needs.js
  stats: EMPTY_STATS, // see achievements.js
  achieved: Object.freeze({}),
  pantry: Object.freeze({}),
});

const pick = (table, id) => (typeof id === 'string' && Object.hasOwn(table, id) ? table[id] : null);

export const owns = (wallet, item) => !item.price || wallet.owned.includes(item.id);

export const canAfford = (wallet, item) =>
  wallet.coins >= (item.price?.coins ?? 0) && wallet.diamonds >= (item.price?.diamonds ?? 0);

// Returns the new wallet, or null when the event is not allowed.
// Events can come straight from a request body, so trust nothing in them.
// `now` caps event times: runs and needs events (the server passes its own clock).
export function applyEvent(wallet, ev, now = Infinity) {
  if (!ev || typeof ev !== 'object') return null;
  wallet = normalize(wallet);
  const next = applyAnyEvent(wallet, ev, now);
  return next && countDay(next, ev, now); // see "Achievements" below
}

function applyAnyEvent(wallet, ev, now) {
  const achieved = applyAchievementEvent(wallet, ev, now);
  if (achieved !== undefined) return achieved;
  const house = applyHouseEvent(wallet, ev, now);
  if (house !== undefined) return house;
  const cont = applyContinueEvent(wallet, ev);
  if (cont !== undefined) return cont;

  /* ---------- earning (economy) ---------- */
  if (ev.type === 'run') return applyRun(wallet, ev, now);
  if (ev.type === 'claim') return applyClaim(wallet, ev);
  if (ev.type === 'reward') return applyLegacyReward(wallet, ev);

  /* ---------- spending ---------- */
  if (ev.type === 'buy') {
    const item = pick(ITEM, ev.item);
    if (!item || owns(wallet, item) || !canAfford(wallet, item)) return null;
    return {
      ...wallet,
      coins: wallet.coins - (item.price.coins ?? 0),
      diamonds: wallet.diamonds - (item.price.diamonds ?? 0),
      owned: [...wallet.owned, item.id],
    };
  }

  if (ev.type === 'equip') {
    const item = pick(ITEM, ev.item);
    if (!item || item.slot !== ev.slot || !owns(wallet, item)) return null;
    return { ...wallet, equipped: { ...wallet.equipped, [item.slot]: item.id } };
  }

  return null;
}

export const replay = (wallet, events, now) =>
  events.reduce((w, ev) => applyEvent(w, ev, now) ?? w, normalize(wallet));

export const isEventId = (id) => typeof id === 'string' && id.length > 0 && id.length <= 64;

/* ====================== the economy: what things pay ====================== */

const DAY_MS = 86_400_000;
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const add = (wallet, prize) => ({
  ...wallet,
  coins: wallet.coins + prize.coins,
  diamonds: wallet.diamonds + prize.diamonds,
});

// tierPayout (the rising tiers) lives in tiers.js.

// What an Adventure run is worth before any anti-cheat or daily limits.
// `game` is a GAMES entry or id; `extra` is Button Run's coins picked up.
export function adventurePayout(game, score, extra = 0) {
  const g = typeof game === 'string' ? pick(GAME, game) : game;
  const p = g?.payout;
  if (!p) return 0;
  const coins = p.coins ? Math.floor(num(extra)) : tierPayout(score, p.per, p.base);
  return clamp(coins, 0, RUN_LIMITS.maxPayout);
}

// The anti-cheat part. The browser's word is taken for the score, but only up
// to what the reported play time allows (`rate` per second, plus a little
// slack), play time is capped per run and per day, and run coins past
// `dailyFull` a day only pay `overCap` of their worth. Days only move forward,
// and never past `now`.
function applyRun(wallet, ev, now) {
  const game = pick(GAME, ev.game);
  const p = game?.payout;
  if (!p) return null;
  const L = RUN_LIMITS;
  const prev = wallet.day ?? { n: 0, coins: 0, ms: 0, end: 0 };
  const at = Math.max(Math.min(num(ev.at) > 0 ? num(ev.at) : Date.now(), now), num(prev.end));
  const n = Math.max(prev.n, Math.floor(at / DAY_MS));
  const day = n === prev.n ? prev : { n, coins: 0, ms: 0 };

  // Runs can't overlap: a run's play time fits between the end of the last
  // run and this one's end, so all the play time ever counted fits in the
  // real time that has passed.
  const room = Math.min(L.maxRunMs, DAY_MS - day.ms, at - num(prev.end));
  const ms = clamp(Math.floor(num(ev.ms)), 0, room);
  const most = p.rate * (ms / 1000) + (p.coins ? 10 : p.per / 2);
  const score = clamp(num(ev.score), 0, most);
  const extra = clamp(num(ev.extra), 0, most);
  const raw = adventurePayout(game, score, extra);

  const full = clamp(L.dailyFull - day.coins, 0, raw);
  const coins = full + Math.floor((raw - full) * L.overCap);
  const best = num(wallet.runs?.[game.id]);

  // Runs pay coins only: diamonds come from achievements.
  return {
    ...add(wallet, { coins, diamonds: 0 }),
    runs: { ...wallet.runs, [game.id]: Math.max(best, raw) },
    day: { n, coins: day.coins + raw, ms: day.ms + ms, end: at },
    stats: countRun(wallet.stats, game.id, p.coins ? extra : score, coins),
  };
}

// Story parts pay once per wallet.
function applyClaim(wallet, ev) {
  const prize = pick(STORY_REWARDS, ev.claim);
  const claimed = Array.isArray(wallet.claimed) ? wallet.claimed : [];
  if (!prize || claimed.includes(ev.claim)) return null;
  return { ...add(wallet, prize), claimed: [...claimed, ev.claim] };
}

// Old fixed rewards, from events queued before the rework: still paid at the
// old amounts, but only `max` times each per wallet.
function applyLegacyReward(wallet, ev) {
  const prize = pick(REWARDS, ev.game);
  const times = num(wallet.legacy?.[ev.game]);
  if (!prize || times >= prize.max) return null;
  return { ...add(wallet, prize), legacy: { ...wallet.legacy, [ev.game]: times + 1 } };
}

/* =====================================================================
   The house and the button's needs
   =====================================================================
   { id, type: 'buy', item }           bought a house item (wallpaper, floor, furniture)
   { id, type: 'decor', spot, item, room? }
                                       put an owned wallpaper/floor up (spot 'wall' /
                                       'floor') or a piece of furniture in a spot
                                       of `room` ('living' when left out, 'kitchen',
                                       'bedroom'); item null takes it down. The
                                       piece must be allowed in that room and the
                                       spot must exist there. The bedroom's bed and
                                       bedside lamp can be swapped, never taken
                                       down. (An old event for the 'bed' spot with
                                       no room means the bedroom.)
   Needs events carry `at`, when they happened (ms). Hunger and energy drift
   with the clock between events (see needs.js).
   { id, type: 'feed', item, at }      bought a food and ate it
   { id, type: 'sleep', at }           went to bed
   { id, type: 'wake', at, item? }     got up; `item` (a WAKE_OPTIONS id) is a paid
                                       wake-up that also gives some energy back
   { id, type: 'play', kind, at }      started a game: costs PLAY_COST[kind] energy
                                       and adds PLAY_DIRT[kind] dirt
   { id, type: 'wash', at }            soaped and showered: no more dirt
   (he won't go to bed when his dirt is FILTHY_AT or more) */

const own = (table, id) => (typeof id === 'string' && Object.hasOwn(table, id) ? table[id] : null);
const r2 = (v) => Math.round(v * 100) / 100;
const pay = (wallet, price) => ({
  ...wallet,
  coins: wallet.coins - (price.coins ?? 0),
  diamonds: wallet.diamonds - (price.diamonds ?? 0),
});

// Wallets saved before the house existed have no `house` or `needs`.
export function normalize(w) {
  if (!w || typeof w !== 'object') return START;
  if (w.house?.place && w.rooms?.kitchen?.place && w.rooms.bedroom?.place && w.needs && w.equipped && Array.isArray(w.owned) && w.stats?.best && w.achieved && w.pantry) return w;
  return {
    ...START,
    ...w,
    stats: { ...EMPTY_STATS, ...w.stats, best: { ...w.stats?.best } },
    achieved: { ...w.achieved },
    pantry: { ...w.pantry },
    owned: Array.isArray(w.owned) ? w.owned : [],
    equipped: { ...DEFAULT_LOOK, ...w.equipped },
    ...houseOf(w),
    needs: normalizeNeeds(w.needs),
  };
}

// The living room (wallet.house) and the other rooms out of a saved wallet.
// Before the other rooms existed the house had a bed in it: that bed moves to
// the bedroom, and the living room goes without one.
function houseOf(w) {
  const { bed, ...living } = { ...w.house?.place };
  const room = (id) => {
    const r = w.rooms?.[id];
    return { ...DEFAULT_ROOMS[id], ...r, place: { ...DEFAULT_ROOMS[id].place, ...r?.place } };
  };
  const rooms = { kitchen: room('kitchen'), bedroom: room('bedroom') };
  if (!w.rooms && bed && Object.hasOwn(HOUSE_ITEM, bed)) rooms.bedroom.place.bed = bed;
  return { house: { ...DEFAULT_HOUSE, ...w.house, place: living }, rooms };
}

// The needs at the event's time. Time only moves forward: an event can't be
// earlier than the last one, nor (on the server) later than `now`.
function needsFor(wallet, ev, now) {
  let t = Number(ev.at);
  if (!Number.isFinite(t) || t <= 0) return null;
  t = Math.max(Math.min(t, now), wallet.needs.at);
  const n = needsAt(wallet.needs, t);
  return { ...n, dirt: n.dirt ?? 0, at: t }; // a new player's clock starts here
}

// The new wallet, null when the event is not allowed, or undefined when it
// isn't a house/needs event at all.
function applyHouseEvent(wallet, ev, now) {
  if (ev.type === 'buy') {
    const item = own(HOUSE_ITEM, ev.item);
    if (!item) return undefined; // an outfit
    if (owns(wallet, item) || !canAfford(wallet, item)) return null;
    return { ...pay(wallet, item.price), owned: [...wallet.owned, item.id] };
  }

  if (ev.type === 'decor') {
    const id = ev.room ?? (ev.spot === 'bed' ? 'bedroom' : 'living');
    const cfg = own(ROOMS, id);
    if (!cfg) return null;
    const here = roomOf(wallet, id);
    const put = (next) => ({ ...wallet, ...(id === 'living' ? { house: next } : { rooms: { ...wallet.rooms, [id]: next } }) });
    if (ev.spot === 'wall' || ev.spot === 'floor') {
      const item = own(HOUSE_ITEM, ev.item);
      if (!item || item.kind !== ev.spot || !item.rooms.includes(id) || !owns(wallet, item)) return null;
      return put({ ...here, [ev.spot]: item.id });
    }
    if (!own(SPOT, ev.spot) || !cfg.spots.includes(ev.spot)) return null;
    const place = { ...here.place };
    if (ev.item == null) {
      delete place[ev.spot];
    } else {
      const item = own(HOUSE_ITEM, ev.item);
      if (!item || item.kind !== 'furniture' || !item.spots.includes(ev.spot) || !item.rooms.includes(id) || !owns(wallet, item)) return null;
      for (const s of Object.keys(place)) if (place[s] === item.id) delete place[s]; // only one of each in a room
      place[ev.spot] = item.id;
    }
    if (!cfg.required.every((s) => place[s])) return null; // the bed and its lamp stay
    return put({ ...here, place });
  }

  if (ev.type === 'feed') {
    const food = own(FOOD, ev.item);
    const needs = food && needsFor(wallet, ev, now);
    const free = food ? num(wallet.pantry[food.id]) : 0; // snacks from the daily chest go first
    if (!needs || needs.asleep || (!free && !canAfford(wallet, food))) return null;
    return {
      ...(free ? { ...wallet, pantry: { ...wallet.pantry, [food.id]: free - 1 } } : pay(wallet, food.price)),
      stats: { ...wallet.stats, eaten: num(wallet.stats.eaten) + 1 },
      needs: { ...needs, hunger: r2(Math.min(100, needs.hunger + food.hunger)), energy: r2(Math.min(100, needs.energy + food.energy)) },
    };
  }

  if (ev.type === 'sleep' || ev.type === 'wake') {
    const needs = needsFor(wallet, ev, now);
    if (!needs || needs.asleep === (ev.type === 'sleep')) return null;
    if (ev.type === 'sleep' && needs.dirt >= FILTHY_AT) return null; // clean first
    const naps = num(wallet.stats.naps) + (ev.type === 'sleep' ? 1 : 0);
    if (ev.type === 'wake' && ev.item != null) {
      const opt = own(WAKE_OPTION, ev.item);
      if (!opt || !canAfford(wallet, opt)) return null;
      return { ...pay(wallet, opt.price), needs: { ...needs, asleep: false, energy: r2(Math.min(100, needs.energy + opt.energy)) } };
    }
    return { ...wallet, needs: { ...needs, asleep: ev.type === 'sleep' }, stats: { ...wallet.stats, naps } };
  }

  if (ev.type === 'play') {
    const cost = own(PLAY_COST, ev.kind);
    const needs = cost && needsFor(wallet, ev, now);
    if (!needs || needs.asleep || needs.energy < cost || needs.hunger < PLAY_MIN_HUNGER) return null;
    return { ...wallet, needs: { ...needs, energy: r2(needs.energy - cost), dirt: r2(Math.min(100, needs.dirt + PLAY_DIRT[ev.kind])) } };
  }

  if (ev.type === 'wash') {
    const needs = needsFor(wallet, ev, now);
    if (!needs || needs.asleep) return null;
    return { ...wallet, needs: { ...needs, dirt: 0 }, stats: { ...wallet.stats, washes: num(wallet.stats.washes) + 1 } };
  }

  return undefined;
}

/* =====================================================================
   Continue with diamonds (Adventure)
   =====================================================================
   { id, type: 'continue', game, n, at }
   When a run ends the player may pay diamonds to carry on from where it
   ended, keeping the score: the nth Continue of a run costs
   CONTINUE_COST[n - 1] diamonds, and a run has at most MAX_CONTINUES.
   It only spends; the run event at the end still pays by the final score
   through applyRun, whose caps already count the continued play time. */

export const CONTINUE_COST = Object.freeze([1, 2, 3]);
export const MAX_CONTINUES = CONTINUE_COST.length;
export const continueCost = (n) => (Number.isInteger(n) && n >= 1 ? (CONTINUE_COST[n - 1] ?? null) : null);

// The new wallet, null when the event is not allowed, or undefined when it
// isn't a continue event at all.
function applyContinueEvent(wallet, ev) {
  if (ev.type !== 'continue') return undefined;
  const game = own(GAME, ev.game);
  const cost = continueCost(ev.n);
  if (!game?.payout || cost == null || wallet.diamonds < cost) return null;
  return { ...wallet, diamonds: wallet.diamonds - cost };
}

/* =====================================================================
   Achievements, stats and the daily chest (see achievements.js, chest.js)
   =====================================================================
   { id, type: 'achieve', ach, level } claims level `level` (1 = Bronze) of an
                                       achievement: only the next unclaimed
                                       one, and only once its stat is there.
                                       Pays that level's diamonds.
   { id, type: 'chest', at }           opens the daily chest: once per UTC day
                                       (the day of `at`, capped at the server's
                                       clock, later than the last chest's day,
                                       and at most CHEST.window days old). The
                                       loot comes from the wallet's seed and
                                       the day, never from the event.
   Stats are counted where the events are applied (runs in applyRun, food and
   naps in applyHouseEvent) and days played in countDay, for every event. */

// A run counted into the stats: one more run, the coins it paid, and the
// game's best score (coins grabbed for Button Run), as applyRun clamped it.
// A continued run is still one run event, with its final score.
function countRun(stats, game, score, coins) {
  const s = { ...EMPTY_STATS, ...stats };
  return {
    ...s,
    best: { ...s.best, [game]: Math.max(num(s.best[game]), Math.floor(score)) },
    runs: num(s.runs) + 1,
    runCoins: num(s.runCoins) + coins,
  };
}

const TIMED = new Set(['run', 'feed', 'sleep', 'wake', 'play', 'wash', 'chest']);

// When a timed event happened, as far as stats go: capped at `now`, or null
// when it has no time or (on the server, which passes a real `now`) is too
// old to count, so nobody can backdate a year of daily chests.
function eventTime(ev, now) {
  const at = num(ev.at);
  if (at <= 0) return null;
  const t = Math.min(at, now);
  if (Number.isFinite(now) && t < now - CHEST.window * DAY_MS) return null;
  return t;
}

// Days played: an accepted timed event on a later UTC day than the last one counted.
function countDay(wallet, ev, now) {
  if (!TIMED.has(ev.type)) return wallet;
  const t = eventTime(ev, now);
  if (t == null) return wallet;
  const day = Math.floor(t / DAY_MS);
  const s = wallet.stats;
  if (day <= num(s.lastDay)) return wallet;
  return { ...wallet, stats: { ...s, days: num(s.days) + 1, lastDay: day } };
}

// The new wallet, null when not allowed, undefined when not one of these.
function applyAchievementEvent(wallet, ev, now) {
  if (ev.type === 'achieve') {
    const a = own(ACHIEVEMENT, ev.ach);
    const done = levelOf(wallet, a?.id);
    const level = a?.levels[done];
    if (!level || ev.level !== done + 1) return null; // in order, once each
    if (a.stat(statsOf(wallet)) < level.at) return null;
    return {
      ...wallet,
      diamonds: wallet.diamonds + level.diamonds,
      achieved: { ...wallet.achieved, [a.id]: done + 1 },
    };
  }

  if (ev.type === 'chest') {
    const t = eventTime(ev, now);
    if (t == null) return null;
    const day = Math.floor(t / DAY_MS);
    const s = wallet.stats;
    if (day <= num(s.chestDay)) return null; // one a day
    const streak = day === num(s.chestDay) + 1 ? num(s.streak) + 1 : 1;
    const loot = chestLoot(wallet.seed, day, streak);
    const next = {
      ...add(wallet, loot),
      stats: { ...s, chests: num(s.chests) + 1, chestDay: day, streak, bestStreak: Math.max(num(s.bestStreak), streak) },
    };
    if (loot.food) next.pantry = { ...wallet.pantry, [loot.food]: num(wallet.pantry[loot.food]) + 1 };
    if (loot.energy) {
      const needs = needsFor(wallet, { at: t }, now);
      if (needs) next.needs = { ...needs, energy: 100 };
    }
    return next;
  }

  return undefined;
}

// The chest for today: whether it can be opened at `t`, the streak it would
// make and what's in it (for the chest's preview and its open animation).
export function chestFor(wallet, t = Date.now()) {
  const s = normalize(wallet).stats;
  const day = Math.floor(t / DAY_MS);
  const ready = day > num(s.chestDay);
  const streak = !ready ? num(s.streak) : day === num(s.chestDay) + 1 ? num(s.streak) + 1 : 1;
  // a streak is alive if the last chest was today or yesterday
  const alive = day - num(s.chestDay) <= 1 ? num(s.streak) : 0;
  return { ready, streak, alive, day, next: (day + 1) * DAY_MS };
}
