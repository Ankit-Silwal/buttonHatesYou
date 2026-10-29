// The button's house and its fridge. Prices are on the same scale as the
// outfits (games pay tens to hundreds of coins); food is cheap because it's
// a need.
// Shared by the browser and the server,
// like catalog.js, so prices are checked against the same table on both.
// The pictures are drawn by src/house/art.jsx, keyed by item id.

// Where furniture can go. Each piece lists the spots it fits in, and each
// room (below) lists the spots it has.
export const SPOTS = [
  { id: 'ceiling', name: 'Ceiling' },
  { id: 'wall-left', name: 'Wall, left' },
  { id: 'wall-right', name: 'Wall, right' },
  { id: 'bed', name: 'Bed' },
  { id: 'nightstand', name: 'Nightstand' },
  { id: 'counter', name: 'Counter' },
  { id: 'floor-left', name: 'Floor, left' },
  { id: 'floor-right', name: 'Floor, right' },
  { id: 'corner', name: 'Corner' },
  { id: 'rug', name: 'Rug' },
];
export const SPOT = Object.fromEntries(SPOTS.map((s) => [s.id, s]));

// The rooms of the house you can decorate. Each has its own wallpaper, floor
// and furniture. `required` spots always hold a piece (it can be swapped for
// another, never taken down): the bedroom's bed and its bedside lamp, which
// is how he goes to sleep.
export const ROOMS = {
  living: { id: 'living', name: 'Living Room', icon: '🛋️', spots: ['ceiling', 'wall-left', 'wall-right', 'corner', 'floor-left', 'floor-right', 'rug'], required: [] },
  kitchen: { id: 'kitchen', name: 'Kitchen', icon: '🍳', spots: ['ceiling', 'wall-left', 'wall-right', 'counter', 'floor-left', 'floor-right', 'rug'], required: [] },
  bedroom: { id: 'bedroom', name: 'Bedroom', icon: '🛏️', spots: ['ceiling', 'wall-left', 'wall-right', 'bed', 'nightstand', 'corner', 'floor-left', 'floor-right', 'rug'], required: ['bed', 'nightstand'] },
};
export const ROOM_IDS = Object.keys(ROOMS);

const ALL = ['living', 'kitchen', 'bedroom'];
const LB = ['living', 'bedroom'];
const BED = ['bedroom'];
const KIT = ['kitchen'];

// `kind`: 'wall' (wallpaper), 'floor', or 'furniture'. No price = free and
// always owned. `rooms`: where it can go (walls and floors: everywhere
// unless said otherwise).
const RAW = [
  { id: 'wall-cozy', kind: 'wall', name: 'Cozy Cream' },
  { id: 'wall-mint', kind: 'wall', name: 'Mint Stripes', price: { coins: 300 } },
  { id: 'wall-candy', kind: 'wall', name: 'Candy Shop', price: { coins: 500 } },
  { id: 'wall-beach', kind: 'wall', name: 'Beach House', price: { coins: 900 } },
  { id: 'wall-city', kind: 'wall', name: 'Night City', price: { coins: 1200 } },
  { id: 'wall-gamer', kind: 'wall', name: 'Gamer RGB', price: { coins: 1800 } },
  { id: 'wall-space', kind: 'wall', name: 'Space Station', price: { diamonds: 8 } },
  { id: 'wall-loft', kind: 'wall', name: 'Brick Loft', price: { coins: 1000 } },
  { id: 'wall-studio', kind: 'wall', name: 'Dark Studio', price: { coins: 1400 } },
  { id: 'wall-graffiti', kind: 'wall', name: 'Street Art', price: { coins: 1600 } },
  { id: 'wall-panel', kind: 'wall', name: 'Wood Panels', price: { coins: 1100 } },
  { id: 'wall-sunset', kind: 'wall', name: 'Sunset Stripes', price: { coins: 1300 } },
  { id: 'wall-jungle', kind: 'wall', name: 'Jungle Leaves', price: { coins: 1500 } },
  // the kitchen's own
  { id: 'wall-kitchen-tile', kind: 'wall', name: 'Subway Tile', rooms: KIT },
  { id: 'wall-kitchen-sage', kind: 'wall', name: 'Sage Tile', price: { coins: 400 }, rooms: KIT },
  { id: 'wall-kitchen-sun', kind: 'wall', name: 'Butter Yellow', price: { coins: 500 }, rooms: KIT },
  { id: 'wall-kitchen-noir', kind: 'wall', name: 'Black Tile', price: { coins: 1100 }, rooms: KIT },
  // the bedroom's own
  { id: 'wall-bedroom-blue', kind: 'wall', name: 'Midnight Blue', rooms: BED },
  { id: 'wall-bedroom-plum', kind: 'wall', name: 'Plum Velvet', price: { coins: 500 }, rooms: BED },
  { id: 'wall-bedroom-forest', kind: 'wall', name: 'Forest Green', price: { coins: 600 }, rooms: BED },
  { id: 'wall-bedroom-galaxy', kind: 'wall', name: 'Galaxy Ceiling', price: { diamonds: 8 }, rooms: BED },

  { id: 'floor-oak', kind: 'floor', name: 'Oak Boards' },
  { id: 'floor-carpet', kind: 'floor', name: 'Plush Carpet', price: { coins: 300 } },
  { id: 'floor-checker', kind: 'floor', name: 'Diner Checker', price: { coins: 450 } },
  { id: 'floor-bamboo', kind: 'floor', name: 'Bamboo Mat', price: { coins: 600 } },
  { id: 'floor-marble', kind: 'floor', name: 'Marble', price: { coins: 1200 } },
  { id: 'floor-neon', kind: 'floor', name: 'Neon Grid', price: { diamonds: 6 } },
  { id: 'floor-concrete', kind: 'floor', name: 'Polished Concrete', price: { coins: 700 } },
  { id: 'floor-walnut', kind: 'floor', name: 'Dark Walnut', price: { coins: 900 } },
  { id: 'floor-herringbone', kind: 'floor', name: 'Herringbone', price: { coins: 1300 } },
  { id: 'floor-pixel', kind: 'floor', name: 'Pixel Tiles', price: { coins: 1700 } },
  { id: 'floor-kitchen-checker', kind: 'floor', name: 'Kitchen Checker', rooms: KIT },
  { id: 'floor-kitchen-terrazzo', kind: 'floor', name: 'Terrazzo', price: { coins: 800 }, rooms: KIT },
  { id: 'floor-kitchen-gold', kind: 'floor', name: 'Gold Tiles', price: { diamonds: 6 }, rooms: KIT },
  { id: 'floor-bedroom-rug', kind: 'floor', name: 'Plum Carpet', price: { coins: 500 }, rooms: BED },

  { id: 'bed-basic', kind: 'furniture', name: 'Old Mattress', spots: ['bed'], rooms: BED },
  { id: 'bed-cozy', kind: 'furniture', name: 'Cozy Bed', spots: ['bed'], price: { coins: 1200 }, rooms: BED },
  { id: 'bed-cloud', kind: 'furniture', name: 'Cloud Bed', spots: ['bed'], price: { diamonds: 12 }, rooms: BED },
  { id: 'bed-loft', kind: 'furniture', name: 'Loft Bed', spots: ['bed'], price: { diamonds: 14 }, rooms: BED },

  // bedside lamps: there is always one, it is how he goes to sleep
  { id: 'lamp-bedside', kind: 'furniture', name: 'Bedside Lamp', spots: ['nightstand'], rooms: BED },
  { id: 'nightstand-modern', kind: 'furniture', name: 'Modern Nightstand', spots: ['nightstand'], price: { coins: 450 }, rooms: BED },

  { id: 'lamp-arc', kind: 'furniture', name: 'Arc Lamp', spots: ['corner'], price: { coins: 600 }, rooms: LB },
  { id: 'lamp-lava', kind: 'furniture', name: 'Lava Lamp', spots: ['floor-left', 'floor-right'], price: { coins: 900 }, rooms: LB },
  { id: 'lamp-pendant', kind: 'furniture', name: 'Pendant Lamp', spots: ['ceiling'], price: { coins: 400 }, rooms: ALL },
  { id: 'lights-fairy', kind: 'furniture', name: 'Fairy Lights', spots: ['ceiling'], price: { coins: 500 }, rooms: LB },
  { id: 'disco-ball', kind: 'furniture', name: 'Disco Ball', spots: ['ceiling'], price: { coins: 2500 }, rooms: ['living'] },

  { id: 'plant-monstera', kind: 'furniture', name: 'Monstera', spots: ['corner', 'floor-left', 'floor-right'], price: { coins: 400 }, rooms: ALL },
  { id: 'plant-cactus', kind: 'furniture', name: 'Grumpy Cactus', spots: ['floor-left', 'floor-right'], price: { coins: 150 }, rooms: ALL },
  { id: 'fish-bowl', kind: 'furniture', name: 'Fish Bowl', spots: ['floor-left', 'floor-right'], price: { coins: 1500 }, rooms: ALL },
  { id: 'beanbag', kind: 'furniture', name: 'Beanbag', spots: ['floor-right', 'floor-left'], price: { coins: 800 }, rooms: LB },
  { id: 'tv-retro', kind: 'furniture', name: 'Retro TV', spots: ['floor-right', 'floor-left'], price: { coins: 2000 }, rooms: LB },

  { id: 'rug-round', kind: 'furniture', name: 'Round Rug', spots: ['rug'], price: { coins: 350 }, rooms: ALL },
  { id: 'rug-rainbow', kind: 'furniture', name: 'Rainbow Rug', spots: ['rug'], price: { diamonds: 6 }, rooms: ALL },

  { id: 'poster-band', kind: 'furniture', name: 'Band Poster', spots: ['wall-left', 'wall-right'], price: { coins: 150 }, rooms: LB },
  { id: 'clock-wall', kind: 'furniture', name: 'Wall Clock', spots: ['wall-left', 'wall-right'], price: { coins: 250 }, rooms: ALL },
  { id: 'shelf-books', kind: 'furniture', name: 'Book Shelf', spots: ['wall-left', 'wall-right'], price: { coins: 400 }, rooms: LB },
  { id: 'art-portrait', kind: 'furniture', name: 'Self Portrait', spots: ['wall-left', 'wall-right'], price: { coins: 3000 }, rooms: ALL },
  { id: 'neon-sign', kind: 'furniture', name: 'Neon Sign', spots: ['wall-left', 'wall-right'], price: { diamonds: 10 }, rooms: ALL },

  { id: 'poster-vinyl', kind: 'furniture', name: 'Album Poster', spots: ['wall-left', 'wall-right'], price: { coins: 350 }, rooms: LB },
  { id: 'photo-wall', kind: 'furniture', name: 'Photo Wall', spots: ['wall-left', 'wall-right'], price: { coins: 500 }, rooms: LB },
  { id: 'skate-decks', kind: 'furniture', name: 'Skate Decks', spots: ['wall-left', 'wall-right'], price: { coins: 700 }, rooms: LB },
  { id: 'led-strip', kind: 'furniture', name: 'LED Strips', spots: ['ceiling'], price: { coins: 900 }, rooms: ALL },
  { id: 'rug-shag', kind: 'furniture', name: 'Shag Rug', spots: ['rug'], price: { coins: 900 }, rooms: LB },
  { id: 'plant-snake', kind: 'furniture', name: 'Snake Plant', spots: ['corner', 'floor-left', 'floor-right'], price: { coins: 450 }, rooms: ALL },
  { id: 'mini-fridge', kind: 'furniture', name: 'Mini Fridge', spots: ['floor-left', 'floor-right'], price: { coins: 1100 }, rooms: LB },
  { id: 'record-player', kind: 'furniture', name: 'Record Player', spots: ['floor-left', 'floor-right'], price: { coins: 1400 }, rooms: LB },
  { id: 'guitar-stand', kind: 'furniture', name: 'Electric Guitar', spots: ['corner', 'floor-left', 'floor-right'], price: { coins: 1600 }, rooms: LB },
  { id: 'chair-gaming', kind: 'furniture', name: 'Gaming Chair', spots: ['floor-left', 'floor-right'], price: { coins: 1800 }, rooms: LB },
  { id: 'desk-gaming', kind: 'furniture', name: 'Gaming Desk', spots: ['floor-right', 'floor-left'], price: { coins: 2800 }, rooms: LB },
  { id: 'plant-bonsai', kind: 'furniture', name: 'Bonsai', spots: ['floor-left', 'floor-right'], price: { coins: 700 }, rooms: ALL },
  { id: 'plant-hanging', kind: 'furniture', name: 'Hanging Plant', spots: ['ceiling'], price: { coins: 550 }, rooms: ALL },
  { id: 'mirror-round', kind: 'furniture', name: 'Sunburst Mirror', spots: ['wall-left', 'wall-right'], price: { coins: 600 }, rooms: ALL },
  { id: 'map-world', kind: 'furniture', name: 'World Map', spots: ['wall-left', 'wall-right'], price: { coins: 650 }, rooms: LB },
  { id: 'painting-sunset', kind: 'furniture', name: 'Sunset Painting', spots: ['wall-left', 'wall-right'], price: { coins: 850 }, rooms: ALL },
  { id: 'rug-checker', kind: 'furniture', name: 'Checker Rug', spots: ['rug'], price: { coins: 700 }, rooms: ALL },
  { id: 'globe', kind: 'furniture', name: 'Desk Globe', spots: ['floor-left', 'floor-right'], price: { coins: 950 }, rooms: LB },
  { id: 'bookcase-tall', kind: 'furniture', name: 'Tall Bookcase', spots: ['corner', 'floor-left', 'floor-right'], price: { coins: 1100 }, rooms: LB },
  { id: 'cat-tree', kind: 'furniture', name: 'Cat Tree', spots: ['corner', 'floor-left', 'floor-right'], price: { coins: 1300 }, rooms: LB },
  { id: 'rug-persian', kind: 'furniture', name: 'Persian Rug', spots: ['rug'], price: { coins: 1600 }, rooms: ALL },
  { id: 'arcade-cabinet', kind: 'furniture', name: 'Arcade Cabinet', spots: ['floor-left', 'floor-right'], price: { coins: 2600 }, rooms: LB },
  { id: 'chandelier', kind: 'furniture', name: 'Chandelier', spots: ['ceiling'], price: { coins: 3000 }, rooms: ['living'] },
  { id: 'aquarium-big', kind: 'furniture', name: 'Big Aquarium', spots: ['floor-left', 'floor-right'], price: { coins: 3200 }, rooms: LB },
  { id: 'piano-upright', kind: 'furniture', name: 'Upright Piano', spots: ['floor-left', 'floor-right'], price: { coins: 3500 }, rooms: ['living'] },

  // the kitchen
  { id: 'toaster', kind: 'furniture', name: 'Toaster', spots: ['counter'], price: { coins: 300 }, rooms: KIT },
  { id: 'fruit-bowl', kind: 'furniture', name: 'Fruit Bowl', spots: ['counter'], price: { coins: 250 }, rooms: KIT },
  { id: 'coffee-machine', kind: 'furniture', name: 'Coffee Machine', spots: ['counter'], price: { coins: 700 }, rooms: KIT },
  { id: 'wall-shelf-spices', kind: 'furniture', name: 'Spice Shelf', spots: ['wall-left', 'wall-right'], price: { coins: 450 }, rooms: KIT },
  { id: 'pendant-kitchen', kind: 'furniture', name: 'Kitchen Pendant', spots: ['ceiling'], price: { coins: 600 }, rooms: KIT },
  { id: 'stove-range', kind: 'furniture', name: 'Stove Range', spots: ['floor-left', 'floor-right'], price: { coins: 1500 }, rooms: KIT },
  { id: 'kitchen-table', kind: 'furniture', name: 'Table and Stools', spots: ['floor-right', 'floor-left'], price: { coins: 1200 }, rooms: KIT },
  { id: 'kitchen-island', kind: 'furniture', name: 'Kitchen Island', spots: ['floor-left', 'floor-right'], price: { coins: 2400 }, rooms: KIT },
  { id: 'herb-pots', kind: 'furniture', name: 'Herb Pots', spots: ['counter'], price: { coins: 400 }, rooms: KIT },
  { id: 'blender', kind: 'furniture', name: 'Blender', spots: ['counter'], price: { coins: 550 }, rooms: KIT },
  { id: 'clock-cat', kind: 'furniture', name: 'Cat Clock', spots: ['wall-left', 'wall-right'], price: { coins: 650 }, rooms: KIT },
  { id: 'microwave', kind: 'furniture', name: 'Microwave', spots: ['counter'], price: { coins: 900 }, rooms: KIT },
  { id: 'fridge-retro', kind: 'furniture', name: 'Retro Fridge', spots: ['floor-left', 'floor-right'], price: { coins: 2200 }, rooms: KIT },

  // the bedroom
  { id: 'string-lights', kind: 'furniture', name: 'String Lights', spots: ['ceiling'], price: { coins: 700 }, rooms: BED },
  { id: 'floor-mirror', kind: 'furniture', name: 'Floor Mirror', spots: ['floor-left', 'floor-right', 'corner'], price: { coins: 600 }, rooms: BED },
  { id: 'wardrobe-tall', kind: 'furniture', name: 'Tall Wardrobe', spots: ['floor-right', 'floor-left'], price: { coins: 1300 }, rooms: BED },
  { id: 'desk-study', kind: 'furniture', name: 'Study Desk', spots: ['floor-right', 'floor-left'], price: { coins: 1500 }, rooms: BED },
  { id: 'stars-ceiling', kind: 'furniture', name: 'Star Mobile', spots: ['ceiling'], price: { coins: 800 }, rooms: BED },
  { id: 'dresser', kind: 'furniture', name: 'Dresser', spots: ['floor-right', 'floor-left'], price: { coins: 1400 }, rooms: BED },
];
export const HOUSE_ITEMS = RAW.map((i) => ({ ...i, rooms: i.rooms ?? ALL }));
export const HOUSE_ITEM = Object.fromEntries(HOUSE_ITEMS.map((i) => [i.id, i]));

// What each room starts with: free wallpaper and floor, and in the bedroom a
// bed and a bedside lamp so nobody is ever stuck without a way to sleep.
// `DEFAULT_HOUSE` is the living room (wallet.house, as it was before there
// were other rooms); the others are in wallet.rooms.
export const DEFAULT_HOUSE = Object.freeze({
  wall: 'wall-cozy',
  floor: 'floor-oak',
  place: Object.freeze({}),
});
export const DEFAULT_ROOMS = Object.freeze({
  kitchen: Object.freeze({ wall: 'wall-kitchen-tile', floor: 'floor-kitchen-checker', place: Object.freeze({}) }),
  bedroom: Object.freeze({ wall: 'wall-bedroom-blue', floor: 'floor-oak', place: Object.freeze({ bed: 'bed-basic', nightstand: 'lamp-bedside' }) }),
});

// A room's wallpaper, floor and furniture out of a wallet.
export const roomOf = (wallet, room) => (room === 'living' ? wallet.house : wallet.rooms?.[room]) ?? (room === 'living' ? DEFAULT_HOUSE : DEFAULT_ROOMS[room]);

// Silly things a button eats. Bought and eaten in one go. `hunger`/`energy`
// are how much they restore; `fx` is a funny side effect the house plays.
export const FOODS = [
  { id: 'food-cookie', name: 'Browser Cookie', price: { coins: 15 }, hunger: 10, energy: 8, fx: 'sugar', quip: 'Accept all cookies? Yes. Obviously.' },
  { id: 'food-pixels', name: 'Bowl of Pixels', price: { coins: 20 }, hunger: 20, energy: 0, fx: 'glitch', quip: 'Crunchy. A bit low-res.' },
  { id: 'food-bubble', name: 'Bubble Wrap Chips', price: { coins: 25 }, hunger: 15, energy: 5, fx: 'hiccup', quip: 'Pop. Pop. *hic*. Pop.' },
  { id: 'food-usb', name: 'USB Stick Sandwich', price: { coins: 30 }, hunger: 30, energy: 5, quip: 'Took three tries to get it in. Classic.' },
  { id: 'food-tacks', name: 'Thumbtack Cereal', price: { coins: 35 }, hunger: 25, energy: 10, quip: 'Crunchy. Pointy. Part of a balanced breakfast.' },
  { id: 'food-cables', name: 'Spaghetti Cables', price: { coins: 40 }, hunger: 35, energy: 0, quip: 'Just like nonna used to tangle.' },
  { id: 'food-battery', name: 'AA Battery Smoothie', price: { coins: 50 }, hunger: 5, energy: 35, fx: 'glow', quip: 'I can taste the voltage. Tingly.' },
  { id: 'food-gluedog', name: 'Hot Glue Hot Dog', price: { coins: 60 }, hunger: 40, energy: 10, fx: 'hiccup', quip: 'My mouth is stuck. Worth it.' },
  { id: 'food-floppy', name: 'Floppy Disk Waffle', price: { diamonds: 1 }, hunger: 60, energy: 60, fx: 'glow', quip: '1.44 megabytes of pure flavor.' },
];
export const FOOD = Object.fromEntries(FOODS.map((f) => [f.id, f]));

// When he's broke (can't afford any food and the pantry is empty) the
// cheapest food is on the house, so nobody is ever stuck hungry.
export const FREE_FOOD = FOODS.filter((f) => f.price.coins).reduce((a, b) => (b.price.coins < a.price.coins ? b : a));
export const isBroke = (wallet) =>
  !FOODS.some((f) => (f.price.coins ?? 0) <= wallet.coins && (f.price.diamonds ?? 0) <= wallet.diamonds) &&
  !Object.values(wallet.pantry ?? {}).some((n) => n > 0);

// Energy boosts. Asleep, they get him out of bed on the spot (waking up by
// himself is free but leaves him as groggy as he was); awake, they keep him
// going without a nap. Either way they give some energy back.
export const WAKE_OPTIONS = [
  { id: 'wake-splash', name: 'Cold Water Splash', icon: '💦', price: { coins: 25 }, energy: 6, quip: 'AAAH. COLD. I am awake. I hate you.' },
  { id: 'wake-alarm', name: 'Alarm Clock', icon: '⏰', price: { coins: 40 }, energy: 12, quip: 'BEEP BEEP BEEP. Fine. FINE. I am up.' },
  { id: 'wake-coffee', name: 'Espresso Shot', icon: '☕', price: { coins: 80 }, energy: 22, quip: 'Everything is vibrating. In a good way.' },
  { id: 'wake-band', name: 'Marching Band', icon: '🥁', price: { diamonds: 1 }, energy: 40, quip: 'WHY IS THERE A TUBA IN MY HOUSE. I feel amazing.' },
];
export const WAKE_OPTION = Object.fromEntries(WAKE_OPTIONS.map((w) => [w.id, w]));

// Potions: bought and drunk in one go, they fill a need right up (or, for
// dirt, empty it). `fill` lists what goes to 100: 'hunger', 'energy', and
// 'clean' (dirt back to 0). `drain` does the opposite, on purpose: hunger or
// energy down to DRAINED, dirt up to DRAINED_DIRT (so there is a reason to
// feed, nap or wash him again; they cost more than the good ones).
// Drinking one while he's asleep wakes him.
// `retired`: no longer sold (the bathroom has its own shower), but kept so
// potions already drunk still replay.
export const POTIONS = [
  { id: 'potion-hunger', name: 'Bottomless Tummy Tonic', icon: '🍔', color: '#e2674f', price: { coins: 200 }, fill: ['hunger'], quip: 'I am full. Forever. Do not show me food.' },
  { id: 'potion-energy', name: 'Bottled Nap', icon: '⚡', color: '#f0a81c', price: { coins: 250 }, fill: ['energy'], quip: 'Eight hours of sleep in one gulp. I can see sounds.' },
  { id: 'potion-clean', name: 'Liquid Shower', icon: '🫧', color: '#3fa7d6', price: { coins: 150 }, fill: ['clean'], retired: true, quip: 'I drank a shower. I feel sparkly inside.' },
  { id: 'potion-starve', name: 'Instant Munchies', icon: '🍔', color: '#8a9a3a', price: { coins: 900 }, drain: ['hunger'], quip: 'Why is my stomach screaming? WHAT DID YOU DO.' },
  { id: 'potion-yawn', name: 'Liquid Yawn', icon: '💤', color: '#5a6fb8', price: { coins: 1000 }, drain: ['energy'], quip: 'I am suddenly… so… tired. You did this.' },
  { id: 'potion-mud', name: 'Mud Smoothie', icon: '💩', color: '#7a5a3a', price: { coins: 900 }, drain: ['clean'], quip: 'I drank mud. On purpose. For you. Ew.' },
  { id: 'potion-all', name: 'Fill Everything Elixir', icon: '✨', color: '#8a5cd6', price: { diamonds: 2 }, fill: ['hunger', 'energy', 'clean'], quip: 'Full tummy, full battery, squeaky clean. Same grudge, though.' },
];
export const POTION = Object.fromEntries(POTIONS.map((p) => [p.id, p]));
export const DRAINED = 10;
export const DRAINED_DIRT = 90;
