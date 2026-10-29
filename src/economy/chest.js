// The daily chest: once per UTC day, free goodies. Shared by the browser and
// the server. What's inside is decided by a seeded random number generator,
// from the wallet's `seed` (on the server, derived from the account id; the
// browser can't change it) and the day, so the browser can show the loot
// right away and the server always agrees, and nobody can pick their own.
import { FOODS, HOUSE_ITEMS } from './house';

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

/* ---------- the chest you buy with coins ---------- */
// Not free: it costs `price` coins and holds a little less than that on
// average (see scripts/check-economy.mjs), so it's a gamble, not a money
// printer. It opens with `taps` taps, and each tap has a small chance to bump
// it up one rarity (`up[i]` from rarity i), so most stay common:
// about 70% common, 22% rare, 7% epic, 1% legendary.
// Like the daily chest, the whole thing (every tap and the loot) comes from
// the wallet's seed and how many chests it has bought, so the server agrees.
export const RARITIES = ['common', 'rare', 'epic', 'legendary'];
export const BUY_CHEST = {
  price: { coins: 500 },
  taps: 5,
  up: [0.069, 0.145, 0.12],
  coins: { common: [250, 350], rare: [450, 600], epic: [900, 1200], legendary: [500, 500] },
  snack: { common: 0.4, rare: 0.5 }, // a free snack for the fridge
  rareDiamond: 0.15, // rare: sometimes 1 💎; epic: always 1 💎 and a Floppy Disk Waffle
  epicDiamonds: 1,
  legendaryDiamonds: 3,
  furnitureFrom: 2000, // legendary: a piece of furniture you don't own, priced at least this
  jackpot: { coins: 3000, diamonds: 5 }, // legendary, when you own all of those
};

// The furniture a legendary chest can hold: the expensive coin-priced pieces,
// minus anything level-locked or no longer sold.
export const LEGENDARY_FURNITURE = HOUSE_ITEMS.filter(
  (i) => i.kind === 'furniture' && (i.price?.coins ?? 0) >= BUY_CHEST.furnitureFrom && !i.price.diamonds && i.level == null && !i.retired
);

// The `n`th bought chest (0 = the first) of the wallet with `seed`, which owns
// `owned`: { path: [rarity after each tap], rarity, loot: { coins, diamonds,
// food (a FOODS id or null), item (a HOUSE_ITEMS id or null) } }.
export function boughtChest(seed, n, owned = []) {
  const r = rng(hash(`${typeof seed === 'string' ? seed : ''}:buychest:${n}`));
  // always draw the same numbers in the same order
  const rolls = Array.from({ length: BUY_CHEST.taps + 5 }, r);
  let level = 0;
  const path = rolls.slice(0, BUY_CHEST.taps).map((x) => {
    if (level < BUY_CHEST.up.length && x < BUY_CHEST.up[level]) level++;
    return RARITIES[level];
  });
  const rarity = RARITIES[level];
  return { path, rarity, loot: lootOf(rarity, rolls.slice(BUY_CHEST.taps), owned) };
}

// A chest of a set rarity (a chest code, see codes.js): the same five taps,
// climbing evenly to that rarity by the last one, and the same loot as a
// bought chest of it. `n`: how many of these the wallet has opened.
export function forcedChest(seed, n, owned = [], rarity = 'common') {
  const r = rng(hash(`${typeof seed === 'string' ? seed : ''}:codechest:${n}`));
  const rolls = Array.from({ length: 5 }, r);
  const top = Math.max(0, RARITIES.indexOf(rarity));
  const path = Array.from({ length: BUY_CHEST.taps }, (_, i) => RARITIES[Math.floor((top * (i + 1)) / BUY_CHEST.taps)]);
  return { path, rarity: RARITIES[top], loot: lootOf(RARITIES[top], rolls, owned) };
}

// What a chest of `rarity` holds, from five rolls.
function lootOf(rarity, [cRoll, sRoll, fRoll, dRoll, iRoll], owned) {
  const [lo, hi] = BUY_CHEST.coins[rarity];
  const loot = { coins: Math.min(hi, lo + Math.floor((cRoll * (hi - lo + 5)) / 5) * 5), diamonds: 0, food: null, item: null };
  if (sRoll < (BUY_CHEST.snack[rarity] ?? 0)) loot.food = SNACKS[Math.floor(fRoll * SNACKS.length)].id;
  if (rarity === 'rare' && dRoll < BUY_CHEST.rareDiamond) loot.diamonds = 1;
  if (rarity === 'epic') Object.assign(loot, { diamonds: BUY_CHEST.epicDiamonds, food: BIG_SNACK });
  if (rarity === 'legendary') {
    const left = LEGENDARY_FURNITURE.filter((i) => !owned.includes(i.id));
    if (left.length) Object.assign(loot, { diamonds: BUY_CHEST.legendaryDiamonds, item: left[Math.floor(iRoll * left.length)].id });
    else Object.assign(loot, BUY_CHEST.jackpot);
  }
  return loot;
}
