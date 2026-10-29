// Achievements: the only steady source of diamonds. Shared by the browser and
// the server, like catalog.js, so a claim is checked against the same table
// (and the same stats) on both.
//
// Every achievement has three levels, Bronze, Silver and Gold, each with a
// threshold on one stat and a diamond reward. Levels are claimed by hand, in
// order, with an { type: 'achieve', ach, level } event (see rules.js).
//
// Stats are only ever counted by applyEvent from events it has already
// accepted (the server replays them too), or read straight off the wallet
// (what's owned, which story parts were claimed). Nothing here trusts a
// number the browser sends.
import { ITEM, GAME, GAMES } from './catalog';
import { HOUSE_ITEM } from './house';
import { scoreFor } from './tiers';

export const MEDALS = [
  { id: 'bronze', name: 'Bronze' },
  { id: 'silver', name: 'Silver' },
  { id: 'gold', name: 'Gold' },
];

// What a wallet counts as it is played (wallet.stats). All optional, so old
// wallets just start counting from zero.
//   best       { [game]: best score of a run (coins grabbed, for Button Run) }
//   runs       Adventure runs finished (a continued run is one run)
//   runCoins   coins paid by those runs (after the daily cap)
//   eaten      snacks he ate        naps       times he went to bed
//   days       distinct UTC days with a timed event, lastDay the last one
//   chests     daily chests opened, chestDay the day of the last one,
//   streak     consecutive chest days so far, bestStreak the longest
export const EMPTY_STATS = Object.freeze({
  best: Object.freeze({}),
  runs: 0,
  runCoins: 0,
  eaten: 0,
  naps: 0,
  days: 0,
  lastDay: 0,
  chests: 0,
  chestDay: 0,
  streak: 0,
  bestStreak: 0,
});

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const count = (list, test) => list.reduce((n, x) => n + (test(x) ? 1 : 0), 0);

// Everything an achievement can look at, worked out from the wallet.
export function statsOf(w) {
  const st = { ...EMPTY_STATS, ...w?.stats };
  const claimed = Array.isArray(w?.claimed) ? w.claimed : [];
  const owned = Array.isArray(w?.owned) ? w.owned : [];

  // Wallets from before stats only remember each game's best payout; the
  // lowest score that pays that much is a fair floor for the best score.
  const best = {};
  for (const g of GAMES) {
    if (!g.payout) continue;
    const paid = num(w?.runs?.[g.id]);
    const old = g.payout.coins ? paid : scoreFor(paid, g.payout.per, g.payout.base);
    best[g.id] = Math.max(num(st.best?.[g.id]), old);
  }

  const reason = count(claimed, (c) => typeof c === 'string' && c.startsWith('reason:'));
  const cursor = count(claimed, (c) => typeof c === 'string' && c.startsWith('cursor:'));

  return {
    best,
    runs: num(st.runs),
    runCoins: num(st.runCoins),
    eaten: num(st.eaten),
    naps: num(st.naps),
    days: num(st.days),
    chests: num(st.chests),
    bestStreak: num(st.bestStreak),
    reason,
    cursor,
    outfits: count(owned, (id) => !!ITEM[id]?.price),
    furniture: count(owned, (id) => HOUSE_ITEM[id]?.kind === 'furniture' && !!HOUSE_ITEM[id].price),
    rooms: count(owned, (id) => (HOUSE_ITEM[id]?.kind === 'wall' || HOUSE_ITEM[id]?.kind === 'floor') && !!HOUSE_ITEM[id].price),
  };
}

export const CATEGORIES = [
  { id: 'adventure', name: 'Adventure', blurb: 'Beat your best in every arcade game. The button keeps score. Grudgingly.' },
  { id: 'story', name: 'Story', blurb: 'Finish the stories. Bring tissues, collect diamonds.' },
  { id: 'home', name: 'Home & Wardrobe', blurb: 'Spend money on a button that hates you. Get diamonds for it.' },
  { id: 'daily', name: 'Daily', blurb: 'Keep coming back. He pretends not to notice.' },
];

// One "score N in <game>" achievement per Adventure game. Bronze is one pay
// tier (a decent first evening), Silver two, Gold four (a great run).
const scoreAch = (game, name, icon, levels, d = [1, 2, 3]) => ({
  id: `score-${game}`,
  cat: 'adventure',
  game,
  icon,
  name,
  stat: (s) => s.best[game] ?? 0,
  goal: (n) => (GAME[game].payout.coins ? `Grab ${n} coins in one ${GAME[game].name} run` : `Reach ${n} ${GAME[game].unit} in ${GAME[game].name}`),
  levels: levels.map((at, i) => ({ at, diamonds: d[i] })),
});

const ach = (id, cat, icon, name, stat, goal, levels) => ({
  id,
  cat,
  icon,
  name,
  stat,
  goal,
  levels: levels.map(([at, diamonds]) => ({ at, diamonds })),
});

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const ACHIEVEMENTS = [
  /* ---------- Adventure ---------- */
  scoreAch('flap', 'Pipe Dreams', '🪽', [10, 20, 40]),
  scoreAch('pop', 'Family Feud', '🫧', [1000, 2000, 4000]),
  scoreAch('simon', 'Elephant Brain', '🎵', [5, 10, 20]),
  scoreAch('hop', 'Social Distancing', '☁️', [2000, 4000, 8000]),
  scoreAch('whack', 'Anger Management', '🔨', [20, 40, 80]),
  scoreAch('run', 'Restraining Order', '🏃', [600, 1200, 2400]),
  scoreAch('stack', 'Back Problems', '🗼', [12, 24, 48]),
  scoreAch('slice', 'Knife to Meet You', '🔪', [30, 60, 120]),
  scoreAch('button-run', 'Coin Goblin', '⌨️', [50, 100, 200]),
  ach('runs', 'adventure', '🎮', 'Professional Loser', (s) => s.runs, (n) => `Finish ${plural(n, 'Adventure run')}`, [[10, 1], [50, 3], [200, 6]]),
  ach('run-coins', 'adventure', '🪙', 'Capitalism Enjoyer', (s) => s.runCoins, (n) => `Earn ${n} 🪙 from Adventure runs`, [[1000, 1], [10000, 3], [50000, 6]]),

  /* ---------- Story ---------- */
  ach('story-reason', 'story', '🗡️', 'Emotional Damage', (s) => s.reason, (n) => (n === 9 ? 'Finish The Reason (all 9 episodes)' : `Finish ${plural(n, 'episode')} of The Reason`), [[1, 1], [5, 3], [9, 8]]),
  ach('story-cursor', 'story', '💍', 'Hopeless Romantic', (s) => s.cursor, (n) => (n === 6 ? 'Finish How I Met Your Cursor (all 6 chapters)' : `Finish ${plural(n, 'chapter')} of How I Met Your Cursor`), [[1, 1], [3, 3], [6, 6]]),
  // (Please Don't has no achievement: it pays nothing, on purpose. ??? 🎁)
  ach('stories', 'story', '📚', 'Bookworm', (s) => s.reason + s.cursor, (n) => (n === 15 ? 'Finish both platformer stories (all 15 parts)' : `Finish ${n} episodes or chapters, in any story`), [[3, 1], [8, 2], [15, 4]]),

  /* ---------- Home & Wardrobe ---------- */
  ach('outfits', 'home', '🎩', 'Drip Check', (s) => s.outfits, (n) => `Own ${plural(n, 'outfit item')}`, [[1, 1], [6, 2], [15, 4]]),
  ach('furniture', 'home', '🛋️', 'Interior Disaster', (s) => s.furniture, (n) => `Own ${plural(n, 'piece', 'pieces')} of furniture`, [[3, 1], [8, 2], [15, 4]]),
  ach('rooms', 'home', '🖼️', 'Feng Shui Crimes', (s) => s.rooms, (n) => `Own ${plural(n, 'wallpaper or floor', 'wallpapers and floors')}`, [[1, 1], [4, 2], [8, 4]]),
  ach('eaten', 'home', '🍪', 'Feeding Frenzy', (s) => s.eaten, (n) => `Feed him ${plural(n, 'snack')}`, [[10, 1], [50, 2], [200, 4]]),
  ach('naps', 'home', '💤', 'Nap Champion', (s) => s.naps, (n) => `Put him to bed ${plural(n, 'time')}`, [[3, 1], [15, 2], [50, 4]]),

  /* ---------- Daily ---------- */
  ach('days', 'daily', '📅', "Can't Stay Away", (s) => s.days, (n) => `Play on ${plural(n, 'different day')}`, [[3, 1], [10, 3], [30, 6]]),
  ach('chests', 'daily', '🎁', 'Treasure Goblin', (s) => s.chests, (n) => `Open ${plural(n, 'daily chest')}`, [[5, 1], [25, 2], [100, 4]]),
  ach('streak', 'daily', '🔥', 'Streak Freak', (s) => s.bestStreak, (n) => `Open the chest ${n} days in a row`, [[3, 1], [7, 2], [30, 5]]),
];

// Achievements of retired games: hidden, but kept so levels already claimed
// still replay (on the server too).
const RETIRED = [scoreAch('catch', 'Stress Eater', '🍩', [25, 50, 100])];

export const ACHIEVEMENT = Object.fromEntries([...ACHIEVEMENTS, ...RETIRED].map((a) => [a.id, a]));

// All the diamonds achievements can ever pay.
export const ACHIEVEMENT_DIAMONDS = ACHIEVEMENTS.reduce((n, a) => n + a.levels.reduce((m, l) => m + l.diamonds, 0), 0);

// Levels already claimed (0 to 3).
export const levelOf = (wallet, id) => Math.max(0, Math.floor(num(wallet?.achieved?.[id])));

// Each achievement's state: { a, level (claimed), value, next (level object or
// null when done), ready (the next level can be claimed), claimable (how many
// levels could be claimed, one after another) }.
export function achievementStates(wallet, stats = statsOf(wallet)) {
  return ACHIEVEMENTS.map((a) => {
    const level = Math.min(levelOf(wallet, a.id), a.levels.length);
    const value = a.stat(stats);
    const next = a.levels[level] ?? null;
    let claimable = 0;
    while (level + claimable < a.levels.length && value >= a.levels[level + claimable].at) claimable++;
    return { a, level, value, next, ready: claimable > 0, claimable };
  });
}

// How many levels could be claimed right now (for the badge on the home page).
export const readyCount = (wallet) => achievementStates(wallet).reduce((n, x) => n + x.claimable, 0);

// Achievements with a level that just became claimable: for the
// "Achievement ready!" line after a run or a story part.
export function newlyReady(before, after) {
  const was = Object.fromEntries(achievementStates(before).map((x) => [x.a.id, x.level + x.claimable]));
  return achievementStates(after)
    .filter((x) => x.level + x.claimable > (was[x.a.id] ?? 0))
    .map((x) => x.a);
}
