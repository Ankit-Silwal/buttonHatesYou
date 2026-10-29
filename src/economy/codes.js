import { MAX_LEVEL, snapshot } from './levels';
import { forcedChest } from './chest';

// Codes the player can type in (Profile → Settings → Codes). Each works
// once per wallet. Shared by the browser and the server, like the rest of
// the economy, so a redeemed code syncs like any other event:
//   { id, type: 'code', code }   the code as typed (case and spaces don't matter)
//
// `level`: jumps straight to having cleared that many levels (never down).
// `group`: codes in one group pay once between them. `retired`: no longer
// accepted when typed in, but still applied when a saved event replays (so
// nobody who used it loses what it gave).
export const CODES = Object.freeze({
  DSAISUSELESS: { coins: 9_999_999, diamonds: 9_999_999, level: MAX_LEVEL, group: 'max' },
  ISUCKATCODING: { coins: 9_999_999, diamonds: 9_999_999, level: MAX_LEVEL, group: 'max', retired: true },
  // a free chest of that rarity, opened with the usual five taps
  COMMON: { chest: 'common' },
  RARE: { chest: 'rare' },
  EPIC: { chest: 'epic' },
  LEGENDARY: { chest: 'legendary' },
});

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
// The chest a chest code would give this wallet right now ({ path, rarity, loot }).
export const codeChest = (w, code) => {
  const c = codeOf(code);
  return c?.chest ? forcedChest(w.seed, num(w.stats?.codeChests), w.owned ?? [], c.chest) : null;
};

export const cleanCode = (code) => (typeof code === 'string' ? code.replace(/\s+/g, '').toUpperCase().slice(0, 32) : '');
const codeOf = (code) => (Object.hasOwn(CODES, cleanCode(code)) ? CODES[cleanCode(code)] : null);
// can be typed in now (retired ones can't)
export const isCode = (code) => !!codeOf(code) && !codeOf(code).retired;
// this code, or another of its group, was used already
export const usedCode = (wallet, code) => {
  const c = codeOf(code);
  const used = Array.isArray(wallet.codes) ? wallet.codes : [];
  return used.includes(cleanCode(code)) || (!!c?.group && used.some((u) => CODES[u]?.group === c.group));
};

// The new wallet, null when not allowed (unknown, or used already), or
// undefined when it isn't a code event at all.
export function applyCodeEvent(w, ev) {
  if (ev.type !== 'code') return undefined;
  const id = cleanCode(ev.code);
  const prize = codeOf(id);
  const used = Array.isArray(w.codes) ? w.codes : [];
  if (!prize || usedCode(w, id)) return null;
  const next = { ...w, coins: w.coins + (prize.coins ?? 0), diamonds: w.diamonds + (prize.diamonds ?? 0), codes: [...used, id] };
  if (prize.chest) {
    const { loot } = codeChest(w, id);
    next.coins += loot.coins;
    next.diamonds += loot.diamonds;
    if (loot.food) next.pantry = { ...w.pantry, [loot.food]: num(w.pantry?.[loot.food]) + 1 };
    if (loot.item && !w.owned.includes(loot.item)) next.owned = [...w.owned, loot.item];
    next.stats = { ...w.stats, codeChests: num(w.stats?.codeChests) + 1 };
  }
  if (prize.level && prize.level > (w.lv?.n ?? 0)) next.lv = { n: prize.level, at: snapshot(w.stats), best: {} };
  return next;
}
