import { ITEM, GAME, DEFAULT_LOOK } from './catalog';

// A wallet only ever changes through events, and the browser and the server
// run the very same `applyEvent`. The browser applies them right away (so it
// works offline) and queues them; the server replays the queue and its answer
// becomes the new truth.
//
//   { id, type: 'reward', game }        finished a mini-game
//   { id, type: 'buy', item }           bought an item
//   { id, type: 'equip', slot, item }   put an owned item on

export const START = Object.freeze({
  coins: 50, // a little welcome money so the wardrobe isn't just a window
  diamonds: 0,
  owned: [],
  equipped: DEFAULT_LOOK,
});

export const owns = (wallet, item) => !item.price || wallet.owned.includes(item.id);

export const canAfford = (wallet, item) =>
  wallet.coins >= (item.price?.coins ?? 0) && wallet.diamonds >= (item.price?.diamonds ?? 0);

// Returns the new wallet, or null when the event is not allowed.
// Events can come straight from a request body, so trust nothing in them.
export function applyEvent(wallet, ev) {
  if (!ev || typeof ev !== 'object') return null;

  if (ev.type === 'reward') {
    const game = GAME[ev.game];
    if (!game) return null;
    return {
      ...wallet,
      coins: wallet.coins + (game.reward.coins ?? 0),
      diamonds: wallet.diamonds + (game.reward.diamonds ?? 0),
    };
  }

  if (ev.type === 'buy') {
    const item = ITEM[ev.item];
    if (!item || owns(wallet, item) || !canAfford(wallet, item)) return null;
    return {
      ...wallet,
      coins: wallet.coins - (item.price.coins ?? 0),
      diamonds: wallet.diamonds - (item.price.diamonds ?? 0),
      owned: [...wallet.owned, item.id],
    };
  }

  if (ev.type === 'equip') {
    const item = ITEM[ev.item];
    if (!item || item.slot !== ev.slot || !owns(wallet, item)) return null;
    return { ...wallet, equipped: { ...wallet.equipped, [item.slot]: item.id } };
  }

  return null;
}

export const replay = (wallet, events) => events.reduce((w, ev) => applyEvent(w, ev) ?? w, wallet);

export const isEventId = (id) => typeof id === 'string' && id.length > 0 && id.length <= 64;
