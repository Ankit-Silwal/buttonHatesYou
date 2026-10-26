// Everything that can be earned or bought. Shared by the browser and the
// server, so prices and rewards are checked against the same table on both.

export const SLOTS = [
  { id: 'color', name: 'Color', icon: '🎨' },
  { id: 'eyes', name: 'Eyes', icon: '👀' },
  { id: 'ears', name: 'Ears', icon: '🐱' },
  { id: 'scarf', name: 'Scarf', icon: '🧣' },
  { id: 'hat', name: 'Hat', icon: '🎩' },
];

// `look` is what the avatar CSS keys off (a color pair, or a data-attribute
// value). Items without a price are free and always owned.
export const ITEMS = [
  { id: 'color-tomato', slot: 'color', name: 'Tomato', look: { c: '#e2674f', cd: '#b84a36' } },
  { id: 'color-ocean', slot: 'color', name: 'Ocean', look: { c: '#5b9bd5', cd: '#3b77ad' }, price: { coins: 40 } },
  { id: 'color-mint', slot: 'color', name: 'Mint', look: { c: '#7cc6a4', cd: '#549c7c' }, price: { coins: 40 } },
  { id: 'color-sunny', slot: 'color', name: 'Sunny', look: { c: '#f2c14e', cd: '#c99a2e' }, price: { coins: 60 } },
  { id: 'color-grape', slot: 'color', name: 'Grape', look: { c: '#a58bd6', cd: '#7c63ad' }, price: { coins: 60 } },
  { id: 'color-bubblegum', slot: 'color', name: 'Bubblegum', look: { c: '#f39ac0', cd: '#cc6f97' }, price: { coins: 80 } },
  { id: 'color-midnight', slot: 'color', name: 'Midnight', look: { c: '#4a5a85', cd: '#2c3654' }, price: { coins: 120 } },
  { id: 'color-gold', slot: 'color', name: 'Solid Gold', look: { c: '#e6b422', cd: '#a87d0c' }, price: { diamonds: 5 } },

  { id: 'eyes-classic', slot: 'eyes', name: 'Classic', look: null },
  { id: 'eyes-sleepy', slot: 'eyes', name: 'Sleepy', look: 'sleepy', price: { coins: 30 } },
  { id: 'eyes-googly', slot: 'eyes', name: 'Googly', look: 'googly', price: { coins: 50 } },
  { id: 'eyes-hearts', slot: 'eyes', name: 'Hearts', look: 'hearts', price: { coins: 70 } },
  { id: 'eyes-shades', slot: 'eyes', name: 'Shades', look: 'shades', price: { coins: 90 } },
  { id: 'eyes-stars', slot: 'eyes', name: 'Starstruck', look: 'stars', price: { diamonds: 3 } },

  { id: 'ears-none', slot: 'ears', name: 'None', look: null },
  { id: 'ears-bear', slot: 'ears', name: 'Bear', look: 'bear', price: { coins: 50 } },
  { id: 'ears-cat', slot: 'ears', name: 'Cat', look: 'cat', price: { coins: 60 } },
  { id: 'ears-bunny', slot: 'ears', name: 'Bunny', look: 'bunny', price: { coins: 80 } },
  { id: 'ears-devil', slot: 'ears', name: 'Devil horns', look: 'devil', price: { diamonds: 3 } },

  { id: 'scarf-none', slot: 'scarf', name: 'None', look: null },
  { id: 'scarf-red', slot: 'scarf', name: 'Red', look: 'red', price: { coins: 40 } },
  { id: 'scarf-sage', slot: 'scarf', name: 'Sage', look: 'sage', price: { coins: 40 } },
  { id: 'scarf-striped', slot: 'scarf', name: 'Striped', look: 'striped', price: { coins: 70 } },
  { id: 'scarf-rainbow', slot: 'scarf', name: 'Rainbow', look: 'rainbow', price: { diamonds: 2 } },

  { id: 'hat-none', slot: 'hat', name: 'None', look: null },
  { id: 'hat-beanie', slot: 'hat', name: 'Beanie', look: 'beanie', price: { coins: 50 } },
  { id: 'hat-party', slot: 'hat', name: 'Party hat', look: 'party', price: { coins: 60 } },
  { id: 'hat-top', slot: 'hat', name: 'Top hat', look: 'top', price: { coins: 100 } },
  { id: 'hat-crown', slot: 'hat', name: 'Crown', look: 'crown', price: { diamonds: 5 } },
];

export const ITEM = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const DEFAULT_LOOK = {
  color: 'color-tomato',
  eyes: 'eyes-classic',
  ears: 'ears-none',
  scarf: 'scarf-none',
  hat: 'hat-none',
};

// What each payout is worth. A game asks for one by id when the player
// earns it; the server only ever pays amounts from this table.
export const REWARDS = {
  'please-dont': { coins: 20, diamonds: 1 }, // finishing Please Don't
  'love-chapter': { coins: 10, diamonds: 0 }, // each chapter of Desperate for Love
  'love-finale': { coins: 50, diamonds: 3 }, // finishing Desperate for Love
  'reason-episode': { coins: 15, diamonds: 0 }, // each episode of The Reason
  'reason-finale': { coins: 80, diamonds: 5 }, // finishing The Reason
};

// Mini-games, as listed on the Games screen. `prize` is the line on the card.
export const GAMES = [
  {
    id: 'desperate-for-love',
    name: 'Desperate for Love',
    emoji: '💘',
    color: '#ffc8dc',
    blurb: "Bobby the button has been single for 404 days. Be his wingman. 50 levels of terrible romance.",
    href: '/games/desperate-for-love',
    prize: '+10 🪙 a chapter',
  },
  {
    id: 'the-reason',
    name: 'The Reason',
    emoji: '🗡️',
    color: '#c9cde8',
    blurb: 'The prequel. A sword-swinging platformer about why the button hates you. 9 episodes, about 50 minutes. Bring tissues.',
    href: '/games/the-reason',
    prize: '+15 🪙 an episode',
  },
  {
    id: 'please-dont',
    name: "Please Don't",
    emoji: '🔴',
    color: '#f6c9b8', // card background on the Games screen
    blurb: 'Press the button 65 times. It really, really does not want you to.',
    href: '/games/please-dont',
    prize: '+20 🪙  +1 💎',
  },
];
