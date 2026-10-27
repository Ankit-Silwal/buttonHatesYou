// The wallet rules from before the economy rework (old prices, fixed rewards),
// kept only to fold a guest's old event queue into a plain wallet once, so
// nothing they earned or bought changes when prices go up. See store.js.

import { ITEM } from './catalog';

const OLD_PRICES = {
  'color-ocean': { coins: 40 },
  'color-mint': { coins: 40 },
  'color-sunny': { coins: 60 },
  'color-grape': { coins: 60 },
  'color-bubblegum': { coins: 80 },
  'color-midnight': { coins: 120 },
  'color-gold': { diamonds: 5 },
  'eyes-sleepy': { coins: 30 },
  'eyes-googly': { coins: 50 },
  'eyes-hearts': { coins: 70 },
  'eyes-shades': { coins: 90 },
  'eyes-stars': { diamonds: 3 },
  'ears-bear': { coins: 50 },
  'ears-cat': { coins: 60 },
  'ears-bunny': { coins: 80 },
  'ears-devil': { diamonds: 3 },
  'scarf-red': { coins: 40 },
  'scarf-sage': { coins: 40 },
  'scarf-striped': { coins: 70 },
  'scarf-rainbow': { diamonds: 2 },
  'hat-beanie': { coins: 50 },
  'hat-party': { coins: 60 },
  'hat-top': { coins: 100 },
  'hat-crown': { diamonds: 5 },
};

const OLD_REWARDS = {
  'please-dont': { coins: 20, diamonds: 1 },
  'reason-episode': { coins: 15, diamonds: 0 },
  'reason-finale': { coins: 80, diamonds: 5 },
  'cursor-chapter': { coins: 15, diamonds: 0 },
  'cursor-finale': { coins: 60, diamonds: 4 },
  'adventure-goal': { coins: 8, diamonds: 0 },
  'adventure-first': { coins: 0, diamonds: 1 },
};

const has = (t, k) => typeof k === 'string' && Object.hasOwn(t, k);

function legacyApply(w, ev) {
  if (ev?.type === 'reward' && has(OLD_REWARDS, ev.game)) {
    const r = OLD_REWARDS[ev.game];
    return { ...w, coins: w.coins + r.coins, diamonds: w.diamonds + r.diamonds };
  }
  if (ev?.type === 'buy') {
    const price = has(OLD_PRICES, ev.item) ? OLD_PRICES[ev.item] : null;
    const c = price?.coins ?? 0;
    const d = price?.diamonds ?? 0;
    if (!price || w.owned.includes(ev.item) || w.coins < c || w.diamonds < d) return w;
    return { ...w, coins: w.coins - c, diamonds: w.diamonds - d, owned: [...w.owned, ev.item] };
  }
  if (ev?.type === 'equip' && typeof ev.slot === 'string' && typeof ev.item === 'string') {
    const free = !has(OLD_PRICES, ev.item);
    if (ITEM[ev.item]?.slot !== ev.slot || !(free || w.owned.includes(ev.item))) return w;
    return { ...w, equipped: { ...w.equipped, [ev.slot]: ev.item } };
  }
  return w;
}

export const legacyReplay = (wallet, events) => events.reduce(legacyApply, wallet);
