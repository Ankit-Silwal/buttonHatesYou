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
  'reason-episode': { coins: 15, diamonds: 0 }, // each episode of The Reason
  'reason-finale': { coins: 80, diamonds: 5 }, // finishing The Reason
  'cursor-chapter': { coins: 15, diamonds: 0 }, // each chapter of How I Met Your Cursor
  'cursor-finale': { coins: 60, diamonds: 4 }, // finishing How I Met Your Cursor
  'adventure-goal': { coins: 8, diamonds: 0 }, // reaching an Adventure game's goal score
  'adventure-first': { coins: 0, diamonds: 1 }, // ...for the very first time in that game
};

// The two shelves on the Games screen.
export const CATEGORIES = [
  { id: 'story', name: 'Story', blurb: 'Long games with a plot. The button has feelings, apparently.' },
  { id: 'adventure', name: 'Adventure', blurb: 'Quick arcade games starring the button. Beat the goal score to get paid.' },
];

const ADVENTURE_PRIZE = '+8 🪙 at the goal';

// Mini-games, as listed on the Games screen. `prize` is the line on the card;
// `best` (a rank, 1 = first) also puts a game in the starred "Best ones" row.
// Adventure games also carry what their title card needs: `howTo`, a `goal`
// score in `unit`s, and two lines for the results card (`quips.goal` when
// the player made it, `quips.fail` when the button got its way).
export const GAMES = [
  {
    id: 'how-i-met-your-cursor',
    name: 'How I Met Your Cursor',
    best: 2,
    emoji: '💍',
    color: '#ffe0b8',
    blurb: 'Button Quest: the story before The Reason. Bobby, his new best friend Cursor, and the most disastrous love story in internet history. 6 chapters, about 30 minutes.',
    href: '/games/how-i-met-your-cursor',
    category: 'story',
    prize: '+15 🪙 a chapter',
  },
  {
    id: 'the-reason',
    name: 'The Reason',
    best: 1, // featured in "Best ones" at the top of the Games screen (lower = higher up)
    emoji: '🗡️',
    color: '#c9cde8',
    blurb: 'The prequel. A sword-swinging platformer about why the button hates you. 9 episodes, about 50 minutes. Bring tissues.',
    href: '/games/the-reason',
    category: 'story',
    prize: '+15 🪙 an episode',
  },
  {
    id: 'please-dont',
    name: "Please Don't",
    emoji: '🔴',
    color: '#f6c9b8', // card background on the Games screen
    blurb: 'Press the button 65 times. It really, really does not want you to.',
    href: '/games/please-dont',
    category: 'story',
    prize: '+20 🪙  +1 💎',
  },
  ...[
    {
      id: 'flap',
      name: 'Flappy Regret',
      emoji: '🪽',
      color: '#bfe3ff',
      blurb: 'You strapped wings on the button. Tap to flap it through the pipes. It did not consent to this.',
      howTo: 'Tap, click or press Space to flap.',
      goal: 15,
      unit: 'pipes',
      quips: { goal: 'I am going to be sick.', fail: 'Gravity is my friend now.' },
    },
    {
      id: 'pop',
      name: 'Pop Tantrum',
      emoji: '🫧',
      color: '#ffd6f0',
      blurb: "The button's cousins are stuck in a grid. Pop groups of the same color before you run out of taps.",
      howTo: 'Tap a group of 2 or more same-colored buttons to pop them. 25 taps.',
      goal: 1500,
      unit: 'points',
      quips: { goal: 'You popped my whole family.', fail: 'Family reunion: saved.' },
    },
    {
      id: 'catch',
      name: 'Snack Attack',
      emoji: '🍩',
      color: '#ffe3b3',
      blurb: 'Snacks are falling. So are bombs. Move the button to catch one and not the other.',
      howTo: 'Drag, or use ← → to move. Catch snacks, dodge bombs. 3 lives.',
      goal: 40,
      unit: 'snacks',
      quips: { goal: 'I ate them out of spite.', fail: 'I was on a diet anyway.' },
    },
    {
      id: 'simon',
      name: 'Copy Me',
      emoji: '🎵',
      color: '#d8ccff',
      blurb: 'The button plays a tune on its four friends. Repeat it. It gets longer. The button gets smugger.',
      howTo: 'Watch the sequence, then tap the pads in the same order.',
      goal: 8,
      unit: 'rounds',
      quips: { goal: 'You were supposed to forget.', fail: 'Goldfish memory. Classic.' },
    },
    {
      id: 'hop',
      name: 'Sky Hop',
      emoji: '☁️',
      color: '#c9f0e4',
      blurb: 'The button bounces up and up on clouds, trying to get as far away from you as possible.',
      howTo: 'Steer with ← →, or hold and drag where you want it to go.',
      goal: 3000,
      unit: 'meters',
      quips: { goal: 'Still not far enough from you.', fail: 'Gravity: 1. Me: also fine.' },
    },
    {
      id: 'whack',
      name: 'Whack-a-Button',
      emoji: '🔨',
      color: '#f6d1b8',
      blurb: 'The button and its clones peek out of holes. Bonk them. Do not bonk the ones holding a heart.',
      howTo: 'Tap buttons as they pop up. Skip the ones with a heart. 45 seconds.',
      goal: 30,
      unit: 'bonks',
      quips: { goal: 'My head is a pancake now.', fail: 'Too slow. We felt nothing.' },
    },
    {
      id: 'run',
      name: 'Run Away',
      emoji: '🏃',
      color: '#d4ecb0',
      blurb: 'The button finally grew legs and is sprinting away from you. Help it jump the junk in its path.',
      howTo: 'Tap or press Space to jump. Hold to jump higher. Down / swipe down to duck.',
      goal: 1000,
      unit: 'meters',
      quips: { goal: 'You helped me escape you. Odd.', fail: 'Tripped. Do not look at me.' },
    },
    {
      id: 'stack',
      name: 'Tower of Regret',
      emoji: '🗼',
      color: '#ffe0c2',
      blurb: 'Drop the button clones on top of each other to build a tower. Whatever hangs over the edge falls off, screaming.',
      howTo: 'Tap or press Space to drop the swinging clone.',
      goal: 20,
      unit: 'floors',
      quips: { goal: 'My back hurts. All of our backs.', fail: 'A short tower for a short attention span.' },
    },
    {
      id: 'slice',
      name: 'Slice Spree',
      emoji: '🔪',
      color: '#ffd0c9',
      blurb: 'Fruit and junk fly up. Swipe to slice them. The button flies up too. Do NOT slice the button.',
      howTo: 'Swipe across things to slice them. Missing 3 or slicing the button ends the run.',
      goal: 50,
      unit: 'slices',
      quips: { goal: 'You were aiming for me. I saw that.', fail: 'Ha. Missed me. Literally.' },
    },
  ].map((g) => ({ ...g, category: 'adventure', href: `/games/adventure/${g.id}`, prize: ADVENTURE_PRIZE })),
];

export const GAME = Object.fromEntries(GAMES.map((g) => [g.id, g]));
