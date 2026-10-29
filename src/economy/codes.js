import { MAX_LEVEL, snapshot } from './levels';

// Codes the player can type in (Profile → Settings → Codes). Each works
// once per wallet. Shared by the browser and the server, like the rest of
// the economy, so a redeemed code syncs like any other event:
//   { id, type: 'code', code }   the code as typed (case and spaces don't matter)
//
// `level`: jumps straight to having cleared that many levels (never down).
export const CODES = Object.freeze({
  ISUCKATCODING: { coins: 9_999_999, diamonds: 9_999_999, level: MAX_LEVEL },
});

export const cleanCode = (code) => (typeof code === 'string' ? code.replace(/\s+/g, '').toUpperCase().slice(0, 32) : '');
export const isCode = (code) => Object.hasOwn(CODES, cleanCode(code));
export const usedCode = (wallet, code) => !!wallet.codes?.includes(cleanCode(code));

// The new wallet, null when not allowed (unknown, or used already), or
// undefined when it isn't a code event at all.
export function applyCodeEvent(w, ev) {
  if (ev.type !== 'code') return undefined;
  const id = cleanCode(ev.code);
  const prize = Object.hasOwn(CODES, id) ? CODES[id] : null;
  const used = Array.isArray(w.codes) ? w.codes : [];
  if (!prize || used.includes(id)) return null;
  const next = { ...w, coins: w.coins + (prize.coins ?? 0), diamonds: w.diamonds + (prize.diamonds ?? 0), codes: [...used, id] };
  if (prize.level && prize.level > (w.lv?.n ?? 0)) next.lv = { n: prize.level, at: snapshot(w.stats), best: {} };
  return next;
}
