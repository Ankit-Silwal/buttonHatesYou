// The daily chest: once per UTC day, free goodies. Shared by the browser and
// the server. What's inside is decided by a seeded random number generator,
// from the wallet's `seed` (on the server, derived from the account id; the
// browser can't change it) and the day, so the browser can show the loot
// right away and the server always agrees, and nobody can pick their own.
import { FOODS } from './house';

export const CHEST = {
  coins: [50, 150], // a normal day: this many coins (in steps of 5)
  bigCoins: [300, 500], // every `bigEvery`th day of a streak: a big chest
  bigEvery: 7,
  foodChance: 0.4, // a free snack for the fridge
  energyChance: 0.25, // a full energy refill
  diamondChance: 0.04, // 1 💎 (rare: diamonds come from achievements); a big chest always has one
  window: 7, // days: a chest opened offline still counts if it syncs within this many days
};

// The coin-priced snacks a chest can hold; a big chest holds the waffle.
const SNACKS = FOODS.filter((f) => f.price?.coins);
const BIG_SNACK = 'food-floppy';

// FNV-1a: a string to 32 bits.
function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// mulberry32: a tiny seeded generator, 0 <= r() < 1.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const isBigDay = (streak) => streak > 0 && streak % CHEST.bigEvery === 0;

// What the chest for `day` (UTC day number) holds, on day `streak` of a streak:
// { coins, diamonds, food (a FOODS id or null), energy (true: refill), big }.
export function chestLoot(seed, day, streak) {
  const r = rng(hash(`${typeof seed === 'string' ? seed : ''}:chest:${day}`));
  const big = isBigDay(streak);
  const [lo, hi] = big ? CHEST.bigCoins : CHEST.coins;
  // always draw the same numbers in the same order
  const rolls = [r(), r(), r(), r(), r()];
  const coins = lo + Math.floor((rolls[0] * (hi - lo + 5)) / 5) * 5;
  const food = big ? BIG_SNACK : rolls[1] < CHEST.foodChance ? SNACKS[Math.floor(rolls[2] * SNACKS.length)].id : null;
  const energy = big || rolls[3] < CHEST.energyChance;
  const diamonds = big || rolls[4] < CHEST.diamondChance ? 1 : 0;
  return { coins: Math.min(coins, hi), diamonds, food, energy, big };
}
