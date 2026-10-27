import { ITEM, REWARDS, DEFAULT_LOOK, GAME, STORY_REWARDS, RUN_LIMITS } from './catalog';

// A wallet only ever changes through events, and the browser and the server
// run the very same `applyEvent`. The browser applies them right away (so it
// works offline) and queues them; the server replays the queue and its answer
// becomes the new truth.
//
//   { id, type: 'run', game, score, extra, ms, at }
//                                       finished an Adventure run: its score,
//                                       `extra` (Button Run: coins picked up),
//                                       `ms` of play and when it ended; the
//                                       payout is worked out here, not sent
//   { id, type: 'claim', claim }        finished a story part (STORY_REWARDS);
//                                       pays once per wallet, ever
//   { id, type: 'reward', game }        old fixed payout from REWARDS: only
//                                       events queued before the economy rework
//   { id, type: 'buy', item }           bought an item
//   { id, type: 'equip', slot, item }   put an owned item on
//
// Economy fields a wallet picks up as it is used (all optional, so wallets
// saved before them still work):
//   claimed  story reward ids already paid
//   runs     { [game]: best payout of a single run } (for the diamonds)
//   day      { n: day number (UTC), coins: run coins earned that day, ms: play time }
//   legacy   { [REWARDS id]: times paid } (old events are paid a limited number of times)

export const START = Object.freeze({
  coins: 300, // a little welcome money: enough for one cheap item, so the wardrobe isn't just a window
  diamonds: 0,
  owned: [],
  equipped: DEFAULT_LOOK,
});

const pick = (table, id) => (typeof id === 'string' && Object.hasOwn(table, id) ? table[id] : null);

export const owns = (wallet, item) => !item.price || wallet.owned.includes(item.id);

export const canAfford = (wallet, item) =>
  wallet.coins >= (item.price?.coins ?? 0) && wallet.diamonds >= (item.price?.diamonds ?? 0);

// Returns the new wallet, or null when the event is not allowed.
// Events can come straight from a request body, so trust nothing in them.
// `now` caps event times (the server passes its own clock).
export function applyEvent(wallet, ev, now = Infinity) {
  if (!ev || typeof ev !== 'object') return null;

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

export const replay = (wallet, events, now) => events.reduce((w, ev) => applyEvent(w, ev, now) ?? w, wallet);

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

// Rising tiers: the first `per` units pay `base`, the next `per` pay 2*base,
// then 3*base, and so on; a partial tier pays its share, rounded down.
// e.g. per 10, base 25: 10 -> 25, 15 -> 50, 20 -> 75, 30 -> 150, 40 -> 250.
export function tierPayout(score, per, base) {
  score = Math.floor(num(score));
  if (score <= 0) return 0;
  const n = Math.floor(score / per);
  const part = score - n * per;
  return Math.floor((base * (n * (n + 1) * per + 2 * (n + 1) * part)) / (2 * per));
}

// What an Adventure run is worth before any anti-cheat or daily limits.
// `game` is a GAMES entry or id; `extra` is Button Run's coins picked up.
export function adventurePayout(game, score, extra = 0) {
  const g = typeof game === 'string' ? pick(GAME, game) : game;
  const p = g?.payout;
  if (!p) return 0;
  const coins = p.coins ? Math.floor(num(extra)) : tierPayout(score, p.per, p.base);
  return clamp(coins, 0, RUN_LIMITS.maxPayout);
}

// The diamonds a run's payout earns, given the game's best payout before it:
// one the first time a run pays `diamondAt`, and one for a run paying at
// least `recordAt` that beats a best of `diamondAt`+ by `recordBy` times.
export function runDiamonds(payout, best = 0) {
  const L = RUN_LIMITS;
  let d = 0;
  if (payout >= L.diamondAt && best < L.diamondAt) d++;
  if (best >= L.diamondAt && payout >= L.recordAt && payout >= best * L.recordBy) d++;
  return d;
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
  const diamonds = runDiamonds(raw, best);

  return {
    ...add(wallet, { coins, diamonds }),
    runs: { ...wallet.runs, [game.id]: Math.max(best, raw) },
    day: { n, coins: day.coins + raw, ms: day.ms + ms, end: at },
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
