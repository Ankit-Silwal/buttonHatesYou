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
  { id: 'color-ocean', slot: 'color', name: 'Ocean', look: { c: '#5b9bd5', cd: '#3b77ad' }, price: { coins: 300 } },
  { id: 'color-mint', slot: 'color', name: 'Mint', look: { c: '#7cc6a4', cd: '#549c7c' }, price: { coins: 300 } },
  { id: 'color-sunny', slot: 'color', name: 'Sunny', look: { c: '#f2c14e', cd: '#c99a2e' }, price: { coins: 450 } },
  { id: 'color-grape', slot: 'color', name: 'Grape', look: { c: '#a58bd6', cd: '#7c63ad' }, price: { coins: 450 } },
  { id: 'color-bubblegum', slot: 'color', name: 'Bubblegum', look: { c: '#f39ac0', cd: '#cc6f97' }, price: { coins: 600 } },
  { id: 'color-midnight', slot: 'color', name: 'Midnight', look: { c: '#4a5a85', cd: '#2c3654' }, price: { coins: 950 } },
  { id: 'color-gold', slot: 'color', name: 'Solid Gold', look: { c: '#e6b422', cd: '#a87d0c' }, price: { diamonds: 10 } },

  { id: 'eyes-classic', slot: 'eyes', name: 'Classic', look: null },
  { id: 'eyes-sleepy', slot: 'eyes', name: 'Sleepy', look: 'sleepy', price: { coins: 250 } },
  { id: 'eyes-googly', slot: 'eyes', name: 'Googly', look: 'googly', price: { coins: 400 } },
  { id: 'eyes-hearts', slot: 'eyes', name: 'Hearts', look: 'hearts', price: { coins: 550 } },
  { id: 'eyes-shades', slot: 'eyes', name: 'Shades', look: 'shades', price: { coins: 700 } },
  { id: 'eyes-stars', slot: 'eyes', name: 'Starstruck', look: 'stars', price: { diamonds: 6 } },

  { id: 'ears-none', slot: 'ears', name: 'None', look: null },
  { id: 'ears-bear', slot: 'ears', name: 'Bear', look: 'bear', price: { coins: 400 } },
  { id: 'ears-cat', slot: 'ears', name: 'Cat', look: 'cat', price: { coins: 450 } },
  { id: 'ears-bunny', slot: 'ears', name: 'Bunny', look: 'bunny', price: { coins: 600 } },
  { id: 'ears-devil', slot: 'ears', name: 'Devil horns', look: 'devil', price: { diamonds: 6 } },

  { id: 'scarf-none', slot: 'scarf', name: 'None', look: null },
  { id: 'scarf-red', slot: 'scarf', name: 'Red', look: 'red', price: { coins: 300 } },
  { id: 'scarf-sage', slot: 'scarf', name: 'Sage', look: 'sage', price: { coins: 300 } },
  { id: 'scarf-striped', slot: 'scarf', name: 'Striped', look: 'striped', price: { coins: 550 } },
  { id: 'scarf-rainbow', slot: 'scarf', name: 'Rainbow', look: 'rainbow', price: { diamonds: 4 } },

  { id: 'hat-none', slot: 'hat', name: 'None', look: null },
  { id: 'hat-beanie', slot: 'hat', name: 'Beanie', look: 'beanie', price: { coins: 400 } },
  { id: 'hat-party', slot: 'hat', name: 'Party hat', look: 'party', price: { coins: 450 } },
  { id: 'hat-top', slot: 'hat', name: 'Top hat', look: 'top', price: { coins: 800 } },
  { id: 'hat-crown', slot: 'hat', name: 'Crown', look: 'crown', price: { diamonds: 10 } },
];

export const ITEM = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const DEFAULT_LOOK = {
  color: 'color-tomato',
  eyes: 'eyes-classic',
  ears: 'ears-none',
  scarf: 'scarf-none',
  hat: 'hat-none',
};

/* ---------- rewards (the economy: see README, "Economy") ---------- */

// Story games pay once per episode/chapter, the first time it is finished.
// The wallet remembers the claimed ids (`claimed`), so replays pay nothing,
// on the server too. Ids are '<story>:<n>' (or just the story for Please Don't).
const storyRewards = (story, parts, each, finale) =>
  Object.fromEntries(Array.from({ length: parts }, (_, i) => [`${story}:${i + 1}`, i + 1 === parts ? finale : each]));

export const STORY_REWARDS = {
  ...storyRewards('reason', 9, { coins: 200, diamonds: 0 }, { coins: 1500, diamonds: 10 }),
  ...storyRewards('cursor', 6, { coins: 200, diamonds: 0 }, { coins: 1200, diamonds: 8 }),
  'please-dont': { coins: 800, diamonds: 5 },
};

// Adventure runs pay by performance (see adventurePayout in rules.js). Each
// game's `payout` says how:
//   per, base   rising tiers: the first `per` points pay `base` in total, the
//               next `per` pay 2*base, then 3*base... (partial tiers pro rata)
//   coins       instead: pays the coins picked up in the run, 1:1
//   rate        anti-cheat: the most score (or coins) a second of play can
//               plausibly make; anything above that is not paid
export const RUN_LIMITS = {
  maxPayout: 400, // a single run never pays more than this
  maxRunMs: 30 * 60_000, // a single run counts at most 30 minutes of play
  dailyFull: 3000, // coins from runs per day at full rate...
  overCap: 0.25, // ...then this fraction of each payout
  diamondAt: 100, // 1 diamond the first time a run in a game pays this much
  recordAt: 200, // and 1 more for a run paying this much and
  recordBy: 1.5, // at least this many times the game's best payout before it
};

// Rewards from before the economy rework. Only events still queued from back
// then use these (they pay the old amounts, a limited number of times).
export const REWARDS = {
  'please-dont': { coins: 20, diamonds: 1, max: 1 },
  'reason-episode': { coins: 15, diamonds: 0, max: 9 },
  'reason-finale': { coins: 80, diamonds: 5, max: 1 },
  'cursor-chapter': { coins: 15, diamonds: 0, max: 6 },
  'cursor-finale': { coins: 60, diamonds: 4, max: 1 },
  'adventure-goal': { coins: 8, diamonds: 0, max: 100 },
  'adventure-first': { coins: 0, diamonds: 1, max: 10 },
};

// The two shelves on the Games screen.
export const CATEGORIES = [
  { id: 'story', name: 'Story', blurb: 'Long games with a plot. The button has feelings, apparently.' },
  { id: 'adventure', name: 'Adventure', blurb: 'Quick arcade games starring the button. Every run pays: the better you do, the more you earn.' },
];

// How a run pays, in words: the line on the Games-screen card (short) or the
// rule on the title card.
function payoutLine({ payout: p, unit }, short) {
  if (p.coins) return short ? '1 🪙 per coin you grab' : 'Every coin you grab is yours: 1 coin = 1 🪙.';
  const first = `${p.per} ${unit}`;
  if (short) return `+${p.base} 🪙 per ${first}, rising`;
  return `Every ${first} pays more: ${p.base}, ${p.base * 2}, ${p.base * 3}… 🪙`;
}

// Mini-games, as listed on the Games screen. `prize` is the line on the card;
// the card's picture is drawn by src/components/gameArt.js (`emoji` is the
// fallback, and the icon on Adventure title cards). Adventure games also carry
// what their title card needs: `howTo`, the score `unit`, how a run pays
// (`payout`, see above; `rule` and `prize` spell it out), and two lines for
// the results card (`quips.goal` after a run that paid at least a full tier,
// `quips.fail` otherwise).
export const GAMES = [
  {
    id: 'how-i-met-your-cursor',
    name: 'How I Met Your Cursor',
    emoji: '💍',
    color: '#ffe0b8',
    blurb: 'Button Quest: the story before The Reason. Bobby, his new best friend Cursor, and the most disastrous love story in internet history. 6 chapters, about 30 minutes.',
    href: '/games/how-i-met-your-cursor',
    category: 'story',
    prize: '+200 🪙 a chapter, once',
  },
  {
    id: 'the-reason',
    name: 'The Reason',
    emoji: '🗡️',
    color: '#c9cde8',
    blurb: 'The prequel. A sword-swinging platformer about why the button hates you. 9 episodes, about 50 minutes. Bring tissues.',
    href: '/games/the-reason',
    category: 'story',
    prize: '+200 🪙 an episode, once',
  },
  {
    id: 'please-dont',
    name: "Please Don't",
    emoji: '🔴',
    color: '#f6c9b8', // card background on the Games screen
    blurb: 'Press the button 65 times. It really, really does not want you to.',
    href: '/games/please-dont',
    category: 'story',
    prize: '+800 🪙  +5 💎, once',
  },
  ...[
    {
      id: 'button-run',
      name: 'Button Run',
      emoji: '⌨️',
      color: '#cfd0ff',
      blurb: 'A 3D dash down a giant keyboard. Swerve past firewalls, spam trains and your own cursor clicking down from the sky. Grab wings, magnets and bubble wrap on the way.',
      howTo: 'Swipe, or use ← → to switch lanes, ↑ to jump and ↓ to slide. Tap to jump.',
      payout: { coins: true, rate: 15 },
      unit: 'points',
      quips: { goal: 'You chased me all that way for coins? Get a hobby.', fail: 'Clicked. Of course I got clicked.' },
    },
    {
      id: 'flap',
      name: 'Flappy Regret',
      emoji: '🪽',
      color: '#bfe3ff',
      blurb: 'You strapped wings on the button. Tap to flap it through the pipes. It did not consent to this.',
      howTo: 'Tap, click or press Space to flap.',
      payout: { per: 10, base: 25, rate: 1.5 },
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
      payout: { per: 1000, base: 25, rate: 5000 },
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
      payout: { per: 25, base: 25, rate: 5 },
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
      payout: { per: 5, base: 25, rate: 0.6 },
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
      payout: { per: 2000, base: 25, rate: 150 },
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
      payout: { per: 20, base: 25, rate: 4 },
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
      payout: { per: 600, base: 25, rate: 40 },
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
      payout: { per: 12, base: 25, rate: 3 },
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
      payout: { per: 30, base: 25, rate: 8 },
      unit: 'slices',
      quips: { goal: 'You were aiming for me. I saw that.', fail: 'Ha. Missed me. Literally.' },
    },
  ].map((g) => ({ ...g, category: 'adventure', href: `/games/adventure/${g.id}`, prize: payoutLine(g, true), rule: payoutLine(g) })),
];

export const GAME = Object.fromEntries(GAMES.map((g) => [g.id, g]));
