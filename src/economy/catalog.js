// Everything that can be earned or bought. Shared by the browser and the
// server, so prices and rewards are checked against the same table on both.

export const SLOTS = [
  { id: 'char', name: 'Character', icon: '🙂' },
  { id: 'color', name: 'Color', icon: '🎨' },
  { id: 'outfit', name: 'Clothes', icon: '👕' },
  { id: 'eyes', name: 'Eyes', icon: '👀' },
  { id: 'ears', name: 'Ears', icon: '🎧' },
  { id: 'scarf', name: 'Neck', icon: '🧣' }, // (the slot id stays 'scarf' for saved outfits)
  { id: 'hat', name: 'Hat', icon: '🧢' },
];

// `look` is what the avatar CSS keys off (a color pair, or a data-attribute
// value). Items without a price are free and always owned.
// `level`: only from that level on (see levels.js). A priced item can't be
// bought earlier; a free one (the characters) is owned once it is reached.
export const ITEMS = [
  // Who you play as. Bobby is the button; his friends join as you level up
  // (`level` is the level reached, one past the level cleared). They come in
  // their own colors, so the Color slot only paints Bobby. `look.char` is the
  // avatar's data-char (avatar-chars.css).
  { id: 'char-bobby', slot: 'char', name: 'Bobby', look: null },
  // friends join you in the stories: finish the part where you meet (or beat) them
  { id: 'char-tabby', slot: 'char', name: 'Tabby', look: { char: 'tabby', c: '#5b9bd5', cd: '#3b77ad' }, unlock: { claim: 'cursor:1', text: 'chapter 1 of How I Met Your Cursor' } },
  { id: 'char-bella', slot: 'char', name: 'Bella', look: { char: 'bella', c: '#f39ac0', cd: '#cc6f97' }, unlock: { claim: 'cursor:5', text: 'chapter 5 of How I Met Your Cursor' } },
  { id: 'char-backspace', slot: 'char', name: 'Old Backspace', look: { char: 'backspace', c: '#b4b8c2', cd: '#7d818c' }, unlock: { claim: 'reason:4', text: 'episode 4 of The Reason' } },
  { id: 'char-404', slot: 'char', name: 'Lord 404', look: { char: 'lord404', c: '#8a5cd6', cd: '#5b3a9c' }, unlock: { claim: 'cursor:4', text: 'chapter 4 of How I Met Your Cursor' } },
  { id: 'char-karen', slot: 'char', name: 'Karen Popup', look: { char: 'karen', c: '#eef1f7', cd: '#a9b1c3' }, unlock: { claim: 'cursor:3', text: 'chapter 3 of How I Met Your Cursor' } },
  { id: 'char-cursor', slot: 'char', name: 'Cursor', look: { char: 'cursor', c: '#ffffff', cd: '#b8bccb' }, unlock: { claim: 'cursor:6', text: 'all of How I Met Your Cursor' } },

  { id: 'color-tomato', slot: 'color', name: 'Tomato', look: { c: '#e2674f', cd: '#b84a36' } },
  { id: 'color-ocean', slot: 'color', name: 'Ocean', look: { c: '#5b9bd5', cd: '#3b77ad' }, price: { coins: 300 } },
  { id: 'color-mint', slot: 'color', name: 'Mint', look: { c: '#7cc6a4', cd: '#549c7c' }, price: { coins: 300 } },
  { id: 'color-sunny', slot: 'color', name: 'Sunny', look: { c: '#f2c14e', cd: '#c99a2e' }, price: { coins: 450 } },
  { id: 'color-grape', slot: 'color', name: 'Grape', look: { c: '#a58bd6', cd: '#7c63ad' }, price: { coins: 450 } },
  { id: 'color-bubblegum', slot: 'color', name: 'Bubblegum', look: { c: '#f39ac0', cd: '#cc6f97' }, price: { coins: 600 } },
  { id: 'color-midnight', slot: 'color', name: 'Midnight', look: { c: '#4a5a85', cd: '#2c3654' }, price: { coins: 950 } },
  { id: 'color-gold', slot: 'color', name: 'Solid Gold', look: { c: '#e6b422', cd: '#a87d0c' }, price: { diamonds: 10 } },
  { id: 'color-charcoal', slot: 'color', name: 'Charcoal', look: { c: '#565b6a', cd: '#363a46' }, price: { coins: 400 } },
  { id: 'color-sand', slot: 'color', name: 'Sand', look: { c: '#d3b58f', cd: '#a98b66' }, price: { coins: 400 } },
  { id: 'color-slate', slot: 'color', name: 'Slate', look: { c: '#6c86a3', cd: '#4a6280' }, price: { coins: 450 } },
  { id: 'color-forest', slot: 'color', name: 'Forest', look: { c: '#4e7a5e', cd: '#34523f' }, price: { coins: 500 } },
  { id: 'color-burgundy', slot: 'color', name: 'Burgundy', look: { c: '#8e3b4e', cd: '#652635' }, price: { coins: 550 } },
  { id: 'color-obsidian', slot: 'color', name: 'Obsidian', look: { c: '#2b2b35', cd: '#14141a' }, price: { diamonds: 8 } },

  { id: 'outfit-none', slot: 'outfit', name: 'Just the button', look: null },
  { id: 'outfit-tee', slot: 'outfit', name: 'Band tee', look: 'tee', price: { coins: 400 } },
  { id: 'outfit-hoodie', slot: 'outfit', name: 'Hoodie', look: 'hoodie', price: { coins: 700 } },
  { id: 'outfit-track', slot: 'outfit', name: 'Track jacket', look: 'track', price: { coins: 900 } },
  { id: 'outfit-denim', slot: 'outfit', name: 'Denim jacket', look: 'denim', price: { coins: 1000 } },
  { id: 'outfit-varsity', slot: 'outfit', name: 'Varsity jacket', look: 'varsity', price: { coins: 1300 } },
  { id: 'outfit-blazer', slot: 'outfit', name: 'Blazer', look: 'blazer', price: { coins: 1500 } },
  { id: 'outfit-leather', slot: 'outfit', name: 'Leather jacket', look: 'leather', price: { coins: 1800 } },
  { id: 'outfit-puffer', slot: 'outfit', name: 'Puffer coat', look: 'puffer', price: { diamonds: 5 } },
  { id: 'outfit-raincoat', slot: 'outfit', name: 'Raincoat', look: 'raincoat', price: { coins: 650 } },
  { id: 'outfit-sweater', slot: 'outfit', name: 'Cable sweater', look: 'sweater', price: { coins: 800 } },
  { id: 'outfit-overalls', slot: 'outfit', name: 'Overalls', look: 'overalls', price: { coins: 950 } },
  { id: 'outfit-flannel', slot: 'outfit', name: 'Flannel shirt', look: 'flannel', price: { coins: 1100 } },
  { id: 'outfit-chef', slot: 'outfit', name: "Chef's jacket", look: 'chef', price: { coins: 1400 } },
  { id: 'outfit-tux', slot: 'outfit', name: 'Tuxedo', look: 'tux', price: { coins: 2400 } },

  { id: 'eyes-classic', slot: 'eyes', name: 'Classic', look: null },
  { id: 'eyes-sleepy', slot: 'eyes', name: 'Sleepy', look: 'sleepy', price: { coins: 250 } },
  { id: 'eyes-googly', slot: 'eyes', name: 'Googly', look: 'googly', price: { coins: 400 } },
  { id: 'eyes-hearts', slot: 'eyes', name: 'Hearts', look: 'hearts', price: { coins: 550 } },
  { id: 'eyes-shades', slot: 'eyes', name: 'Shades', look: 'shades', price: { coins: 700 } },
  { id: 'eyes-stars', slot: 'eyes', name: 'Starstruck', look: 'stars', price: { diamonds: 6 } },
  { id: 'eyes-chill', slot: 'eyes', name: 'Unbothered', look: 'chill', price: { coins: 350 } },
  { id: 'eyes-glasses', slot: 'eyes', name: 'Round glasses', look: 'glasses', price: { coins: 600 } },
  { id: 'eyes-aviators', slot: 'eyes', name: 'Aviators', look: 'aviators', price: { coins: 900 } },
  { id: 'eyes-visor', slot: 'eyes', name: 'Gamer visor', look: 'visor', price: { diamonds: 6 } },
  { id: 'eyes-3d', slot: 'eyes', name: '3D glasses', look: '3d', price: { coins: 500 } },
  { id: 'eyes-monocle', slot: 'eyes', name: 'Monocle', look: 'monocle', price: { coins: 1200 } },

  { id: 'ears-none', slot: 'ears', name: 'None', look: null },
  { id: 'ears-bear', slot: 'ears', name: 'Bear', look: 'bear', price: { coins: 400 } },
  { id: 'ears-cat', slot: 'ears', name: 'Cat', look: 'cat', price: { coins: 450 } },
  { id: 'ears-bunny', slot: 'ears', name: 'Bunny', look: 'bunny', price: { coins: 600 } },
  { id: 'ears-devil', slot: 'ears', name: 'Devil horns', look: 'devil', price: { diamonds: 6 } },
  { id: 'ears-earbuds', slot: 'ears', name: 'Earbuds', look: 'earbuds', price: { coins: 450 } },
  { id: 'ears-headphones', slot: 'ears', name: 'Headphones', look: 'headphones', price: { coins: 750 } },
  { id: 'ears-antenna', slot: 'ears', name: 'Antennae', look: 'antenna', price: { coins: 550 } },
  { id: 'ears-fox', slot: 'ears', name: 'Fox', look: 'fox', price: { coins: 650 } },

  { id: 'scarf-none', slot: 'scarf', name: 'None', look: null },
  { id: 'scarf-red', slot: 'scarf', name: 'Red', look: 'red', price: { coins: 300 } },
  { id: 'scarf-sage', slot: 'scarf', name: 'Sage', look: 'sage', price: { coins: 300 } },
  { id: 'scarf-striped', slot: 'scarf', name: 'Striped', look: 'striped', price: { coins: 550 } },
  { id: 'scarf-rainbow', slot: 'scarf', name: 'Rainbow', look: 'rainbow', price: { diamonds: 4 } },
  { id: 'scarf-lanyard', slot: 'scarf', name: 'Lanyard', look: 'lanyard', price: { coins: 350 } },
  { id: 'scarf-bandana', slot: 'scarf', name: 'Bandana', look: 'bandana', price: { coins: 450 } },
  { id: 'scarf-chain', slot: 'scarf', name: 'Gold chain', look: 'chain', price: { coins: 1100 } },
  { id: 'scarf-bowtie', slot: 'scarf', name: 'Bow tie', look: 'bowtie', price: { coins: 400 } },
  { id: 'scarf-tie', slot: 'scarf', name: 'Necktie', look: 'tie', price: { coins: 500 } },

  { id: 'hat-none', slot: 'hat', name: 'None', look: null },
  { id: 'hat-beanie', slot: 'hat', name: 'Beanie', look: 'beanie', price: { coins: 400 } },
  { id: 'hat-party', slot: 'hat', name: 'Party hat', look: 'party', price: { coins: 450 } },
  { id: 'hat-top', slot: 'hat', name: 'Top hat', look: 'top', price: { coins: 800 } },
  { id: 'hat-crown', slot: 'hat', name: 'Crown', look: 'crown', price: { diamonds: 10 } },
  { id: 'hat-headband', slot: 'hat', name: 'Headband', look: 'headband', price: { coins: 350 } },
  { id: 'hat-cap', slot: 'hat', name: 'Snapback', look: 'cap', price: { coins: 550 } },
  { id: 'hat-bucket', slot: 'hat', name: 'Bucket hat', look: 'bucket', price: { coins: 650 } },
  { id: 'hat-beret', slot: 'hat', name: 'Beret', look: 'beret', price: { coins: 700 } },
  { id: 'hat-chef', slot: 'hat', name: "Chef's hat", look: 'chef', price: { coins: 600 } },
  { id: 'hat-cowboy', slot: 'hat', name: 'Cowboy hat', look: 'cowboy', price: { coins: 950 } },
  { id: 'hat-wizard', slot: 'hat', name: 'Wizard hat', look: 'wizard', price: { coins: 1600 } },
];

export const ITEM = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const DEFAULT_LOOK = {
  char: 'char-bobby',
  color: 'color-tomato',
  outfit: 'outfit-none',
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

// Coins only: the diamonds the finales used to pay now come from the story
// achievements (achievements.js).
export const STORY_REWARDS = {
  ...storyRewards('reason', 9, { coins: 200, diamonds: 0 }, { coins: 1500, diamonds: 0 }),
  ...storyRewards('cursor', 6, { coins: 200, diamonds: 0 }, { coins: 1200, diamonds: 0 }),
  // Please Don't pays nothing: finishing it is its own (mysterious) reward.
  // The claim still records that it was finished.
  'please-dont': { coins: 0, diamonds: 0 },
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
  // (runs used to pay diamonds for a game's first 100+ run and big personal
  // bests; those now come from the "score N in <game>" achievements)
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

// Games taken out of the arcade (as in the Android app). Their entries stay
// so runs already in a wallet's history still replay, but they are not
// listed or playable.
const RETIRED = new Set(['catch', 'redlight', 'spam', 'fizz', 'pong', 'tightrope']);

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
    prize: '??? Mystery prize',
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
    {
      id: 'redlight',
      name: 'Freeze!',
      emoji: '🚦',
      color: '#ffd9d0',
      blurb: "The button is sneaking past the cursor. Run while it looks away, freeze the second it turns around.",
      howTo: "Hold to run. Let go the moment the cursor turns around. Caught moving and it is over.",
      payout: { per: 500, base: 25, rate: 40 },
      unit: 'meters',
      quips: { goal: "You outran a cursor. Humiliating for it.", fail: "Caught red-handed. Red-bodied." },
    },
    {
      id: 'spam',
      name: 'Inbox Zero',
      emoji: '📧',
      color: '#d5e6ff',
      blurb: "Emails pour in. Real ones go right, spam goes left. Faster. Faster. The button's job depends on this.",
      howTo: "Tap or swipe left for spam, right for real mail. Wrong sort = a strike. 3 strikes.",
      payout: { per: 25, base: 25, rate: 4 },
      unit: 'emails',
      quips: { goal: "Promotion denied. You are too good at this.", fail: "I trashed Mum's email. Again." },
    },
    {
      id: 'fizz',
      name: 'Shaken Not Stirred',
      emoji: '🥤',
      color: '#ffe7b0',
      blurb: "Shake the soda by dragging it back and forth, then let go before it blows. Bigger fizz, bigger bragging rights.",
      howTo: "Drag back and forth to shake. Release when the meter is in the green. Too far and it explodes.",
      payout: { per: 5, base: 25, rate: 0.5 },
      unit: 'bottles',
      quips: { goal: "Sticky. Victorious. Sticky.", fail: "Soda everywhere. Mostly on my face." },
    },
    {
      id: 'pong',
      name: 'Cursor Pong',
      emoji: '🏓',
      color: '#d4f3e0',
      blurb: "The cursor is the ball and it is furious. Bounce it back with the button paddle before it escapes.",
      howTo: "Drag left and right to move the paddle. Do not let the cursor past.",
      payout: { per: 20, base: 25, rate: 2.5 },
      unit: 'returns',
      quips: { goal: "I bounced a cursor. I am the one with power now.", fail: "It slipped past me. Typical cursor." },
    },
    {
      id: 'tightrope',
      name: 'Wobble Walk',
      emoji: '🎪',
      color: '#f9d9ff',
      blurb: "The button is crossing a tightrope in a gale, wearing no shoes. Lean to stay up. Do not look down.",
      howTo: "Hold the left or right half of the screen (or use ← →) to lean against the wobble.",
      payout: { per: 400, base: 25, rate: 25 },
      unit: 'meters',
      quips: { goal: "I crossed the sky. I want a sandwich.", fail: "Fell. At least the ground is steady." },
    },
  ].map((g) => ({ ...g, category: 'adventure', href: `/games/adventure/${g.id}`, prize: payoutLine(g, true), rule: payoutLine(g), retired: RETIRED.has(g.id) || undefined })),
];

export const GAME = Object.fromEntries(GAMES.map((g) => [g.id, g]));

// The games you can actually play (the same set as the Android app).
export const PLAYABLE = GAMES.filter((g) => !g.retired);
