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

const { tierPayout, adventurePayout, runDiamonds, applyEvent, replay, START } = await import('../src/economy/rules.js');
const { GAMES, ITEMS, RUN_LIMITS } = await import('../src/economy/catalog.js');
const { legacyReplay } = await import('../src/economy/legacy.js');

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

// Diamonds: first 100+ run, then a big personal best
assert.equal(runDiamonds(99, 0), 0);
assert.equal(runDiamonds(100, 0), 1);
assert.equal(runDiamonds(150, 120), 0);
assert.equal(runDiamonds(200, 120), 1);
assert.equal(runDiamonds(250, 0), 1);

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
assert.deepEqual([s.coins, s.diamonds], [1700, 10]);
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

// Print the tables for the README
const typical = { flap: [10, 20, 30], pop: [1000, 2000, 3000], catch: [25, 50, 75], simon: [5, 10, 15], hop: [2000, 4000, 6000], whack: [20, 40, 60], run: [600, 1200, 1800], stack: [12, 24, 36], slice: [30, 60, 90] };
for (const g of GAMES.filter((g) => g.payout && !g.payout.coins))
  console.log(g.id.padEnd(6), typical[g.id].map((s) => `${s} ${g.unit} -> ${adventurePayout(g, s)}`).join(' | '));
const coinPrices = ITEMS.filter((i) => i.price?.coins).map((i) => i.price.coins);
console.log('outfit coin prices', Math.min(...coinPrices), '-', Math.max(...coinPrices));
console.log('all economy checks passed');
