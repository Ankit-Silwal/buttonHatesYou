// Levels: 200 of them, each with three missions (play, buy, care). Clearing a
// level pays coins (about half of what the next level asks you to buy),
// diamonds every 5 levels, and unlocks story games, characters and the
// level-locked furniture along the way.
//
// Shared by the browser and the server, like catalog.js: the missions are a
// formula of the level number, progress is read only from what applyEvent
// already counted (wallet.stats, wallet.owned, wallet.lv), so a level-up the
// browser made up is just dropped on the server.
//
// wallet.lv = { n, at, best }
//   n     levels cleared (0 to MAX_LEVEL); the level being played is n + 1
//   at    the counters (snapshot below) when that level began: care and
//         stock missions count what happened since
//   best  { [game]: best single-run score during this level } (the score
//         applyRun clamped; coins grabbed for Button Run)
// Wallets from before levels get { n: 0, at: their counters now, best: {} }
// the first time an event is applied, so on the browser and the server alike
// the missions need new actions.
import { ITEMS, GAME } from './catalog';
import { HOUSE_ITEMS } from './house';

export const MAX_LEVEL = 200;

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const round10 = (v) => Math.round(v / 10) * 10;

/* ---------------- what clearing levels unlocks ---------------- */

// Story games, by levels cleared. Anyone who already claimed a part of one
// (wallet.claimed) keeps it.
export const STORY_UNLOCKS = Object.freeze({ 'please-dont': 1, 'how-i-met-your-cursor': 50, 'the-reason': 100 });
const STORY_OF_CLAIM = (c) =>
  typeof c !== 'string' ? null : c === 'please-dont' ? 'please-dont' : c.startsWith('cursor:') ? 'how-i-met-your-cursor' : c.startsWith('reason:') ? 'the-reason' : null;

/* ---------------- the missions ---------------- */

// 1. Play: reach a score in one run of an Adventure game, in rotation.
// The rotation is fixed: a game joining it would change every level's
// mission for players already on their way (so Ping Pong Grudge, added
// later, isn't in it).
const ORDER = ['flap', 'whack', 'stack', 'pop', 'simon', 'hop', 'run', 'slice', 'button-run'];
export const PLAY_GAMES = ORDER.filter((id) => GAME[id]?.payout && !GAME[id].retired);
// How hard: from 0.4 of a pay tier at level 1 to 3 tiers (a great run) at 200.
export const playFactor = (L) => 0.4 + (2.6 * (L - 1)) / (MAX_LEVEL - 1);
const COIN_TIER = 50; // Button Run pays coins 1:1: its "tier" is 50 coins grabbed
function playTarget(game, L) {
  const p = GAME[game].payout;
  const per = p.coins ? COIN_TIER : p.per;
  const step = p.coins ? 5 : per >= 100 ? 50 : 1;
  return Math.max(step, Math.round((per * playFactor(L)) / step) * step);
}

// 3. Care: feed him, put him to bed, wash him, in rotation, a few more times
// every 30 levels (feeding counts double: it's the cheap one).
export const CARE = Object.freeze([
  { id: 'feed', stat: 'eaten', name: 'Feed him', x: 2 },
  { id: 'nap', stat: 'naps', name: 'Put him to bed', x: 1 },
  { id: 'wash', stat: 'washes', name: 'Wash him', x: 1 },
]);
const careCount = (L) => 1 + Math.floor((L - 1) / 30);

// 2. Buy: own a particular item, prices rising level by level; every 4th
// level instead stock the fridge. The level-locked pieces (`level` in the
// catalogs) are the buy missions of their own level.
const stockCount = (L) => 3 + Math.floor(L / 25);
const FOOD_COST = 30; // about what a stocked food costs, for the reward

const coinPriced = (i) => !!i.price?.coins && !i.price.diamonds && !i.retired;
const SPECIAL = Object.fromEntries([...ITEMS, ...HOUSE_ITEMS].filter((i) => coinPriced(i) && i.level != null).map((i) => [i.level, i.id]));

// The regular items, cheapest first, outfits and house items taking turns
// when the price is the same.
function regularTrack() {
  const by = (a, b) => a.price.coins - b.price.coins || (a.id < b.id ? -1 : 1);
  const outfits = ITEMS.filter((i) => coinPriced(i) && i.level == null).sort(by);
  const house = HOUSE_ITEMS.filter((i) => coinPriced(i) && i.level == null).sort(by);
  const out = [];
  let turn = 0;
  while (outfits.length || house.length) {
    const a = outfits[0];
    const b = house[0];
    const takeA = !b || (a && (a.price.coins < b.price.coins || (a.price.coins === b.price.coins && turn % 2 === 0)));
    out.push((takeA ? outfits : house).shift());
    turn++;
  }
  return out;
}

const isStockLevel = (L) => L % 4 === 0 && !SPECIAL[L];

// The levels: [{ level, play: { game, target }, buy: { item } | { stock },
// care: { id, stat, count } }], LEVELS[L - 1] is level L.
function buildLevels() {
  const track = regularTrack();
  const slots = [];
  for (let L = 1; L <= MAX_LEVEL; L++) if (!isStockLevel(L) && !SPECIAL[L]) slots.push(L);
  // more regular items than slots: spread the ones used evenly over the track
  const pickAt = (k) => track[Math.min(track.length - 1, Math.floor((k * track.length) / slots.length))];
  const buyAt = {};
  slots.forEach((L, k) => (buyAt[L] = pickAt(k).id));
  return Array.from({ length: MAX_LEVEL }, (_, i) => {
    const L = i + 1;
    const game = PLAY_GAMES[i % PLAY_GAMES.length];
    const care = CARE[i % CARE.length];
    return {
      level: L,
      play: { game, target: playTarget(game, L) },
      buy: isStockLevel(L) ? { stock: stockCount(L) } : { item: SPECIAL[L] ?? buyAt[L] },
      care: { id: care.id, stat: care.stat, count: careCount(L) * care.x },
    };
  });
}
export const LEVELS = buildLevels();
export const levelDef = (L) => LEVELS[L - 1] ?? null;
// The items the buy missions ask for, in level order.
export const BUY_TRACK = LEVELS.filter((d) => d.buy.item).map((d) => ({ level: d.level, item: d.buy.item }));

const ANY_ITEM = Object.fromEntries([...ITEMS, ...HOUSE_ITEMS].map((i) => [i.id, i]));
const buyCost = (d) => (d.buy.item ? ANY_ITEM[d.buy.item].price.coins : d.buy.stock * FOOD_COST);

/* ---------------- rewards ---------------- */

// The share of the next level's buy mission a level-up pays: half at first,
// a little less as the levels go on, so the later ones take real saving.
export const rewardShare = (L) => 0.5 - (0.25 * (L - 1)) / (MAX_LEVEL - 1);
export const FINAL_REWARD = Object.freeze({ coins: 5000 });

// What clearing level L pays: { coins, diamonds }.
export function rewardOf(L) {
  const diamonds = L % 5 === 0 ? 1 + Math.floor(L / 50) : 0;
  if (L >= MAX_LEVEL) return { coins: FINAL_REWARD.coins, diamonds };
  const cost = buyCost(LEVELS[L]); // level L + 1
  // the first levels: half, rounded down, so it never covers the next item
  const coins = L <= 3 ? Math.floor(cost / 2 / 10) * 10 : Math.max(10, round10(cost * rewardShare(L)));
  return { coins, diamonds };
}

// What clearing level L unlocks: story games, characters, and the
// level-locked items that go on sale at level L + 1.
export function unlocksOf(L) {
  const out = [];
  for (const [game, at] of Object.entries(STORY_UNLOCKS)) if (at === L) out.push({ kind: 'story', id: game, name: GAME[game]?.name ?? game });
  for (const i of ITEMS) if (i.slot === 'char' && i.level === L + 1) out.push({ kind: 'char', id: i.id, name: i.name });
  for (const i of [...ITEMS, ...HOUSE_ITEMS]) if (i.slot !== 'char' && i.level === L + 1) out.push({ kind: 'item', id: i.id, name: i.name });
  return out;
}

/* ---------------- a wallet's levels ---------------- */

const COUNTERS = ['eaten', 'washes', 'naps', 'stocked'];
export const snapshot = (stats) => Object.fromEntries(COUNTERS.map((k) => [k, num(stats?.[k])]));

export function levelsOf(w) {
  const lv = w?.lv;
  if (lv && typeof lv === 'object' && Number.isInteger(lv.n)) {
    return { n: Math.min(MAX_LEVEL, Math.max(0, lv.n)), at: lv.at && typeof lv.at === 'object' ? lv.at : snapshot(w.stats), best: lv.best && typeof lv.best === 'object' ? lv.best : {} };
  }
  return { n: 0, at: snapshot(w?.stats), best: {} };
}
// A wallet with its levels filled in (see the top of this file).
export const withLevels = (w) => (w.lv ? w : { ...w, lv: levelsOf(w) });

export const levelsCleared = (w) => levelsOf(w).n;
// The level being played (MAX_LEVEL + 1 once all are cleared): an item with
// `level` is available once this reaches it.
export const levelReached = (w) => levelsOf(w).n + 1;
export const levelLocked = (w, item) => item?.level != null && levelReached(w) < item.level;

export function storyOpen(w, game) {
  const need = STORY_UNLOCKS[game];
  if (need == null || levelsCleared(w) >= need) return true;
  const claimed = Array.isArray(w?.claimed) ? w.claimed : [];
  return claimed.some((c) => STORY_OF_CLAIM(c) === game);
}

// Where the current level stands: { level, max (all cleared), missions:
// [{ kind: 'play' | 'buy' | 'stock' | 'care', ...the mission, have, need,
// done }], done (how many), ready (all three), reward, unlocks }.
export function levelState(w) {
  const lv = levelsOf(w);
  if (lv.n >= MAX_LEVEL) return { level: MAX_LEVEL, max: true, missions: [], done: 3, ready: false, reward: null, unlocks: [] };
  const L = lv.n + 1;
  const d = LEVELS[L - 1];
  const s = w?.stats ?? {};
  const owned = Array.isArray(w?.owned) ? w.owned : [];
  const since = (k) => Math.max(0, num(s[k]) - num(lv.at[k]));
  const missions = [
    { kind: 'play', game: d.play.game, have: num(lv.best[d.play.game]), need: d.play.target, level: L, skip: skipCost(L) },
    d.buy.item ? { kind: 'buy', item: d.buy.item, have: owned.includes(d.buy.item) ? 1 : 0, need: 1 } : { kind: 'stock', have: since('stocked'), need: d.buy.stock },
    { kind: 'care', care: d.care.id, have: since(d.care.stat), need: d.care.count },
  ].map((m) => ({ ...m, have: Math.min(m.have, m.need), done: m.have >= m.need }));
  const done = missions.filter((m) => m.done).length;
  return { level: L, max: false, missions, done, ready: done === missions.length, reward: rewardOf(L), unlocks: unlocksOf(L) };
}

/* ---------------- events (called from rules.js) ---------------- */

// { id, type: 'levelup', level } clears the current level: only that level
// (n + 1), only once all three missions are done. Pays rewardOf(level) and
// starts the next level from the counters as they are now.
// Also refuses, for everything else: buying an item before its level, and a
// story reward of a story that is still locked. The new wallet, null when
// not allowed, or undefined when it isn't a level matter at all.
export function applyLevelEvent(w, ev, item) {
  if (ev.type === 'levelup') {
    const st = levelState(w);
    if (st.max || ev.level !== st.level || !st.ready) return null;
    return {
      ...w,
      coins: w.coins + st.reward.coins,
      diamonds: w.diamonds + st.reward.diamonds,
      lv: { n: st.level, at: snapshot(w.stats), best: {} },
    };
  }
  // { id, type: 'skipplay', level }: pays skipCost(level) diamonds to count
  // the current level's play mission as done
  if (ev.type === 'skipplay') {
    const st = levelState(w);
    const play = st.missions?.find((m) => m.kind === 'play');
    if (st.max || ev.level !== st.level || !play || play.done || w.diamonds < play.skip) return null;
    const lv = levelsOf(w);
    return { ...w, diamonds: w.diamonds - play.skip, lv: { ...lv, best: { ...lv.best, [play.game]: play.need } } };
  }
  if (ev.type === 'buy' && levelLocked(w, item)) return null;
  if (ev.type === 'claim') {
    const game = STORY_OF_CLAIM(ev.claim);
    if (game && !storyOpen(w, game)) return null;
  }
  return undefined;
}

// The play mission can be bought instead of played: 1 diamond at first,
// rising by one every 25 levels (8 at level 200).
export const skipCost = (L) => 1 + Math.floor((L - 1) / 25);

// A run's score, for the play mission (the clamped one applyRun uses).
export function levelBest(w, game, score) {
  const lv = levelsOf(w);
  return { ...lv, best: { ...lv.best, [game]: Math.max(num(lv.best[game]), Math.floor(num(score))) } };
}

// After an accepted event: a 'stock' counts towards the stock missions.
export const countLevelStats = (w, ev) => (ev.type === 'stock' ? { ...w, stats: { ...w.stats, stocked: num(w.stats?.stocked) + 1 } } : w);
