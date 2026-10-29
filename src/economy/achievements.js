// Achievements: the only steady source of diamonds. Shared by the browser and
// the server, like catalog.js, so a claim is checked against the same table
// (and the same stats) on both.
//
// Most achievements have five levels, Bronze, Silver, Gold, then Platinum
// and Diamond (much harder: the thresholds grow exponentially), each with a
// threshold on one stat and a reward (diamonds, or `coins`). The stories
// keep three (a story only has so many parts), and a couple of absurd ones
// have a single level (`medals`). Levels are claimed by hand, in order, with
// an { type: 'achieve', ach, level } event (see rules.js).
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
  { id: 'platinum', name: 'Platinum' },
  { id: 'diamond', name: 'Diamond' },
];
export const MEDAL = Object.fromEntries(MEDALS.map((m) => [m.id, m]));
// The medals an achievement has, in order (most have all five).
export const medalsOf = (a) => (a.medals ?? MEDALS.map((m) => m.id).slice(0, a.levels.length)).map((id) => MEDAL[id]);

// What a wallet counts as it is played (wallet.stats). All optional, so old
// wallets just start counting from zero.
//   best       { [game]: best score of a run (coins grabbed, for Button Run) }
//   runs       Adventure runs finished (a continued run is one run)
//   runCoins   coins paid by those runs (after the daily cap)
//   eaten      snacks he ate        naps       times he went to bed
//   days       distinct UTC days with a timed event, lastDay the last one
//   chests     daily chests opened, chestDay the day of the last one,
//   streak     consecutive chest days so far, bestStreak the longest
//   washes     baths            stocked   foods bought for the fridge
//   equips     outfit changes   placed    furniture put down or moved
//   potions    potions drunk    boosts    paid energy boosts
//   continues  paid Continues   boughtChests  coin chests opened
//   (counted by countUses in rules.js, and the chest code)
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
    owned: count(owned, (id) => !!(ITEM[id]?.price || HOUSE_ITEM[id]?.price)),
    washes: num(st.washes),
    stocked: num(st.stocked),
    equips: num(st.equips),
    placed: num(st.placed),
    potions: num(st.potions),
    boosts: num(st.boosts),
    continues: num(st.continues),
    boughtChests: num(st.boughtChests),
    redecorated: num(st.redecorated),
    wakes: num(st.wakes),
    codes: Array.isArray(w?.codes) ? w.codes.length : 0,
    pleaseDont: claimed.includes('please-dont') ? 1 : 0,
    levels: num(w?.lv?.n),
    quests: Array.isArray(w?.quests) ? w.quests.length : 0,
    // medals claimed, and achievements finished, not counting the two meta ones
    medals: ACHIEVEMENTS.filter((a) => !a.meta).reduce((n, a) => n + Math.min(num(w?.achieved?.[a.id]), a.levels.length), 0),
    complete: ACHIEVEMENTS.filter((a) => !a.meta).filter((a) => num(w?.achieved?.[a.id]) >= a.levels.length).length,
  };
}

export const CATEGORIES = [
  { id: 'daily', name: 'Daily', blurb: 'Keep coming back. He pretends not to notice.' },
  { id: 'adventure', name: 'Adventure', blurb: 'Beat your best in every arcade game. The button keeps score. Grudgingly.' },
  { id: 'home', name: 'Home & Wardrobe', blurb: 'Spend money on a button that hates you. Get diamonds for it.' },
  { id: 'story', name: 'Story', blurb: 'Finish the stories. Bring tissues, collect diamonds.' },
  { id: 'legend', name: 'Legendary', blurb: 'Nobody will ever finish these. Prove us wrong.' },
];

// Platinum and Diamond on top of a three-level ladder: the thresholds grow
// exponentially (x4, then x15 of Gold), the diamonds a little.
const five = (levels) => {
  const [, , [gold, d]] = levels;
  const nice = (n) => (n < 100 ? Math.round(n) : n < 1000 ? Math.round(n / 10) * 10 : Math.round(n / 100) * 100);
  return [...levels, [nice(gold * 4), d + 2], [nice(gold * 15), d + 4]];
};

// One "score N in <game>" achievement per Adventure game. Bronze is one pay
// tier (a decent first evening), Silver two, Gold four (a great run), then
// Platinum and Diamond far beyond.
const scoreAch = (game, name, icon, levels, d = [1, 2, 3]) => ({
  id: `score-${game}`,
  cat: 'adventure',
  game,
  icon,
  name,
  stat: (s) => s.best[game] ?? 0,
  goal: (n) => (GAME[game].payout.coins ? `Grab ${n} coins in one ${GAME[game].name} run` : `Reach ${n} ${GAME[game].unit} in ${GAME[game].name}`),
  levels: five(levels.map((at, i) => [at, d[i]])).map(([at, diamonds]) => ({ at, diamonds })),
});

// `levels`: [threshold, diamonds] pairs, three of them (Platinum and Diamond
// are added, see five) unless `opts.keep` (the stories) or `opts.medals`.
const ach = (id, cat, icon, name, stat, goal, levels, opts = {}) => ({
  id,
  cat,
  icon,
  name,
  stat,
  goal,
  ...opts,
  levels: (opts.keep || opts.medals ? levels : five(levels)).map(([at, diamonds, coins]) => ({ at, diamonds, ...(coins ? { coins } : {}) })),
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
  scoreAch('table-tennis', 'Speak to the Manager', '🏓', [5, 10, 20]),
  ach('runs', 'adventure', '🎮', 'Professional Loser', (s) => s.runs, (n) => `Finish ${plural(n, 'Adventure run')}`, [[10, 1], [50, 3], [200, 6]]),
  ach('run-coins', 'adventure', '🪙', 'Capitalism Enjoyer', (s) => s.runCoins, (n) => `Earn ${n} 🪙 from Adventure runs`, [[1000, 1], [10000, 3], [50000, 6]]),

  /* ---------- Story ---------- */
  ach('story-reason', 'story', '🗡️', 'Emotional Damage', (s) => s.reason, (n) => (n === 9 ? 'Finish The Reason (all 9 episodes)' : `Finish ${plural(n, 'episode')} of The Reason`), [[1, 1], [5, 3], [9, 8]], { keep: true }),
  ach('story-cursor', 'story', '💍', 'Hopeless Romantic', (s) => s.cursor, (n) => (n === 6 ? 'Finish How I Met Your Cursor (all 6 chapters)' : `Finish ${plural(n, 'chapter')} of How I Met Your Cursor`), [[1, 1], [3, 3], [6, 6]], { keep: true }),
  // (Please Don't pays nothing, on purpose; finishing it is worth one medal)
  ach('please-dont', 'story', '🎁', "Please Didn't", (s) => s.pleaseDont, () => "Finish Please Don't", [[1, 3]], { medals: ['gold'] }),
  ach('stories', 'story', '📚', 'Bookworm', (s) => s.reason + s.cursor, (n) => (n === 15 ? 'Finish both platformer stories (all 15 parts)' : `Finish ${n} episodes or chapters, in any story`), [[3, 1], [8, 2], [15, 4]], { keep: true }),

  /* ---------- Home & Wardrobe ---------- */
  // (owning things tops out at the catalog, so these grow more gently)
  ach('outfits', 'home', '🎩', 'Drip Check', (s) => s.outfits, (n) => `Own ${plural(n, 'outfit item')}`, [[1, 1], [6, 2], [15, 4], [35, 6], [70, 8]], { keep: true }),
  ach('furniture', 'home', '🛋️', 'Interior Disaster', (s) => s.furniture, (n) => `Own ${plural(n, 'piece', 'pieces')} of furniture`, [[3, 1], [8, 2], [15, 4], [40, 6], [75, 8]], { keep: true }),
  ach('rooms', 'home', '🖼️', 'Feng Shui Crimes', (s) => s.rooms, (n) => `Own ${plural(n, 'wallpaper or floor', 'wallpapers and floors')}`, [[1, 1], [4, 2], [8, 4], [16, 6], [28, 8]], { keep: true }),
  ach('eaten', 'home', '🍪', 'Feeding Frenzy', (s) => s.eaten, (n) => `Feed him ${plural(n, 'snack')}`, [[10, 1], [50, 2], [200, 4]]),
  ach('naps', 'home', '💤', 'Nap Champion', (s) => s.naps, (n) => `Put him to bed ${plural(n, 'time')}`, [[3, 1], [15, 2], [50, 4]]),

  /* ---------- Daily ---------- */
  ach('days', 'daily', '📅', "Can't Stay Away", (s) => s.days, (n) => `Play on ${plural(n, 'different day')}`, [[3, 1], [10, 3], [30, 6]]),
  ach('chests', 'daily', '🎁', 'Treasure Goblin', (s) => s.chests, (n) => `Open ${plural(n, 'daily chest')}`, [[5, 1], [25, 2], [100, 4]]),
  ach('streak', 'daily', '🔥', 'Streak Freak', (s) => s.bestStreak, (n) => `Open the chest ${n} days in a row`, [[3, 1], [7, 2], [30, 5], [100, 8], [365, 12]], { keep: true }),
  ach('washes', 'daily', '🧼', 'Squeaky Clean', (s) => s.washes, (n) => `Give him ${plural(n, 'bath')}`, [[3, 1], [15, 2], [50, 4]]),
  ach('stocked', 'daily', '🛒', 'Doomsday Prepper', (s) => s.stocked, (n) => `Stock the fridge with ${plural(n, 'food')}`, [[5, 1], [25, 2], [100, 4]]),
  ach('boosts', 'daily', '⏰', 'Caffeine Dependency', (s) => s.boosts, (n) => `Wake him with ${plural(n, 'energy boost')}`, [[1, 1], [10, 2], [40, 4]]),

  /* ---------- Adventure, the rest ---------- */
  ach('continues', 'adventure', '💎', 'Pay to Win', (s) => s.continues, (n) => `Pay for ${plural(n, 'Continue')}`, [[1, 1], [10, 2], [50, 4]]),
  ach('levels', 'adventure', '⭐', 'Social Climber', (s) => s.levels, (n) => `Beat level ${n}`, [[5, 1], [20, 3], [50, 6], [100, 10], [200, 20]], { keep: true }),
  ach('quests', 'adventure', '🏆', 'Overachiever', (s) => s.quests, (n) => `Finish ${plural(n, 'hard quest')}`, [[1, 2], [3, 4], [5, 6], [8, 10], [11, 15]], { keep: true }),

  /* ---------- Home, the rest ---------- */
  ach('owned', 'home', '🛍️', 'Shopaholic', (s) => s.owned, (n) => `Own ${plural(n, 'thing')} in all`, [[10, 1], [30, 2], [60, 4], [100, 6], [160, 10]], { keep: true }),
  ach('equips', 'home', '👕', 'Fashion Victim', (s) => s.equips, (n) => `Change his look ${plural(n, 'time')}`, [[5, 1], [25, 2], [100, 4]]),
  ach('placed', 'home', '🪑', 'Interior Designer', (s) => s.placed, (n) => `Place or move furniture ${plural(n, 'time')}`, [[5, 1], [25, 2], [100, 4]]),
  ach('potions', 'home', '🧪', 'Mad Scientist', (s) => s.potions, (n) => `Give him ${plural(n, 'potion')}`, [[1, 1], [10, 2], [40, 4]]),
  ach('bought-chests', 'home', '🎲', 'Gambling Problem', (s) => s.boughtChests, (n) => `Open ${plural(n, 'coin chest')}`, [[1, 1], [10, 2], [40, 4]]),
  ach('redecorated', 'home', '🖼️', 'Mood Board', (s) => s.redecorated, (n) => `Change a wallpaper or floor ${plural(n, 'time')}`, [[3, 1], [10, 2], [30, 4]]),
  ach('wakes', 'daily', '🛏️', 'Rise and Grind', (s) => s.wakes, (n) => `Wake him up yourself ${plural(n, 'time')}`, [[3, 1], [15, 2], [50, 4]]),
  ach('medals', 'home', '🥇', 'Medal Collector', (s) => s.medals, (n) => `Claim ${plural(n, 'medal')}`, [[10, 2], [40, 4], [80, 6], [120, 10], [170, 15]], { keep: true }),

  /* ---------- Legendary: one level each, and they pay one coin ---------- */
  ach('forever', 'legend', '📅', 'Why Are You Still Here', (s) => s.days, (n) => `Play on ${plural(n, 'different day')}`, [[1000, 0, 1]], { medals: ['diamond'], meta: true }),
  ach('cheater', 'legend', '⌨️', 'Cheater', (s) => s.codes, () => 'Use a code', [[1, 0, 1]], { medals: ['diamond'], meta: true }),
  ach('everything', 'legend', '🏆', 'Completionist', (s) => s.complete, (n) => `Finish every other achievement (${n})`, [[0, 0, 1]], { medals: ['diamond'], meta: true }),
];
// Completionist needs every other one finished (the count is known only now).
ACHIEVEMENTS.find((a) => a.id === 'everything').levels[0].at = ACHIEVEMENTS.filter((a) => !a.meta).length;

// Achievements of retired games: hidden, but kept so levels already claimed
// still replay (on the server too).
const RETIRED = [scoreAch('catch', 'Stress Eater', '🍩', [25, 50, 100])];

export const ACHIEVEMENT = Object.fromEntries([...ACHIEVEMENTS, ...RETIRED].map((a) => [a.id, a]));

// All the diamonds achievements can ever pay, and what the first three
// levels pay (about what a year of play reaches: Platinum and Diamond take
// far longer).
export const ACHIEVEMENT_DIAMONDS = ACHIEVEMENTS.reduce((n, a) => n + a.levels.reduce((m, l) => m + l.diamonds, 0), 0);
export const ACHIEVEMENT_DIAMONDS_EARLY = ACHIEVEMENTS.reduce((n, a) => n + a.levels.slice(0, 3).reduce((m, l) => m + l.diamonds, 0), 0);

// Levels already claimed (0 to 5).
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
