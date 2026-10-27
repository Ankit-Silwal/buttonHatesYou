import { ITEM, REWARDS, DEFAULT_LOOK } from './catalog';
import { HOUSE_ITEM, DEFAULT_HOUSE, SPOT, FOOD } from './house';
import { DEFAULT_NEEDS, PLAY_COST, needsAt, normalizeNeeds } from './needs';

// A wallet only ever changes through events, and the browser and the server
// run the very same `applyEvent`. The browser applies them right away (so it
// works offline) and queues them; the server replays the queue and its answer
// becomes the new truth.
//
//   { id, type: 'reward', game }        earned a payout from REWARDS (named `game`
//                                       because each used to be one game)
//   { id, type: 'buy', item }           bought an item (outfit or house)
//   { id, type: 'equip', slot, item }   put an owned item on
//   { id, type: 'decor', spot, item }   house: put an owned wallpaper/floor up
//                                       (spot 'wall' / 'floor') or a piece of
//                                       furniture in a spot (item null clears it)
//
// Needs events carry `at`, the time they happened (ms). Hunger and energy
// drift with the clock between events (see needs.js).
//   { id, type: 'feed', item, at }      bought a food and ate it
//   { id, type: 'sleep', at }           went to bed
//   { id, type: 'wake', at }            got up
//   { id, type: 'play', kind, at }      started a game; costs PLAY_COST[kind] energy

export const START = Object.freeze({
  coins: 50, // a little welcome money so the wardrobe isn't just a window
  diamonds: 0,
  owned: [],
  equipped: DEFAULT_LOOK,
  house: DEFAULT_HOUSE,
  needs: DEFAULT_NEEDS,
});

const ANY_ITEM = { ...ITEM, ...HOUSE_ITEM };
const pick = (table, id) => (typeof id === 'string' && Object.hasOwn(table, id) ? table[id] : null);

// Wallets saved before the house existed have no `house` or `needs`.
export function normalize(w) {
  if (!w || typeof w !== 'object') return START;
  if (w.house?.place && w.needs && w.equipped && Array.isArray(w.owned)) return w;
  return {
    ...START,
    ...w,
    owned: Array.isArray(w.owned) ? w.owned : [],
    equipped: { ...DEFAULT_LOOK, ...w.equipped },
    house: { ...DEFAULT_HOUSE, ...w.house, place: { ...DEFAULT_HOUSE.place, ...w.house?.place } },
    needs: normalizeNeeds(w.needs),
  };
}

export const owns = (wallet, item) => !item.price || wallet.owned.includes(item.id);

export const canAfford = (wallet, item) =>
  wallet.coins >= (item.price?.coins ?? 0) && wallet.diamonds >= (item.price?.diamonds ?? 0);

const r2 = (v) => Math.round(v * 100) / 100;

const pay = (wallet, price) => ({
  ...wallet,
  coins: wallet.coins - (price.coins ?? 0),
  diamonds: wallet.diamonds - (price.diamonds ?? 0),
});

// The needs at the event's time. Time only moves forward: an event can't be
// earlier than the last one, nor (on the server) later than `now`.
function needsFor(wallet, ev, now) {
  let t = Number(ev.at);
  if (!Number.isFinite(t) || t <= 0) return null;
  t = Math.max(Math.min(t, now), wallet.needs.at);
  return { ...needsAt(wallet.needs, t), at: t }; // a new player's clock starts here
}

// Returns the new wallet, or null when the event is not allowed.
// Events can come straight from a request body, so trust nothing in them.
// `now` caps event times (the server passes its own clock).
export function applyEvent(wallet, ev, now = Infinity) {
  if (!ev || typeof ev !== 'object') return null;
  wallet = normalize(wallet);

  if (ev.type === 'reward') {
    const prize = pick(REWARDS, ev.game);
    if (!prize) return null;
    return { ...wallet, coins: wallet.coins + prize.coins, diamonds: wallet.diamonds + prize.diamonds };
  }

  if (ev.type === 'buy') {
    const item = pick(ANY_ITEM, ev.item);
    if (!item || owns(wallet, item) || !canAfford(wallet, item)) return null;
    return { ...pay(wallet, item.price), owned: [...wallet.owned, item.id] };
  }

  if (ev.type === 'equip') {
    const item = pick(ITEM, ev.item);
    if (!item || item.slot !== ev.slot || !owns(wallet, item)) return null;
    return { ...wallet, equipped: { ...wallet.equipped, [item.slot]: item.id } };
  }

  if (ev.type === 'decor') {
    const { house } = wallet;
    if (ev.spot === 'wall' || ev.spot === 'floor') {
      const item = pick(HOUSE_ITEM, ev.item);
      if (!item || item.kind !== ev.spot || !owns(wallet, item)) return null;
      return { ...wallet, house: { ...house, [ev.spot]: item.id } };
    }
    if (!pick(SPOT, ev.spot)) return null;
    const place = { ...house.place };
    if (ev.item == null) {
      delete place[ev.spot];
    } else {
      const item = pick(HOUSE_ITEM, ev.item);
      if (!item || item.kind !== 'furniture' || !item.spots.includes(ev.spot) || !owns(wallet, item)) return null;
      for (const s of Object.keys(place)) if (place[s] === item.id) delete place[s]; // only one of each
      place[ev.spot] = item.id;
    }
    if (!place.bed) return null; // there's always a bed
    return { ...wallet, house: { ...house, place } };
  }

  if (ev.type === 'feed') {
    const food = pick(FOOD, ev.item);
    const needs = food && needsFor(wallet, ev, now);
    if (!needs || needs.asleep || !canAfford(wallet, food)) return null;
    return {
      ...pay(wallet, food.price),
      needs: { ...needs, hunger: r2(Math.min(100, needs.hunger + food.hunger)), energy: r2(Math.min(100, needs.energy + food.energy)) },
    };
  }

  if (ev.type === 'sleep' || ev.type === 'wake') {
    const needs = needsFor(wallet, ev, now);
    if (!needs || needs.asleep === (ev.type === 'sleep')) return null;
    return { ...wallet, needs: { ...needs, asleep: ev.type === 'sleep' } };
  }

  if (ev.type === 'play') {
    const cost = pick(PLAY_COST, ev.kind);
    const needs = cost && needsFor(wallet, ev, now);
    if (!needs || needs.asleep || needs.energy < cost) return null;
    return { ...wallet, needs: { ...needs, energy: r2(needs.energy - cost) } };
  }

  return null;
}

export const replay = (wallet, events, now) =>
  events.reduce((w, ev) => applyEvent(w, ev, now) ?? w, normalize(wallet));

export const isEventId = (id) => typeof id === 'string' && id.length > 0 && id.length <= 64;
