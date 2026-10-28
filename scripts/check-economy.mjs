// Plain-node checks for the economy rules: `node scripts/check-economy.mjs`.
// The app's modules use extensionless imports (Next resolves them), so a tiny
// resolve hook adds `.js` here.
import { register } from 'node:module';
import assert from 'node:assert/strict';

register(
  'data:text/javascript,' +
    encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  try { return await next(spec, ctx); }
  catch (e) { if (spec.startsWith('.') && !spec.endsWith('.js')) return next(spec + '.js', ctx); throw e; }
}`)
);

const { tierPayout, adventurePayout, applyEvent, replay, normalize, chestFor, START } = await import('../src/economy/rules.js');
const { GAMES, ITEMS, RUN_LIMITS } = await import('../src/economy/catalog.js');
const { HOUSE_ITEMS } = await import('../src/economy/house.js');
const { legacyReplay } = await import('../src/economy/legacy.js');
const { ACHIEVEMENTS, ACHIEVEMENT_DIAMONDS, statsOf, readyCount, newlyReady, MEDALS } = await import('../src/economy/achievements.js');
const { chestLoot, CHEST } = await import('../src/economy/chest.js');
const { scoreFor } = await import('../src/economy/tiers.js');

// Flappy: 25 for pipes 1-10, 50 more for 11-20, 75 more for 21-30...
assert.equal(tierPayout(0, 10, 25), 0);
assert.equal(tierPayout(1, 10, 25), 2);
assert.equal(tierPayout(10, 10, 25), 25);
assert.equal(tierPayout(15, 10, 25), 50);
assert.equal(tierPayout(20, 10, 25), 75);
assert.equal(tierPayout(25, 10, 25), 112);
assert.equal(tierPayout(30, 10, 25), 150);
assert.equal(tierPayout(40, 10, 25), 250);
assert.equal(adventurePayout('flap', 15), 50);
assert.equal(adventurePayout('flap', 200), RUN_LIMITS.maxPayout);
// Button Run: the coins picked up, 1:1
assert.equal(adventurePayout('button-run', 99999, 37), 37);

// scoreFor: the lowest score paying at least a payout
assert.equal(scoreFor(50, 10, 25), 15);
assert.equal(scoreFor(150, 10, 25), 30);
assert.equal(scoreFor(0, 10, 25), 0);

// A run event pays the same through applyEvent, and remembers the best
const T = Date.UTC(2026, 9, 28, 12);
let w = { ...START, coins: 0 };
w = applyEvent(w, { type: 'run', game: 'flap', score: 15, ms: 40_000, at: T });
assert.equal(w.coins, 50);
assert.equal(w.runs.flap, 50);
w = applyEvent(w, { type: 'run', game: 'button-run', score: 4000, extra: 61, ms: 90_000, at: T + 100_000 });
assert.equal(w.coins, 111);
// a score the play time can't explain is cut down to what it allows
const fast = applyEvent({ ...START, coins: 0 }, { type: 'run', game: 'flap', score: 500, ms: 10_000, at: T });
assert.equal(fast.coins, tierPayout(15 + 5, 10, 25)); // 1.5 pipes/s * 10s + half a tier of slack
// runs can't overlap: two 30-minute runs ending a minute apart
let o = applyEvent({ ...START, coins: 0 }, { type: 'run', game: 'simon', score: 10, ms: 60_000, at: T });
const o1 = o.coins;
o = applyEvent(o, { type: 'run', game: 'simon', score: 10, ms: 60_000, at: T + 1_000 });
assert.ok(o.coins - o1 < o1, 'an overlapping run is clipped');
// junk is rejected or paid nothing
assert.equal(applyEvent(START, { type: 'run', game: 'nope', score: 9 }), null);
assert.equal(applyEvent({ ...START, coins: 0 }, { type: 'run', game: 'flap', score: 'x', ms: -5, at: T }).coins, 0);
// the daily soft cap
let d = { ...START, coins: 0 };
for (let i = 0; i < 20; i++) d = applyEvent(d, { type: 'run', game: 'flap', score: 40, ms: 600_000, at: T + i * 700_000 });
assert.equal(d.day.coins, 20 * 250);
assert.equal(d.coins, 3000 + Math.floor(250 * 0.25) * 8);

// Story parts pay once
let s = { ...START, coins: 0 };
s = applyEvent(s, { type: 'claim', claim: 'reason:1' });
assert.equal(s.coins, 200);
assert.equal(applyEvent(s, { type: 'claim', claim: 'reason:1' }), null);
s = applyEvent(s, { type: 'claim', claim: 'reason:9' });
assert.deepEqual([s.coins, s.diamonds], [1700, 0]); // finales pay coins; diamonds come from achievements
assert.equal(applyEvent(s, { type: 'claim', claim: 'reason:10' }), null);
// Old fixed rewards still pay, a limited number of times
let l = replay({ ...START, coins: 0 }, Array.from({ length: 3 }, () => ({ type: 'reward', game: 'please-dont' })));
assert.deepEqual([l.coins, l.diamonds], [20, 1]);

// A guest's old queue folds under the old prices
const old = legacyReplay({ coins: 50, diamonds: 0, owned: [], equipped: START.equipped }, [
  { type: 'reward', game: 'adventure-goal' },
  { type: 'buy', item: 'eyes-sleepy' },
  { type: 'equip', slot: 'eyes', item: 'eyes-sleepy' },
]);
assert.deepEqual([old.coins, old.owned, old.equipped.eyes], [28, ['eyes-sleepy'], 'eyes-sleepy']);

// Continue with diamonds: 1, 2, then 3 diamonds, at most 3 per run
const { continueCost, MAX_CONTINUES } = await import('../src/economy/rules.js');
assert.deepEqual([continueCost(1), continueCost(2), continueCost(3), continueCost(4), MAX_CONTINUES], [1, 2, 3, null, 3]);
let c = { ...START, coins: 0, diamonds: 7 };
c = applyEvent(c, { type: 'continue', game: 'flap', n: 1, at: T });
c = applyEvent(c, { type: 'continue', game: 'flap', n: 2, at: T + 1 });
assert.equal(c.diamonds, 4);
assert.equal(applyEvent({ ...c, diamonds: 2 }, { type: 'continue', game: 'flap', n: 3, at: T }), null, "can't afford");
assert.equal(applyEvent(c, { type: 'continue', game: 'flap', n: 4, at: T }), null, 'at most 3');
for (const n of [0, -1, 1.5, '1', null]) assert.equal(applyEvent(c, { type: 'continue', game: 'flap', n }), null);
assert.equal(applyEvent(c, { type: 'continue', game: 'nope', n: 1 }), null);
assert.equal(applyEvent(c, { type: 'continue', game: 'the-reason', n: 1 }), null, 'Adventure games only');
// replayed like any other event: the queue can't overspend
assert.equal(replay({ ...START, diamonds: 3 }, [1, 2, 3].map((n) => ({ type: 'continue', game: 'pop', n }))).diamonds, 0);
// a continued run pays by its final score over all its play time: 3 segments
// of 20 s with 12 pipes each still fit the 1.5 pipes/s cap
const runEv = { type: 'run', game: 'flap', score: 36, ms: 60_000, at: T, continues: 2 };
assert.equal(applyEvent({ ...START, coins: 0 }, runEv).coins, adventurePayout('flap', 36));
// and old run events without `continues` pay the same
assert.equal(applyEvent({ ...START, coins: 0 }, { ...runEv, continues: undefined }).coins, adventurePayout('flap', 36));

/* ---------- stats ---------- */
// runs never pay diamonds now, and count into the stats with their clamped score
let st = { ...START, coins: 0 };
st = applyEvent(st, { type: 'run', game: 'flap', score: 40, ms: 600_000, at: T });
assert.equal(st.diamonds, 0);
assert.deepEqual([st.stats.runs, st.stats.runCoins, st.stats.best.flap], [1, 250, 40]);
st = applyEvent(st, { type: 'run', game: 'flap', score: 500, ms: 10_000, at: T + 700_000 }); // cut down to 20
assert.deepEqual([st.stats.runs, st.stats.best.flap], [2, 40]);
st = applyEvent(st, { type: 'run', game: 'button-run', score: 9000, extra: 61, ms: 90_000, at: T + 900_000 });
assert.equal(st.stats.best['button-run'], 61); // Button Run's "score" for achievements is coins grabbed
assert.equal(st.stats.days, 1); // all on one day
st = applyEvent(st, { type: 'play', kind: 'adventure', at: T + 86_400_000 });
assert.equal(st.stats.days, 2);
st = applyEvent(st, { type: 'feed', item: 'food-cookie', at: T + 86_400_001 });
st = applyEvent(st, { type: 'sleep', at: T + 86_400_002 });
assert.deepEqual([st.stats.eaten, st.stats.naps, st.stats.days], [1, 1, 2]);
// a backdated event (on the server) doesn't add a day
const NOW = T + 2 * 86_400_000;
assert.equal(applyEvent(st, { type: 'wake', at: T - 30 * 86_400_000 }, NOW)?.stats.days ?? 2, 2);

// an old profile (no stats) loads, and its best payouts become best scores
const oldProfile = { coins: 900, diamonds: 7, owned: ['eyes-sleepy', 'plant-cactus', 'wall-mint'], equipped: START.equipped, runs: { flap: 150, 'button-run': 80 }, claimed: ['reason:1', 'reason:2', 'reason:3', 'reason:4', 'reason:5', 'cursor:1', 'cursor:2', 'cursor:3', 'please-dont'] };
const on = normalize(oldProfile);
assert.deepEqual([on.coins, on.diamonds, on.stats.runs, on.achieved, on.pantry], [900, 7, 0, {}, {}]);
const os = statsOf(on);
assert.deepEqual([os.best.flap, os.best['button-run'], os.reason, os.cursor, os.outfits, os.furniture, os.rooms], [30, 80, 5, 3, 1, 1, 1]);

/* ---------- achievements ---------- */
assert.ok(ACHIEVEMENTS.length >= 15 && ACHIEVEMENTS.length <= 25);
assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
for (const a of ACHIEVEMENTS) {
  assert.equal(a.levels.length, MEDALS.length, `${a.id} has 3 levels`);
  a.levels.forEach((l, i) => {
    assert.ok(l.diamonds > 0 && typeof a.goal(l.at) === 'string' && a.goal(l.at), `${a.id} level ${i + 1}`);
    if (i) assert.ok(l.at > a.levels[i - 1].at && l.diamonds >= a.levels[i - 1].diamonds, `${a.id} rises`);
  });
}
// claiming: in order, only when the stat is there, once
let ac = normalize(oldProfile);
assert.equal(readyCount(ac), 11); // flap B+S, button-run B, reason B+S, cursor B+S, bookworm B+S, outfits B, rooms B
assert.equal(applyEvent(ac, { type: 'achieve', ach: 'story-cursor', level: 2 }), null); // not in order
ac = applyEvent(ac, { type: 'achieve', ach: 'story-cursor', level: 1 });
ac = applyEvent(ac, { type: 'achieve', ach: 'story-cursor', level: 2 });
assert.equal(ac.diamonds, 7 + 1 + 3);
assert.equal(applyEvent(ac, { type: 'achieve', ach: 'story-cursor', level: 3 }), null); // 3 of 6 chapters
for (const n of [4, 5, 6]) ac = applyEvent(ac, { type: 'claim', claim: 'cursor:' + n });
ac = applyEvent(ac, { type: 'achieve', ach: 'story-cursor', level: 3 });
assert.equal(ac.diamonds, 7 + 1 + 3 + 6);
assert.equal(applyEvent(ac, { type: 'achieve', ach: 'story-cursor', level: 3 }), null); // once
assert.equal(applyEvent(ac, { type: 'achieve', ach: 'story-cursor', level: 4 }), null); // no level 4
assert.equal(applyEvent(ac, { type: 'achieve', ach: 'story-reason', level: 2 }), null); // not in order
assert.equal(applyEvent(ac, { type: 'achieve', ach: 'score-flap', level: 2 }), null); // not in order
assert.equal(applyEvent(ac, { type: 'achieve', ach: 'nope', level: 1 }), null);
assert.equal(applyEvent(ac, { type: 'achieve', ach: '__proto__', level: 1 }), null);
assert.equal(applyEvent(ac, { type: 'achieve', ach: 'score-flap', level: '1' }), null);
ac = applyEvent(ac, { type: 'achieve', ach: 'score-flap', level: 1 });
assert.equal(ac.achieved['score-flap'], 1);
// a run that crosses a threshold makes a level ready
const before = normalize({ ...START, coins: 0 });
const after = applyEvent(before, { type: 'run', game: 'flap', score: 12, ms: 60_000, at: T });
assert.deepEqual(newlyReady(before, after).map((a) => a.id), ['score-flap']);
// a brand new player: a decent first Flappy run and ten runs are a few diamonds
let np = normalize({ ...START, coins: 0 });
for (let i = 0; i < 10; i++) np = applyEvent(np, { type: 'run', game: 'flap', score: 12, ms: 60_000, at: T + i * 120_000 });
assert.equal(readyCount(np), 2);

/* ---------- the daily chest ---------- */
const D = Math.floor(T / 86_400_000);
assert.deepEqual(chestLoot('abc', D, 1), chestLoot('abc', D, 1)); // the same seed and day: the same loot
let lootSeen = { food: 0, energy: 0, diamonds: 0 };
for (let d = 0; d < 1000; d++) {
  const l = chestLoot('seed-' + (d % 7), D + d, 1);
  assert.ok(l.coins >= CHEST.coins[0] && l.coins <= CHEST.coins[1] && l.coins % 5 === 0);
  lootSeen.food += !!l.food;
  lootSeen.energy += l.energy;
  lootSeen.diamonds += l.diamonds;
}
assert.ok(lootSeen.food > 300 && lootSeen.food < 500 && lootSeen.energy > 170 && lootSeen.energy < 330 && lootSeen.diamonds > 15 && lootSeen.diamonds < 70, JSON.stringify(lootSeen));
const big = chestLoot('abc', D, 7);
assert.ok(big.big && big.diamonds === 1 && big.coins >= CHEST.bigCoins[0] && big.food === 'food-floppy' && big.energy);

let ch = normalize({ ...START, coins: 0, seed: 'abc' });
const at = (d, h = 12) => (D + d) * 86_400_000 + h * 3_600_000;
ch = applyEvent(ch, { type: 'chest', at: at(0) }, at(0, 13));
const l0 = chestLoot('abc', D, 1);
assert.deepEqual([ch.coins, ch.diamonds, ch.stats.chests, ch.stats.streak], [l0.coins, l0.diamonds, 1, 1]);
if (l0.food) assert.equal(ch.pantry[l0.food], 1);
assert.equal(applyEvent(ch, { type: 'chest', at: at(0, 20) }, at(0, 21)), null); // once a day
assert.equal(applyEvent(ch, { type: 'chest', at: at(1) }, at(0, 21)), null); // the server's clock decides the day
assert.equal(chestFor(ch, at(0, 22)).ready, false);
assert.equal(chestFor(ch, at(1)).ready, true);
for (let d = 1; d < 7; d++) ch = applyEvent(ch, { type: 'chest', at: at(d) }, at(d, 13));
assert.deepEqual([ch.stats.streak, ch.stats.bestStreak, ch.stats.chests], [7, 7, 7]);
assert.ok(ch.pantry['food-floppy'] >= 1); // day 7: the big chest
ch = applyEvent(ch, { type: 'chest', at: at(9) }, at(9, 13)); // missed a day: the streak starts again
assert.deepEqual([ch.stats.streak, ch.stats.bestStreak], [1, 7]);
// the seed comes from the wallet, never from the event
const seeded = applyEvent(normalize({ ...START, coins: 0, seed: 'abc' }), { type: 'chest', at: at(0), seed: 'zzz', coins: 9999 }, at(0, 13));
assert.equal(seeded.coins, l0.coins);
// a backdated chest is refused on the server
assert.equal(applyEvent(normalize({ ...START, seed: 'abc' }), { type: 'chest', at: at(-30) }, at(0)), null);
// a snack from the chest is eaten for free (before any paid one)
let pa = normalize({ ...START, coins: 0, pantry: { 'food-usb': 1 } });
pa = applyEvent(pa, { type: 'feed', item: 'food-usb', at: T });
assert.deepEqual([pa.coins, pa.pantry['food-usb']], [0, 0]);
assert.equal(applyEvent(pa, { type: 'feed', item: 'food-usb', at: T + 1 }), null); // none left and no coins

/* ---------- the diamond balance ---------- */
const itemDiamonds = [...ITEMS, ...HOUSE_ITEMS].reduce((n, i) => n + (i.price?.diamonds ?? 0), 0);
console.log(`achievements: ${ACHIEVEMENTS.length}, ${ACHIEVEMENT_DIAMONDS} 💎 in all; diamond items cost ${itemDiamonds} 💎`);
assert.ok(ACHIEVEMENT_DIAMONDS > itemDiamonds, 'every diamond item is reachable');
assert.ok(ACHIEVEMENT_DIAMONDS < itemDiamonds * 3, 'but diamonds stay scarce');

// Print the tables for the README
const typical = { flap: [10, 20, 30], pop: [1000, 2000, 3000], catch: [25, 50, 75], simon: [5, 10, 15], hop: [2000, 4000, 6000], whack: [20, 40, 60], run: [600, 1200, 1800], stack: [12, 24, 36], slice: [30, 60, 90], redlight: [500, 1000, 1500], spam: [25, 50, 75], fizz: [5, 10, 15], pong: [20, 40, 60], tightrope: [400, 800, 1200] };
for (const g of GAMES.filter((g) => g.payout && !g.payout.coins))
  console.log(g.id.padEnd(6), typical[g.id].map((s) => `${s} ${g.unit} -> ${adventurePayout(g, s)}`).join(' | '));
const coinPrices = ITEMS.filter((i) => i.price?.coins).map((i) => i.price.coins);
console.log('outfit coin prices', Math.min(...coinPrices), '-', Math.max(...coinPrices));

// Playing needs a fed tummy; a paid wake-up wakes him and gives energy back
{
  const T0 = Date.UTC(2026, 9, 28, 12);
  const base = normalize({ ...START, coins: 100, needs: { hunger: 10, energy: 90, asleep: false, at: T0 } });
  assert.equal(applyEvent(base, { type: 'play', kind: 'adventure', at: T0 }), null, 'too hungry to play');
  const fed = { ...base, needs: { ...base.needs, hunger: 50 } };
  assert.ok(applyEvent(fed, { type: 'play', kind: 'adventure', at: T0 }));
  const asleep = { ...fed, needs: { ...fed.needs, energy: 30, asleep: true } };
  assert.equal(applyEvent(fed, { type: 'wake', item: 'wake-alarm', at: T0 }), null, 'awake: nothing to wake');
  const up = applyEvent(asleep, { type: 'wake', item: 'wake-alarm', at: T0 });
  assert.equal(up.needs.asleep, false);
  assert.equal(up.needs.energy, 42);
  assert.equal(up.coins, 60);
  assert.equal(applyEvent(asleep, { type: 'wake', item: 'nope', at: T0 }), null, 'unknown wake option');
  assert.equal(applyEvent({ ...asleep, coins: 0 }, { type: 'wake', item: 'wake-alarm', at: T0 }), null, 'cannot afford');
  assert.equal(applyEvent(asleep, { type: 'wake', at: T0 }).needs.energy, 30, 'free wake gives nothing');
}

console.log('all economy checks passed');
