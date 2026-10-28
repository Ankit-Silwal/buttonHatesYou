// Rising tiers: the first `per` units pay `base`, the next `per` pay 2*base,
// then 3*base, and so on; a partial tier pays its share, rounded down.
// e.g. per 10, base 25: 10 -> 25, 15 -> 50, 20 -> 75, 30 -> 150, 40 -> 250.
// (Its own module so achievements.js can use it without importing rules.js.)
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export function tierPayout(score, per, base) {
  score = Math.floor(num(score));
  if (score <= 0) return 0;
  const n = Math.floor(score / per);
  const part = score - n * per;
  return Math.floor((base * (n * (n + 1) * per + 2 * (n + 1) * part)) / (2 * per));
}

// The lowest score that pays at least `payout` (tierPayout only ever rises).
export function scoreFor(payout, per, base) {
  payout = Math.floor(num(payout));
  if (payout <= 0) return 0;
  let lo = 0;
  let hi = per;
  while (tierPayout(hi, per, base) < payout) hi *= 2;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (tierPayout(mid, per, base) >= payout) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
