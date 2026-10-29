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
const { ACHIEVEMENTS, ACHIEVEMENT_DIAMONDS, ACHIEVEMENT_DIAMONDS_EARLY, statsOf, readyCount, newlyReady, MEDALS, medalsOf } = await import('../src/economy/achievements.js');
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
let s = { ...START, coins: 0, lv: { n: 100, at: {}, best: {} } }; // The Reason opens after level 100
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
assert.ok(ACHIEVEMENTS.length >= 35 && ACHIEVEMENTS.length <= 50, 'about twice as many as before');
assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
assert.equal(MEDALS.length, 5);
for (const a of ACHIEVEMENTS) {
  assert.equal(medalsOf(a).length, a.levels.length, `${a.id}: a medal per level`);
  assert.ok([1, 3, 5].includes(a.levels.length), `${a.id} has 1, 3 or 5 levels`);
  if (a.levels.length === 5 && !a.keep) assert.ok(a.levels[4].at >= a.levels[2].at * 3, `${a.id}: Diamond is far beyond Gold`); // (capped ladders, keep, grow gently)
  a.levels.forEach((l, i) => {
    assert.ok((l.diamonds > 0 || l.coins > 0) && typeof a.goal(l.at) === 'string' && a.goal(l.at), `${a.id} level ${i + 1}`);
    if (i) assert.ok(l.at > a.levels[i - 1].at && l.diamonds >= a.levels[i - 1].diamonds, `${a.id} rises`);
  });
}
// the two legendary ones pay a single coin
for (const id of ['forever', 'everything', 'cheater']) assert.deepEqual(ACHIEVEMENTS.find((a) => a.id === id).levels.map((l) => [l.diamonds, l.coins]), [[0, 1]]);
// claiming: in order, only when the stat is there, once
let ac = normalize(oldProfile);
assert.equal(readyCount(ac), 12); // flap B+S, button-run B, reason B+S, cursor B+S, bookworm B+S, outfits B, rooms B, Please Didn't
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

// stocking the pantry: pays, adds one, doesn't eat; feeding then uses the stock
let sk = normalize({ ...START, coins: 100, diamonds: 0 });
const hungry = (w) => ({ ...w, needs: { ...w.needs, hunger: 10, at: T } });
sk = applyEvent(sk, { type: 'stock', item: 'food-cookie' });
assert.deepEqual([sk.coins, sk.pantry['food-cookie'], sk.stats.eaten], [85, 1, 0]);
assert.equal(sk.needs.hunger, normalize({ ...START }).needs.hunger); // not eaten
assert.equal(applyEvent(sk, { type: 'stock', item: 'food-nope' }), null); // unknown item
assert.equal(applyEvent(sk, { type: 'stock', item: 'food-floppy' }), null); // 1 diamond, has none
assert.equal(applyEvent(sk, { type: 'stock', item: '__proto__' }), null);
assert.equal(applyEvent({ ...sk, coins: 5 }, { type: 'stock', item: 'food-cookie' }), null); // cannot afford
let sf = applyEvent(hungry(sk), { type: 'feed', item: 'food-cookie', at: T + 1 });
assert.deepEqual([sf.coins, sf.pantry['food-cookie'], sf.stats.eaten], [85, 0, 1]); // eaten from the stock: free
const full = normalize({ ...START, coins: 1_000_000, pantry: { 'food-cookie': 98 } });
const c99 = applyEvent(full, { type: 'stock', item: 'food-cookie' });
assert.equal(c99.pantry['food-cookie'], 99);
assert.equal(applyEvent(c99, { type: 'stock', item: 'food-cookie' }), null); // capped at 99
assert.equal(c99.coins, 1_000_000 - 15);

/* ---------- the diamond balance ---------- */
// (the moving diamond furniture is a year-long goal of its own: see the levels simulation)
const itemDiamonds = [...ITEMS, ...HOUSE_ITEMS].filter((i) => !i.moving).reduce((n, i) => n + (i.price?.diamonds ?? 0), 0);
const movingDiamonds = HOUSE_ITEMS.filter((i) => i.moving).reduce((n, i) => n + (i.price?.diamonds ?? 0), 0);
console.log(`achievements: ${ACHIEVEMENTS.length}, ${ACHIEVEMENT_DIAMONDS} 💎 in all (${ACHIEVEMENT_DIAMONDS_EARLY} from Bronze to Gold); diamond items cost ${itemDiamonds} 💎, the moving ones ${movingDiamonds}`);
assert.ok(ACHIEVEMENT_DIAMONDS_EARLY > itemDiamonds, 'every diamond item is reachable');
assert.ok(ACHIEVEMENT_DIAMONDS_EARLY < itemDiamonds * 3, 'but diamonds stay scarce');
assert.ok(ACHIEVEMENT_DIAMONDS < itemDiamonds + movingDiamonds, 'even every medal there is buys less than everything');
assert.ok(itemDiamonds >= 57 && itemDiamonds <= 168, 'diamond items add up to ' + itemDiamonds);

// Print the tables for the README
const typical = { flap: [10, 20, 30], pop: [1000, 2000, 3000], catch: [25, 50, 75], simon: [5, 10, 15], hop: [2000, 4000, 6000], whack: [20, 40, 60], run: [600, 1200, 1800], stack: [12, 24, 36], slice: [30, 60, 90], redlight: [500, 1000, 1500], spam: [25, 50, 75], fizz: [5, 10, 15], pong: [20, 40, 60], tightrope: [400, 800, 1200] };
for (const g of GAMES.filter((g) => g.payout && !g.payout.coins))
  console.log(g.id.padEnd(6), typical[g.id].map((s) => `${s} ${g.unit} -> ${adventurePayout(g, s)}`).join(' | '));
const coinPrices = ITEMS.filter((i) => i.price?.coins).map((i) => i.price.coins);
console.log('outfit coin prices', Math.min(...coinPrices), '-', Math.max(...coinPrices));

// Playing needs a fed tummy; a paid energy boost wakes him (or keeps him
// going while awake) and gives energy back
{
  const T0 = Date.UTC(2026, 9, 28, 12);
  const base = normalize({ ...START, coins: 100, needs: { hunger: 10, energy: 90, asleep: false, at: T0 } });
  assert.equal(applyEvent(base, { type: 'play', kind: 'adventure', at: T0 }), null, 'too hungry to play');
  const fed = { ...base, needs: { ...base.needs, hunger: 50 } };
  assert.ok(applyEvent(fed, { type: 'play', kind: 'adventure', at: T0 }));
  const asleep = { ...fed, needs: { ...fed.needs, energy: 30, asleep: true } };
  const boosted = applyEvent({ ...fed, needs: { ...fed.needs, energy: 30 } }, { type: 'wake', item: 'wake-alarm', at: T0 });
  assert.equal(boosted.needs.asleep, false, 'awake: a boost works without a nap');
  assert.equal(boosted.needs.energy, 42);
  assert.equal(boosted.coins, 60);
  const up = applyEvent(asleep, { type: 'wake', item: 'wake-alarm', at: T0 });
  assert.equal(up.needs.asleep, false);
  assert.equal(up.needs.energy, 42);
  assert.equal(up.coins, 60);
  assert.equal(applyEvent(asleep, { type: 'wake', item: 'nope', at: T0 }), null, 'unknown wake option');
  assert.equal(applyEvent({ ...asleep, coins: 0 }, { type: 'wake', item: 'wake-alarm', at: T0 }), null, 'cannot afford');
  assert.equal(applyEvent(asleep, { type: 'wake', at: T0 }).needs.energy, 30, 'free wake gives nothing');

  // potions fill needs right up, and wake him
  const worn = { ...fed, coins: 1000, diamonds: 5, needs: { ...fed.needs, hunger: 20, energy: 10, dirt: 60 } };
  const p1 = applyEvent(worn, { type: 'potion', item: 'potion-energy', at: T0 });
  assert.deepEqual([p1.needs.hunger, p1.needs.energy, p1.needs.dirt, p1.coins], [20, 100, 60, 750]);
  assert.equal(applyEvent(worn, { type: 'potion', item: 'potion-clean', at: T0 }).needs.dirt, 0);
  assert.equal(applyEvent(worn, { type: 'potion', item: 'potion-hunger', at: T0 }).needs.hunger, 100);
  const p4 = applyEvent({ ...worn, needs: { ...worn.needs, asleep: true } }, { type: 'potion', item: 'potion-all', at: T0 });
  assert.deepEqual([p4.needs.hunger, p4.needs.energy, p4.needs.dirt, p4.needs.asleep, p4.diamonds], [100, 100, 0, false, 3]);
  assert.equal(applyEvent({ ...worn, coins: 100 }, { type: 'potion', item: 'potion-energy', at: T0 }), null, 'cannot afford a potion');
  assert.equal(applyEvent(worn, { type: 'potion', item: 'nope', at: T0 }), null, 'unknown potion');
  // and the nasty ones drain them: never refilling what is already lower
  const fresh = { ...worn, coins: 5000, needs: { ...worn.needs, hunger: 90, energy: 90, dirt: 0 } };
  const starved = applyEvent(fresh, { type: 'potion', item: 'potion-starve', at: T0 });
  assert.deepEqual([starved.needs.hunger, starved.needs.energy, starved.needs.dirt, starved.coins], [10, 90, 0, 4100]);
  assert.equal(applyEvent(fresh, { type: 'potion', item: 'potion-yawn', at: T0 }).needs.energy, 10);
  assert.equal(applyEvent(fresh, { type: 'potion', item: 'potion-mud', at: T0 }).needs.dirt, 90);
  assert.equal(applyEvent({ ...fresh, needs: { ...fresh.needs, hunger: 4 } }, { type: 'potion', item: 'potion-starve', at: T0 }).needs.hunger, 4);

  // broke: the cheapest food is free, nothing else is
  const broke = { ...worn, coins: 5, diamonds: 0, pantry: {} };
  const ate = applyEvent(broke, { type: 'feed', item: 'food-cookie', at: T0 });
  assert.equal(ate.coins, 5, 'free cookie when broke');
  assert.equal(ate.needs.hunger, 30);
  assert.equal(applyEvent(broke, { type: 'feed', item: 'food-usb', at: T0 }), null, 'only the cheapest food is free');
  assert.equal(applyEvent({ ...broke, coins: 20 }, { type: 'feed', item: 'food-cookie', at: T0 }).coins, 5, 'not broke: pays');
  assert.equal(applyEvent({ ...broke, pantry: { 'food-usb': 1 } }, { type: 'feed', item: 'food-cookie', at: T0 }), null, 'has food in the pantry: eat that');

  // games kick up dirt; a filthy button refuses to sleep until he is washed
  let gw = applyEvent(fed, { type: 'play', kind: 'adventure', at: T0 });
  assert.equal(gw.needs.dirt, 1.5);
  const filthy = { ...fed, needs: { ...fed.needs, energy: 40, dirt: 80 } };
  assert.equal(applyEvent(filthy, { type: 'sleep', at: T0 }), null, 'too dirty to sleep');
  const clean = applyEvent(filthy, { type: 'wash', at: T0 });
  assert.equal(clean.needs.dirt, 0);
  assert.ok(applyEvent(clean, { type: 'sleep', at: T0 }), 'clean: can sleep');
  assert.equal(applyEvent(asleep, { type: 'wash', at: T0 }), null, 'cannot wash a sleeper');
  // time alone makes him dirty, slowly
  assert.equal(applyEvent({ ...fed, needs: { ...fed.needs, dirt: 0 } }, { type: 'wash', at: T0 + 3_600_000 }).needs.dirt, 0);
}

/* ---------- the rooms: each has its own wall, floor and furniture ---------- */
{
  const { ROOMS, ROOM_IDS, DEFAULT_ROOMS, DEFAULT_HOUSE, HOUSE_ITEM, roomOf, MAX_PIECES, SPOT_AT, bandOf, fitsRoom, freeSpotFor } = await import('../src/economy/house.js');
  const { readFileSync } = await import('node:fs');
  const artSrc = ['art.jsx', 'art-more.jsx', 'art-moving.jsx'].map((f) => readFileSync(new URL(`../src/house/${f}`, import.meta.url), 'utf8')).join('\n');

  // the catalog is consistent: every piece fits a spot of every room it names, and has a picture
  for (const i of HOUSE_ITEMS) {
    assert.ok(i.rooms.length && i.rooms.every((r) => ROOMS[r]), `${i.id} rooms`);
    if (i.kind === 'furniture') {
      assert.ok(new RegExp(`(^|\\s)'?${i.id}'?: \\{`, 'm').test(artSrc), `${i.id} has art`);
      for (const r of i.rooms) assert.ok(i.spots.some((s) => ROOMS[r].spots.includes(s)), `${i.id} fits somewhere in ${r}`);
    }
  }
  // the starting pieces are free (always owned), allowed in their room, and fit their spots
  for (const r of ['kitchen', 'bedroom']) {
    const d = DEFAULT_ROOMS[r];
    for (const id of [d.wall, d.floor, ...Object.values(d.place)]) assert.ok(HOUSE_ITEM[id] && !HOUSE_ITEM[id].price && HOUSE_ITEM[id].rooms.includes(r), `${r} default ${id}`);
    for (const [spot, id] of Object.entries(d.place)) assert.ok(HOUSE_ITEM[id].spots.includes(spot) && ROOMS[r].spots.includes(spot));
  }
  assert.ok(ROOMS.bedroom.required.every((s) => DEFAULT_ROOMS.bedroom.place[s]), 'the bedroom starts with its bed and lamp');
  assert.equal(HOUSE_ITEM['lamp-bedside'].price, undefined);
  assert.deepEqual(ROOM_IDS, ['living', 'kitchen', 'bedroom']);

  // a new player has all three rooms; the living room has no bed any more
  assert.deepEqual(START.rooms.bedroom.place, { bed: 'bed-basic', nightstand: 'lamp-bedside' });
  assert.equal(START.rooms.kitchen.wall, 'wall-kitchen-tile');
  assert.deepEqual(START.house, DEFAULT_HOUSE);

  // a wallet saved before the other rooms: nothing breaks, and its bed moves to the bedroom
  const saved = { coins: 50, diamonds: 0, owned: ['bed-cozy', 'plant-cactus', 'wall-mint'], equipped: START.equipped, house: { wall: 'wall-mint', floor: 'floor-oak', place: { bed: 'bed-cozy', 'floor-left': 'plant-cactus' } } };
  const mig = normalize(saved);
  assert.deepEqual(mig.house, { wall: 'wall-mint', floor: 'floor-oak', place: {}, items: [{ item: 'plant-cactus', ...SPOT_AT['floor-left'] }] }, 'its spots turn into free-placed pieces');
  assert.deepEqual(mig.rooms.bedroom.place, { bed: 'bed-cozy', nightstand: 'lamp-bedside' });
  assert.deepEqual(mig.rooms.kitchen, DEFAULT_ROOMS.kitchen);
  assert.equal(normalize(mig), mig, 'normalizing twice changes nothing');
  assert.ok(normalize({ ...START, rooms: undefined, house: undefined }).rooms.bedroom.place.bed);
  assert.equal(normalize({ ...mig, rooms: { kitchen: { wall: 'wall-kitchen-sage' } } }).rooms.kitchen.floor, 'floor-kitchen-checker', 'a partial room is filled in');

  const rich = normalize({ ...START, coins: 99999, diamonds: 50 });
  const buyAll = (w, ...ids) => ids.reduce((x, id) => applyEvent(x, { type: 'buy', item: id }), w);
  const own = buyAll(rich, 'toaster', 'nightstand-modern', 'bed-cozy', 'wall-kitchen-sage', 'wall-bedroom-plum', 'plant-cactus', 'wall-mint', 'rug-round', 'floor-kitchen-gold');

  // furniture goes where its room has a spot for it
  const at = (w, room, item) => roomOf(w, room).items.find((p) => p.item === item);
  let k = applyEvent(own, { type: 'decor', room: 'kitchen', spot: 'counter', item: 'toaster' });
  assert.deepEqual(at(k, 'kitchen', 'toaster'), { item: 'toaster', ...SPOT_AT.counter }, 'an old spot event lands where the spot was');
  assert.deepEqual(k.house, own.house, 'the living room is untouched');
  assert.equal(applyEvent(own, { type: 'decor', spot: 'counter', item: 'toaster' }), null, 'no counter in the living room');
  assert.equal(applyEvent(own, { type: 'decor', room: 'bedroom', spot: 'counter', item: 'toaster' }), null, 'no counter in the bedroom');
  assert.equal(applyEvent(own, { type: 'decor', room: 'kitchen', spot: 'floor-left', item: 'toaster' }), null, 'a toaster does not go on the floor');
  assert.equal(applyEvent(rich, { type: 'decor', room: 'kitchen', spot: 'counter', item: 'toaster' }), null, 'not owned');
  assert.equal(applyEvent(own, { type: 'decor', room: 'kitchen', spot: 'floor-left', item: 'disco-ball' }), null);
  assert.equal(applyEvent(own, { type: 'decor', room: 'kitchen', spot: 'ceiling', item: 'disco-ball' }), null);
  assert.equal(applyEvent(own, { type: 'decor', room: 'attic', spot: 'rug', item: 'rug-round' }), null, 'no such room');
  assert.equal(applyEvent(own, { type: 'decor', room: 'constructor', spot: 'rug', item: 'rug-round' }), null);
  assert.equal(applyEvent(own, { type: 'decor', room: 'kitchen', spot: 'nope', item: 'rug-round' }), null, 'no such spot');
  // owned pieces are shared: one rug, any room that fits it
  let rugs = applyEvent(own, { type: 'decor', spot: 'rug', item: 'rug-round' });
  rugs = applyEvent(rugs, { type: 'decor', room: 'kitchen', spot: 'rug', item: 'rug-round' });
  rugs = applyEvent(rugs, { type: 'decor', room: 'bedroom', spot: 'rug', item: 'rug-round' });
  assert.ok(['living', 'kitchen', 'bedroom'].every((r) => at(rugs, r, 'rug-round')));
  // only one of a piece in a room
  const two = applyEvent(applyEvent(own, { type: 'decor', spot: 'floor-left', item: 'plant-cactus' }), { type: 'decor', spot: 'floor-right', item: 'plant-cactus' });
  assert.deepEqual(two.house.items, [{ item: 'plant-cactus', ...SPOT_AT['floor-right'] }]);

  // wallpaper and floors: allowed in the rooms they name
  assert.equal(applyEvent(own, { type: 'decor', room: 'kitchen', spot: 'wall', item: 'wall-kitchen-sage' }).rooms.kitchen.wall, 'wall-kitchen-sage');
  assert.equal(applyEvent(own, { type: 'decor', room: 'bedroom', spot: 'wall', item: 'wall-kitchen-sage' }), null, 'a kitchen wallpaper is not for the bedroom');
  assert.equal(applyEvent(own, { type: 'decor', spot: 'wall', item: 'wall-bedroom-plum' }), null);
  assert.equal(applyEvent(own, { type: 'decor', room: 'bedroom', spot: 'wall', item: 'wall-bedroom-plum' }).rooms.bedroom.wall, 'wall-bedroom-plum');
  assert.equal(applyEvent(own, { type: 'decor', room: 'bedroom', spot: 'wall', item: 'wall-mint' }).rooms.bedroom.wall, 'wall-mint', 'general wallpapers fit every room');
  assert.equal(applyEvent(own, { type: 'decor', room: 'kitchen', spot: 'floor', item: 'floor-kitchen-gold' }).rooms.kitchen.floor, 'floor-kitchen-gold');
  assert.equal(applyEvent(own, { type: 'decor', room: 'kitchen', spot: 'floor', item: 'wall-mint' }), null, 'a wall is not a floor');
  assert.equal(applyEvent(rich, { type: 'decor', room: 'kitchen', spot: 'wall', item: 'wall-kitchen-sage' }), null, 'not owned');

  // the bed and its bedside lamp are permanent: swapped, never taken down
  assert.equal(applyEvent(own, { type: 'decor', room: 'bedroom', spot: 'bed', item: null }), null, 'the bed stays');
  assert.equal(applyEvent(own, { type: 'decor', room: 'bedroom', spot: 'nightstand', item: null }), null, 'the lamp stays');
  assert.equal(applyEvent(own, { type: 'decor', room: 'bedroom', spot: 'bed', item: 'bed-cozy' }).rooms.bedroom.place.bed, 'bed-cozy');
  assert.equal(applyEvent(own, { type: 'decor', room: 'bedroom', spot: 'nightstand', item: 'nightstand-modern' }).rooms.bedroom.place.nightstand, 'nightstand-modern');
  assert.equal(applyEvent(own, { type: 'decor', room: 'bedroom', spot: 'bed', item: 'bed-loft' }), null, 'not owned');
  assert.equal(applyEvent(own, { type: 'decor', room: 'bedroom', spot: 'bed', item: 'toaster' }), null);
  assert.equal(applyEvent(own, { type: 'decor', room: 'living', spot: 'bed', item: 'bed-cozy' }), null, 'beds are for the bedroom');
  // ...and an old queued event for the bed (no room) still means the bedroom
  assert.equal(applyEvent(own, { type: 'decor', spot: 'bed', item: 'bed-cozy' }).rooms.bedroom.place.bed, 'bed-cozy');
  // the normal pieces can come down
  let free = applyEvent(own, { type: 'decor', room: 'bedroom', spot: 'rug', item: 'rug-round' });
  assert.equal(at(applyEvent(free, { type: 'decor', room: 'bedroom', spot: 'rug', item: null }), 'bedroom', 'rug-round'), undefined);

  // old queued events without a room keep decorating the living room
  const oldDecor = replay(rich, [{ type: 'buy', item: 'plant-cactus' }, { type: 'decor', spot: 'floor-left', item: 'plant-cactus' }, { type: 'buy', item: 'wall-mint' }, { type: 'decor', spot: 'wall', item: 'wall-mint' }]);
  assert.deepEqual([at(oldDecor, 'living', 'plant-cactus'), oldDecor.house.wall], [{ item: 'plant-cactus', ...SPOT_AT['floor-left'] }, 'wall-mint']);
  assert.deepEqual(oldDecor.rooms, rich.rooms);

  /* ---------- free-placed furniture: place / unplace ---------- */
  // every piece but beds and nightstands has a band, and fits each room it names
  for (const i of HOUSE_ITEMS.filter((i) => i.kind === 'furniture')) {
    const fixed = i.spots.every((s) => s === 'bed' || s === 'nightstand');
    assert.equal(!bandOf(i), fixed, `${i.id} band`);
    if (!fixed) for (const r of i.rooms) assert.ok(fitsRoom(i, r), `${i.id} fits ${r}`);
  }
  assert.equal(bandOf(HOUSE_ITEM['neon-sign']), 'wall');
  assert.equal(bandOf(HOUSE_ITEM['plant-monstera']), 'floor');
  assert.equal(bandOf(HOUSE_ITEM['toaster']), 'counter');
  const p = (w, item, x, y, room) => applyEvent(w, { type: 'place', item, x, y, ...(room ? { room } : {}) });
  let f = p(own, 'plant-cactus', 37.26, 55);
  assert.deepEqual(f.house.items, [{ item: 'plant-cactus', x: 37.3, y: 55 }], 'placed, rounded');
  f = p(f, 'plant-cactus', 120, -5);
  assert.deepEqual(f.house.items, [{ item: 'plant-cactus', x: 100, y: 0 }], 'moved, clamped, still one of it');
  assert.equal(p(own, 'plant-cactus', NaN, 5), null, 'NaN');
  assert.equal(p(own, 'plant-cactus', Infinity, 5), null, 'Infinity');
  assert.equal(p(own, 'plant-cactus', '10', 5), null, 'strings');
  assert.equal(p(own, 'plant-cactus', 10), null, 'a floor piece needs y');
  assert.deepEqual(p(own, 'toaster', 40, 'junk', 'kitchen').rooms.kitchen.items, [{ item: 'toaster', x: 40, y: 0 }], 'on the counter y does not count');
  assert.equal(p(own, 'toaster', 40, 0), null, 'no counter in the living room');
  assert.equal(p(rich, 'plant-cactus', 10, 10), null, 'not owned');
  assert.equal(p(own, 'wall-mint', 10, 10), null, 'a wallpaper is not a piece');
  assert.equal(p(own, 'bed-cozy', 10, 10, 'bedroom'), null, 'the bed is not free-placed');
  assert.equal(p(own, 'plant-cactus', 10, 10, 'attic'), null, 'no such room');
  assert.equal(p(own, 'plant-cactus', 10, 10, '__proto__'), null);
  assert.equal(p(own, 'nope', 10, 10), null);
  assert.equal(p(own, 'toaster', 10, 10, 'bedroom'), null, 'a toaster is for the kitchen');
  // unplace
  assert.deepEqual(applyEvent(f, { type: 'unplace', item: 'plant-cactus' }).house.items, []);
  assert.equal(applyEvent(own, { type: 'unplace', item: 'plant-cactus' }), null, 'nothing to take out');
  assert.equal(applyEvent(f, { type: 'unplace', item: 'plant-cactus', room: 'kitchen' }), null, 'other rooms are separate');
  // at most MAX_PIECES in a room
  assert.equal(MAX_PIECES, 10);
  const lb = HOUSE_ITEMS.filter((i) => i.kind === 'furniture' && i.level == null && fitsRoom(i, 'living')).map((i) => i.id); // (level-locked pieces can't be bought yet)
  assert.ok(lb.length > MAX_PIECES + 1);
  let full = buyAll({ ...rich, coins: 1e9, diamonds: 1e6 }, ...lb);
  for (const id of lb.slice(0, MAX_PIECES)) full = p(full, id, 50, 50);
  assert.equal(full.house.items.length, MAX_PIECES);
  assert.equal(p(full, lb[MAX_PIECES], 50, 50), null, 'the room is full');
  assert.ok(p(full, lb[0], 10, 10), 'moving a piece in a full room is fine');
  const extra = lb.slice(MAX_PIECES).find((id) => HOUSE_ITEM[id].spots.includes('ceiling') || HOUSE_ITEM[id].spots.includes('rug'));
  const extraSpot = HOUSE_ITEM[extra].spots.includes('rug') ? 'rug' : 'ceiling';
  assert.equal(applyEvent(full, { type: 'decor', spot: extraSpot, item: extra }), null, 'an old spot event cannot overfill it');
  assert.ok(p(applyEvent(full, { type: 'unplace', item: lb[0] }), lb[MAX_PIECES], 50, 50), 'room again after taking one out');
  // a free spot for a new piece keeps clear of the others
  const spotA = freeSpotFor(HOUSE_ITEM['plant-cactus'], []);
  assert.deepEqual(spotA, SPOT_AT['floor-left']);
  const spotB = freeSpotFor(HOUSE_ITEM['fish-bowl'], [{ item: 'plant-cactus', ...spotA }]);
  assert.ok(Math.hypot(spotB.x - spotA.x, spotB.y - spotA.y) >= 18);
  // migration: a saved room with spots and junk items is cleaned up, and normalizing again changes nothing
  const old = normalize({
    ...START,
    owned: ['toaster', 'rug-round'],
    house: { wall: 'wall-cozy', floor: 'floor-oak', place: { rug: 'rug-round', ceiling: 'nope' } },
    rooms: {
      kitchen: { wall: 'wall-kitchen-tile', floor: 'floor-kitchen-checker', place: { counter: 'toaster' }, items: [{ item: 'toaster', x: 5, y: 5 }, { item: 'bed-cozy', x: 1, y: 1 }, { item: 'rug-round', x: 'a', y: 1 }, null] },
      bedroom: { place: { bed: 'bed-cozy', rug: 'rug-round' } },
    },
  });
  assert.deepEqual(old.house.items, [{ item: 'rug-round', ...SPOT_AT.rug }]);
  assert.deepEqual(old.rooms.kitchen.items, [{ item: 'toaster', x: 5, y: 0 }], 'saved positions win over the old spot');
  assert.deepEqual(old.rooms.bedroom.place, { bed: 'bed-cozy', nightstand: 'lamp-bedside' });
  assert.deepEqual(old.rooms.bedroom.items, [{ item: 'rug-round', ...SPOT_AT.rug }]);
  assert.equal(normalize(old), old);
  // old queued spot events still replay on a migrated wallet, and the old take-down works
  const replayed = replay(rich, [{ type: 'buy', item: 'rug-round' }, { type: 'decor', room: 'kitchen', spot: 'rug', item: 'rug-round' }, { type: 'place', room: 'kitchen', item: 'rug-round', x: 20, y: 30 }]);
  assert.deepEqual(replayed.rooms.kitchen.items, [{ item: 'rug-round', x: 20, y: 30 }]);
  const down = replay(rich, [{ type: 'buy', item: 'rug-round' }, { type: 'decor', spot: 'rug', item: 'rug-round' }, { type: 'decor', spot: 'rug', item: null }]);
  assert.deepEqual(down.house.items, []);
}

/* ---------- the coin chest: 5 taps, rarities, a little under its price ---------- */
{
  const { boughtChest, BUY_CHEST, RARITIES, LEGENDARY_FURNITURE } = await import('../src/economy/chest.js');
  const { FOOD, HOUSE_ITEM } = await import('../src/economy/house.js');
  const { nextBoughtChest } = await import('../src/economy/rules.js');
  const price = BUY_CHEST.price.coins;
  // what a diamond is worth in coins, for the expected value: the diamond
  // house items cost 6 to 14 💎 next to coin ones of 900 to 2500 🪙
  const DIAMOND = 150;
  const worth = ({ coins, diamonds, food, item }) =>
    coins + diamonds * DIAMOND + (food ? (FOOD[food].price.coins ?? FOOD[food].price.diamonds * DIAMOND) : 0) + (item ? HOUSE_ITEM[item].price.coins : 0);

  assert.ok(LEGENDARY_FURNITURE.length >= 3, 'legendary chests have furniture to give');
  for (const i of LEGENDARY_FURNITURE) assert.ok(i.kind === 'furniture' && i.price.coins >= 2000 && i.level == null && !i.retired, i.id);
  assert.deepEqual(boughtChest('abc', 3), boughtChest('abc', 3), 'the same seed and count: the same chest');

  const N = 200_000;
  const seen = Object.fromEntries(RARITIES.map((r) => [r, 0]));
  let total = 0, diamonds = 0;
  for (let k = 0; k < N; k++) {
    const c = boughtChest('seed-' + (k % 997), Math.floor(k / 997));
    assert.equal(c.path.length, BUY_CHEST.taps);
    assert.equal(c.path.at(-1), c.rarity);
    // each tap goes up one rarity at most, never down
    c.path.forEach((r, i) => { const d = RARITIES.indexOf(r) - (i ? RARITIES.indexOf(c.path[i - 1]) : 0); assert.ok(d === 0 || d === 1); });
    if (c.rarity === 'legendary') assert.ok(LEGENDARY_FURNITURE.some((i) => i.id === c.loot.item), 'a legendary chest holds furniture');
    seen[c.rarity]++;
    total += worth(c.loot);
    diamonds += c.loot.diamonds;
  }
  const pct = Object.fromEntries(RARITIES.map((r) => [r, (100 * seen[r]) / N]));
  const ev = total / N;
  console.log(`coin chest: ${price} 🪙; ${RARITIES.map((r) => `${r} ${pct[r].toFixed(2)}%`).join(', ')}; EV ${ev.toFixed(0)} 🪙 (${((100 * ev) / price).toFixed(1)}%), ${(diamonds / N).toFixed(3)} 💎 a chest`);
  assert.ok(Math.abs(pct.common - 70) < 1.5 && Math.abs(pct.rare - 22) < 1.5 && Math.abs(pct.epic - 7) < 0.8 && Math.abs(pct.legendary - 1) < 0.3, JSON.stringify(pct));
  assert.ok(ev < price && ev > price * 0.85, `EV ${ev} is a little under the price`);
  assert.ok(diamonds / N < 0.3, 'coins do not turn into many diamonds');

  // a legendary chest when every piece is owned: the jackpot instead
  let legend = null;
  for (let n = 0; !legend; n++) if (boughtChest('abc', n).rarity === 'legendary') legend = n;
  const all = boughtChest('abc', legend, LEGENDARY_FURNITURE.map((i) => i.id));
  assert.deepEqual([all.loot.item, all.loot.coins, all.loot.diamonds], [null, BUY_CHEST.jackpot.coins, BUY_CHEST.jackpot.diamonds]);

  // through applyEvent: pays the price, adds the loot, counts the chest
  let bw = normalize({ ...START, coins: 2000, seed: 'abc' });
  const want = nextBoughtChest(bw);
  bw = applyEvent(bw, { type: 'buychest', at: T, coins: 99999, rarity: 'legendary' }); // nothing in the event counts
  assert.equal(bw.coins, 2000 - price + want.loot.coins);
  assert.equal(bw.diamonds, want.loot.diamonds);
  assert.equal(bw.stats.boughtChests, 1);
  if (want.loot.food) assert.equal(bw.pantry[want.loot.food], 1);
  assert.notDeepEqual(nextBoughtChest(bw), want, 'the next chest is a new one');
  assert.equal(applyEvent({ ...bw, coins: price - 1 }, { type: 'buychest', at: T }), null, 'cannot afford');
  // the legendary one adds its furniture to what the wallet owns
  const lw = applyEvent(normalize({ ...START, coins: 600, seed: 'abc', stats: { ...START.stats, boughtChests: legend } }), { type: 'buychest', at: T });
  assert.ok(lw.owned.includes(boughtChest('abc', legend).loot.item));
  // replayed in a queue: the same as one by one
  const q = replay(normalize({ ...START, coins: 5000, seed: 'xyz' }), Array.from({ length: 12 }, () => ({ type: 'buychest', at: T })));
  assert.ok(q.stats.boughtChests >= 10);
}


/* ---------- levels: 200 of them, three missions each (levels.js) ---------- */
{
  const L = await import('../src/economy/levels.js');
  const { ITEM } = await import('../src/economy/catalog.js');
  const { HOUSE_ITEM } = await import('../src/economy/house.js');
  const { MAX_LEVEL, LEVELS, BUY_TRACK, rewardOf, levelState, levelsOf, unlocksOf, storyOpen, STORY_UNLOCKS } = L;
  const anyItem = (id) => ITEM[id] ?? HOUSE_ITEM[id];
  const lvAt = (w, n) => ({ ...normalize(w), lv: { n, at: {}, best: {} } });

  assert.equal(LEVELS.length, MAX_LEVEL);
  // every buy mission is a coin item that exists, is for sale and can be bought at its level
  for (const { level, item } of BUY_TRACK) {
    const i = anyItem(item);
    assert.ok(i && i.price?.coins && !i.price.diamonds && !i.retired, `level ${level}: ${item}`);
    assert.ok(i.level == null || i.level === level, `${item} is on sale at level ${level}`);
    assert.ok(applyEvent(lvAt({ ...START, coins: 1e6 }, level - 1), { type: 'buy', item }), `${item} can be bought at level ${level}`);
  }
  // every level-locked coin item is the buy mission of its own level
  for (const i of [...ITEMS, ...HOUSE_ITEMS].filter((i) => i.level != null && i.price?.coins)) assert.equal(LEVELS[i.level - 1].buy.item, i.id);
  assert.equal(new Set(BUY_TRACK.map((t) => t.item)).size, BUY_TRACK.length, 'no item is asked for twice');
  // prices rise: the regular items in price order, then Cursor's Collection at the end
  const regular = BUY_TRACK.filter((t) => anyItem(t.item).level == null).map((t) => anyItem(t.item).price.coins);
  regular.forEach((p, k) => k && assert.ok(p >= regular[k - 1], 'prices rise level by level'));
  assert.ok(anyItem(LEVELS[0].buy.item).price.coins <= 150, 'level 1 asks for something cheap');
  assert.deepEqual(BUY_TRACK.slice(-6).map((t) => t.item), ['cursor-rug', 'cursor-pendant', 'cursor-hourglass', 'cursor-neon', 'cursor-statue', 'wall-cursor']);
  // every 4th level stocks the fridge instead (unless a special piece sits there)
  assert.ok(LEVELS[3].buy.stock > 0 && LEVELS[7].buy.stock > 0);
  // the first levels' reward never covers the next level's item
  for (const n of [1, 2, 3]) {
    const next = LEVELS[n].buy;
    const cost = next.item ? anyItem(next.item).price.coins : next.stock * 15; // the cheapest food
    assert.ok(rewardOf(n).coins < cost && rewardOf(n).coins >= Math.floor(cost / 2 / 10) * 10 - 10, `level ${n} pays ${rewardOf(n).coins}, under ${cost}`);
  }
  // diamonds every 5 levels, more later on
  for (let n = 1; n <= MAX_LEVEL; n++) assert.equal(rewardOf(n).diamonds > 0, n % 5 === 0);
  assert.ok(rewardOf(200).diamonds > rewardOf(5).diamonds);
  // play missions get harder, care missions need more
  for (const g of new Set(LEVELS.map((d) => d.play.game))) {
    const t = LEVELS.filter((d) => d.play.game === g).map((d) => d.play.target);
    assert.ok(t.at(-1) > t[0] * 4, `${g}: ${t[0]} -> ${t.at(-1)}`);
  }
  assert.ok(LEVELS[198].care.count > LEVELS[0].care.count);
  // unlocks: the stories, the friends, Cursor last
  assert.deepEqual(unlocksOf(1).map((u) => u.id), ['please-dont']);
  assert.ok(unlocksOf(50).some((u) => u.id === 'how-i-met-your-cursor') && unlocksOf(100).some((u) => u.id === 'the-reason'));
  assert.deepEqual(unlocksOf(200).map((u) => u.id), ['char-cursor']);
  assert.ok(unlocksOf(20).some((u) => u.id === 'char-tabby') && unlocksOf(40).some((u) => u.id === 'char-bella'));

  // a brand new player clears level 1 for real: play, buy, care
  let w = normalize({ ...START, seed: 'lv' });
  let st = levelState(w);
  assert.deepEqual([st.level, st.done, st.ready], [1, 0, false]);
  assert.equal(applyEvent(w, { type: 'levelup', level: 1 }), null, 'missions not done');
  const [play, shop, care] = st.missions;
  assert.equal(care.care, 'feed');
  w = applyEvent(w, { type: 'run', game: play.game, score: play.need, extra: play.need, ms: 60_000, at: T });
  assert.equal(levelState(w).missions[0].done, true);
  w = applyEvent(w, { type: 'buy', item: shop.item });
  for (let k = 0; k < care.need; k++) w = applyEvent(w, { type: 'feed', item: 'food-cookie', at: T + 1000 + k });
  st = levelState(w);
  assert.ok(st.ready, JSON.stringify(st.missions));
  assert.equal(applyEvent(w, { type: 'levelup', level: 2 }), null, 'wrong level');
  assert.equal(applyEvent(w, { type: 'levelup', level: '1' }), null, 'not a number');
  const before = w.coins;
  w = applyEvent(w, { type: 'levelup', level: 1, coins: 99999 });
  assert.equal(w.coins, before + rewardOf(1).coins, 'pays the reward, never what the event says');
  assert.equal(w.lv.n, 1);
  assert.equal(applyEvent(w, { type: 'levelup', level: 1 }), null, 'only once');
  st = levelState(w);
  assert.deepEqual([st.level, st.done], [2, 0], 'the next level starts from scratch');
  // a low run doesn't count; the clamped score does
  const lw = applyEvent(lvAt(START, 0), { type: 'run', game: play.game, score: 9999, extra: 9999, ms: 1000, at: T });
  assert.ok(lw.lv.best[play.game] <= lw.stats.best[play.game]);
  // stocking counts for the stock missions
  const s4 = applyEvent(lvAt({ ...START, coins: 500 }, 3), { type: 'stock', item: 'food-cookie' });
  assert.equal(s4.stats.stocked, 1);
  assert.equal(levelState(s4).missions[1].have, 1);

  // an old wallet: its counters so far don't count, the next action does
  const old = { ...START, stats: { ...START.stats, eaten: 50, naps: 9 } };
  assert.equal(levelsOf(old).at.eaten, 50);
  const fed = applyEvent(old, { type: 'feed', item: 'food-cookie', at: T });
  assert.deepEqual([fed.lv.n, fed.lv.at.eaten, fed.stats.eaten, levelState(fed).missions[2].have], [0, 50, 51, 1]);
  // the server replays the same queue to the same level
  const q = [
    { type: 'run', game: play.game, score: play.need, extra: play.need, ms: 60_000, at: T },
    { type: 'buy', item: shop.item },
    ...Array.from({ length: care.need }, (_, k) => ({ type: 'feed', item: 'food-cookie', at: T + 1000 + k })),
    { type: 'levelup', level: 1 },
  ];
  assert.deepEqual(replay(START, q).lv, replay(START, q, T + 1e6).lv);
  assert.equal(replay(START, q).lv.n, 1);

  // level-locked items, stories and characters
  const rich = { ...START, coins: 1e6, diamonds: 1e4 };
  assert.equal(applyEvent(lvAt(rich, 0), { type: 'buy', item: 'cursor-rug' }), null, 'locked until level 195');
  assert.equal(applyEvent(lvAt(rich, 193), { type: 'buy', item: 'cursor-rug' }), null);
  assert.ok(applyEvent(lvAt(rich, 194), { type: 'buy', item: 'cursor-rug' }));
  assert.equal(applyEvent(lvAt(rich, 58), { type: 'buy', item: 'jukebox' }), null);
  assert.ok(applyEvent(lvAt(rich, 59), { type: 'buy', item: 'jukebox' }));
  assert.ok(applyEvent(lvAt(rich, 0), { type: 'buy', item: 'fireplace' }), 'the diamond pieces only cost diamonds');
  assert.equal(applyEvent(lvAt(rich, 0), { type: 'equip', slot: 'char', item: 'char-tabby' }), null);
  assert.equal(applyEvent(lvAt(rich, 19), { type: 'equip', slot: 'char', item: 'char-tabby' }), null);
  assert.equal(applyEvent(lvAt(rich, 20), { type: 'equip', slot: 'char', item: 'char-tabby' }).equipped.char, 'char-tabby');
  assert.equal(applyEvent(lvAt(rich, 199), { type: 'equip', slot: 'char', item: 'char-cursor' }), null);
  assert.ok(applyEvent(lvAt(rich, 200), { type: 'equip', slot: 'char', item: 'char-cursor' }));
  assert.equal(applyEvent(lvAt(rich, 0), { type: 'buy', item: 'char-tabby' }), null, 'characters are not for sale');
  assert.ok(applyEvent(lvAt(rich, 0), { type: 'equip', slot: 'char', item: 'char-bobby' }));
  assert.equal(applyEvent(lvAt(rich, 0), { type: 'claim', claim: 'please-dont' }), null, "Please Don't opens after level 1");
  assert.ok(applyEvent(lvAt(rich, 1), { type: 'claim', claim: 'please-dont' }));
  assert.equal(applyEvent(lvAt(rich, 49), { type: 'claim', claim: 'cursor:1' }), null);
  assert.ok(applyEvent(lvAt(rich, 50), { type: 'claim', claim: 'cursor:1' }));
  assert.equal(applyEvent(lvAt(rich, 99), { type: 'claim', claim: 'reason:1' }), null);
  assert.ok(applyEvent(lvAt(rich, 100), { type: 'claim', claim: 'reason:1' }));
  // nobody loses a story they had started
  const started = { ...lvAt(rich, 0), claimed: ['reason:2', 'cursor:1', 'please-dont'] };
  assert.ok(applyEvent(started, { type: 'claim', claim: 'reason:3' }) && applyEvent(started, { type: 'claim', claim: 'cursor:2' }));
  assert.ok(Object.keys(STORY_UNLOCKS).every((g) => storyOpen(started, g)));
  assert.ok(!storyOpen(lvAt(rich, 0), 'the-reason') && storyOpen(lvAt(rich, 0), 'flap'));
  // max level: nothing more to claim
  assert.equal(applyEvent(lvAt(rich, 200), { type: 'levelup', level: 201 }), null);
  assert.ok(levelState(lvAt(rich, 200)).max);
  // a legendary coin chest never hands out a level-locked piece
  const { LEGENDARY_FURNITURE } = await import('../src/economy/chest.js');
  assert.ok(LEGENDARY_FURNITURE.every((i) => i.level == null && !i.moving));

  /* the balance: walk the 200 levels at a typical rate of play */
  const decent = 55; // a decent run (one and a half tiers) pays about this
  let chestCoins = 0;
  let chestGems = 0;
  for (let d = 0; d < 365; d++) {
    const c = chestLoot('sim', 20000 + d, (d % 7) + 1);
    chestCoins += c.coins;
    chestGems += c.diamonds;
  }
  const chestPerDay = chestCoins / 365;
  const food = 60; // a few snacks a day to keep him fed for the runs
  const walk = (runs) => {
    const daily = Math.min(runs * decent, RUN_LIMITS.dailyFull) + chestPerDay - food;
    let coins = START.coins;
    let day = 0;
    let spent = 0;
    let earned = 0;
    let gems = 0;
    const at = {};
    const costAt = {};
    for (const d of LEVELS) {
      const cost = (d.buy.item ? anyItem(d.buy.item).price.coins : d.buy.stock * 25) + (d.care.id === 'feed' ? d.care.count * 20 : 0);
      spent += cost;
      if (coins < cost) {
        day += (cost - coins) / daily;
        coins = cost;
      }
      coins -= cost;
      const r = rewardOf(d.level);
      coins += r.coins;
      earned += r.coins;
      if (day <= 365) gems += r.diamonds;
      if (d.level === 50) coins += 2200; // How I Met Your Cursor opens: its chapters pay once
      if (d.level === 100) coins += 3100; // and The Reason
      at[d.level] = day;
      costAt[d.level] = `${cost}/+${r.coins}`;
    }
    return { daily, at, costAt, spent, earned, gems };
  };
  const typical = walk(18);
  const casual = walk(8);
  const heavy = walk(60);
  const days = (r) => [10, 50, 100, 200].map((n) => `L${n} ${r.at[n] < 1 ? (r.at[n] * 24).toFixed(0) + 'h' : r.at[n].toFixed(0) + 'd'}`).join(', ');
  console.log(`levels: ${BUY_TRACK.length} buy missions, ${typical.spent} 🪙 asked in all, ${typical.earned} 🪙 paid back by level-ups`);
  console.log(`levels: cost/reward of a level: ${[1, 2, 3, 10, 50, 100, 150, 199, 200].map((n) => `L${n} ${typical.costAt[n]}`).join(', ')}`);
  console.log(`levels: typical (18 runs, ${typical.daily.toFixed(0)} 🪙 a day): ${days(typical)}`);
  console.log(`levels: casual (8 runs, ${casual.daily.toFixed(0)} 🪙 a day): ${days(casual)}`);
  console.log(`levels: at the daily cap (${heavy.daily.toFixed(0)} 🪙 a day): ${days(heavy)}`);
  assert.ok(typical.at[10] <= 2, 'the first 10 levels within a day or two');
  assert.ok(typical.at[50] >= 5 && casual.at[50] <= 40, 'level 50 takes a week or a few');
  assert.ok(typical.at[200] >= 120, 'level 200 takes many months');
  assert.ok(heavy.at[200] >= 40, 'even at the daily cap it takes weeks');
  // diamonds a year: achievements (all of them, generously), levels, daily chests
  const yearGems = ACHIEVEMENT_DIAMONDS_EARLY + typical.gems + chestGems; // Platinum and Diamond take longer than a year
  const moving = HOUSE_ITEMS.filter((i) => i.moving && i.price.diamonds);
  console.log(`levels: diamonds in a year ≈ ${yearGems} (achievements' first three levels ${ACHIEVEMENT_DIAMONDS_EARLY}, levels ${typical.gems}, chests ${chestGems}); other diamond items cost ${itemDiamonds}; moving pieces ${moving.map((i) => `${i.id} ${i.price.diamonds}`).join(', ')}`);
  assert.equal(moving.length, 3);
  for (const i of moving) assert.ok(i.price.diamonds >= (yearGems - itemDiamonds) * 0.6 && i.price.diamonds <= yearGems, `${i.id} takes about a year`);
  assert.equal(HOUSE_ITEMS.filter((i) => i.moving && i.price.coins && i.level).length, 3);
}

/* ---------- buying the play mission with diamonds (skipplay) ---------- */
{
  const { levelState, skipCost } = await import('../src/economy/levels.js');
  const w = { ...normalize(START), diamonds: 5 };
  const st = levelState(applyEvent(w, { type: 'stock', item: 'food-cookie' }) ?? w);
  assert.equal(st.missions[0].kind, 'play');
  assert.equal(applyEvent(w, { type: 'skipplay', level: 2 }), null, 'only the current level');
  const skipped = applyEvent(w, { type: 'skipplay', level: 1 });
  assert.equal(skipped.diamonds, 5 - skipCost(1));
  assert.ok(levelState(skipped).missions[0].done, 'the play mission counts as done');
  assert.equal(applyEvent(skipped, { type: 'skipplay', level: 1 }), null, 'not twice');
  assert.equal(applyEvent({ ...w, diamonds: 0 }, { type: 'skipplay', level: 1 }), null, 'needs the diamonds');
  assert.deepEqual([skipCost(1), skipCost(26), skipCost(200)], [1, 2, 8]);
}

/* ---------- what the new achievements count ---------- */
{
  const T2 = Date.now();
  let w = { ...normalize(START), coins: 5000, owned: ['hat-cap'], needs: { ...START.needs, hunger: 50, energy: 50, at: T2 } };
  w = applyEvent(w, { type: 'equip', slot: 'hat', item: 'hat-cap' });
  w = applyEvent(w, { type: 'sleep', at: T2 });
  w = applyEvent(w, { type: 'wake', at: T2 + 1 });
  const s = statsOf(w);
  assert.deepEqual([s.equips, s.wakes, s.naps], [1, 1, 1], 'equips, free wakes and naps are counted');
}

/* ---------- codes (economy/codes.js) ---------- */
{
  const { levelsCleared, levelLocked } = await import('../src/economy/levels.js');
  const w = normalize(START);
  const { isCode } = await import('../src/economy/codes.js');
  assert.equal(isCode('ISUCKATCODING'), false, 'the old code is retired');
  assert.ok(applyEvent(w, { type: 'code', code: 'ISUCKATCODING' }), 'but still replays for wallets that used it');
  const got = applyEvent(w, { type: 'code', code: ' dsaisu seless ' });
  assert.ok(got, 'a code works however it is typed');
  assert.equal(got.coins, START.coins + 9_999_999);
  assert.equal(got.diamonds, START.diamonds + 9_999_999);
  assert.equal(levelsCleared(got), 200, 'and clears every level');
  assert.equal(levelLocked(got, { level: 200 }), false, 'so nothing is level-locked any more');
  assert.equal(applyEvent(got, { type: 'code', code: 'DSAISUSELESS' }), null, 'once per wallet');
  const old = applyEvent(w, { type: 'code', code: 'ISUCKATCODING' });
  assert.equal(applyEvent(old, { type: 'code', code: 'DSAISUSELESS' }), null, 'the old and new code pay once between them');
  assert.equal(applyEvent(w, { type: 'code', code: 'NOPE' }), null, 'unknown code');
  assert.equal(applyEvent(w, { type: 'code', code: 42 }), null, 'junk code');
}

/* ---------- hard quests (economy/quests.js) ---------- */
{
  const { QUESTS, questStates } = await import('../src/economy/quests.js');
  const w = normalize(START);
  assert.ok(questStates(w).every((x) => !x.done && !x.claimed), 'nobody starts with a quest done');
  assert.equal(applyEvent(w, { type: 'quest', quest: 'q-feed' }), null, 'not before it is done');
  const fed = { ...w, stats: { ...w.stats, eaten: 500 } };
  const paid = applyEvent(fed, { type: 'quest', quest: 'q-feed' });
  assert.equal(paid.diamonds, w.diamonds + 25);
  assert.equal(applyEvent(paid, { type: 'quest', quest: 'q-feed' }), null, 'once');
  assert.equal(applyEvent(w, { type: 'quest', quest: 'nope' }), null, 'unknown quest');
  const flap = { ...w, stats: { ...w.stats, best: { ...w.stats.best, flap: 60 } } };
  assert.ok(applyEvent(flap, { type: 'quest', quest: 'q-flap' }), 'a score quest');
  console.log('quests:', QUESTS.length, 'worth', QUESTS.reduce((n, q) => n + q.reward.diamonds, 0), '💎');
}

/* ---------- potions to keep (stockpotion) ---------- */
{
  const T = Date.now();
  const w = { ...normalize(START), coins: 1000, needs: { ...START.needs, hunger: 20, energy: 10, dirt: 0, at: T } };
  const kept = applyEvent(w, { type: 'stockpotion', item: 'potion-energy' });
  assert.equal(kept.coins, 750, 'paid when bought');
  assert.equal(kept.potions['potion-energy'], 1, 'kept, not drunk');
  assert.equal(kept.needs.energy, 10);
  const drunk = applyEvent(kept, { type: 'potion', item: 'potion-energy', at: T });
  assert.equal(drunk.coins, 750, 'drinking a kept one is free');
  assert.equal(drunk.potions['potion-energy'], 0);
  assert.equal(drunk.needs.energy, 100);
  assert.equal(applyEvent({ ...w, coins: 100 }, { type: 'stockpotion', item: 'potion-energy' }), null, 'cannot afford');
  assert.equal(applyEvent(w, { type: 'stockpotion', item: 'potion-clean' }), null, 'retired potions are not sold');
}

console.log('all economy checks passed');
