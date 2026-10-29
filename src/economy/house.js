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

  // Moving furniture (animated, art-more.jsx). `level`: only sold from that
  // level on, as that level's buy mission (see levels.js). One per room for
  // coins, and one per room for a small fortune in diamonds.
  { id: 'jukebox', kind: 'furniture', name: 'Jukebox', spots: ['floor-left', 'floor-right'], price: { coins: 9000 }, level: 60, rooms: ['living'], moving: true },
  { id: 'robot-chef', kind: 'furniture', name: 'Robot Chef', spots: ['floor-left', 'floor-right'], price: { coins: 10500 }, level: 90, rooms: KIT, moving: true },
  { id: 'galaxy-projector', kind: 'furniture', name: 'Galaxy Projector', spots: ['floor-left', 'floor-right'], price: { coins: 12000 }, level: 130, rooms: BED, moving: true },
  { id: 'fireplace', kind: 'furniture', name: 'Roaring Fireplace', spots: ['floor-left', 'floor-right'], price: { diamonds: 280 }, rooms: ['living'], moving: true },
  { id: 'popcorn-machine', kind: 'furniture', name: 'Popcorn Machine', spots: ['floor-left', 'floor-right'], price: { diamonds: 200 }, rooms: KIT, moving: true },
  { id: 'raincloud', kind: 'furniture', name: 'Pet Raincloud', spots: ['ceiling'], price: { diamonds: 240 }, rooms: BED, moving: true },

  // Built-in pieces: what each room comes furnished with (DEFAULT_PIECES
  // below). Free and always owned, so they can be moved, taken out and put
  // back like anything else; `builtin` pieces don't count towards MAX_PIECES.
  // Drawn by art-decor.jsx.
  { id: 'frame-meadow', kind: 'furniture', name: 'Meadow Painting', spots: ['wall-left', 'wall-right'], builtin: true, rooms: ALL },
  { id: 'clock-oak', kind: 'furniture', name: 'Oak Wall Clock', spots: ['wall-right', 'wall-left'], builtin: true, rooms: ALL },
  { id: 'shelf-trinkets', kind: 'furniture', name: 'Trinket Shelf', spots: ['wall-right', 'wall-left'], builtin: true, rooms: LB },
  { id: 'plant-leafy', kind: 'furniture', name: 'Leafy Plant', spots: ['floor-left', 'corner', 'floor-right'], builtin: true, rooms: ALL },
  { id: 'lamp-floor', kind: 'furniture', name: 'Floor Lamp', spots: ['corner', 'floor-left', 'floor-right'], builtin: true, rooms: LB },
  { id: 'sofa-teal', kind: 'furniture', name: 'Teal Sofa', spots: ['floor-right', 'floor-left'], builtin: true, rooms: LB },
  { id: 'shelf-jars', kind: 'furniture', name: 'Jar Shelf', spots: ['wall-right', 'wall-left'], builtin: true, rooms: KIT },
  { id: 'pendant-red', kind: 'furniture', name: 'Red Pendant', spots: ['ceiling'], builtin: true, rooms: ALL },
  { id: 'table-bistro', kind: 'furniture', name: 'Bistro Table', spots: ['floor-right', 'floor-left'], builtin: true, rooms: KIT },
  { id: 'lights-twinkle', kind: 'furniture', name: 'Twinkle Lights', spots: ['ceiling'], builtin: true, rooms: LB },
  { id: 'poster-moon', kind: 'furniture', name: 'Moon Poster', spots: ['wall-left', 'wall-right'], builtin: true, rooms: LB },
  { id: 'wardrobe-plum', kind: 'furniture', name: 'Plum Wardrobe', spots: ['floor-right', 'floor-left'], builtin: true, rooms: BED },

  // Bookshelves, clocks and everyday decor (art-decor.jsx). `track: false`:
  // kept out of the levels' buy missions, so the levels stay as they were.
  { id: 'shelf-floating', kind: 'furniture', name: 'Floating Shelves', spots: ['wall-left', 'wall-right'], price: { coins: 550 }, track: false, rooms: ALL },
  { id: 'shelf-ladder', kind: 'furniture', name: 'Ladder Shelf', spots: ['corner', 'floor-left', 'floor-right'], price: { coins: 750 }, track: false, rooms: LB },
  { id: 'shelf-cube', kind: 'furniture', name: 'Cube Shelf', spots: ['floor-left', 'floor-right'], price: { coins: 950 }, track: false, rooms: LB },
  { id: 'bookcase-library', kind: 'furniture', name: 'Library Bookcase', spots: ['floor-left', 'floor-right'], price: { diamonds: 10 }, track: false, rooms: LB },
  { id: 'clock-digital', kind: 'furniture', name: 'LED Clock', spots: ['wall-left', 'wall-right'], price: { coins: 800 }, track: false, rooms: ALL },
  { id: 'clock-sunburst', kind: 'furniture', name: 'Sunburst Clock', spots: ['wall-left', 'wall-right'], price: { coins: 1000 }, track: false, rooms: ALL },
  { id: 'clock-cuckoo', kind: 'furniture', name: 'Cuckoo Clock', spots: ['wall-left', 'wall-right'], price: { coins: 1200 }, track: false, rooms: ALL },
  { id: 'clock-grandfather', kind: 'furniture', name: 'Grandfather Clock', spots: ['corner', 'floor-left', 'floor-right'], price: { diamonds: 8 }, track: false, rooms: LB },
  { id: 'lamp-mushroom', kind: 'furniture', name: 'Mushroom Lamp', spots: ['floor-left', 'floor-right'], price: { coins: 650 }, track: false, rooms: ALL },
  { id: 'plant-fiddle', kind: 'furniture', name: 'Fiddle Leaf Fig', spots: ['corner', 'floor-left', 'floor-right'], price: { coins: 850 }, track: false, rooms: ALL },
  { id: 'rug-boho', kind: 'furniture', name: 'Boho Rug', spots: ['rug'], price: { coins: 600 }, track: false, rooms: ALL },
  { id: 'art-abstract', kind: 'furniture', name: 'Abstract Canvas', spots: ['wall-left', 'wall-right'], price: { coins: 750 }, track: false, rooms: ALL },

  // Cursor's Collection: the last levels' buy missions (195 to 200)
  { id: 'cursor-rug', kind: 'furniture', name: 'Pointer Rug', spots: ['rug'], price: { coins: 6000 }, level: 195, rooms: ALL },
  { id: 'cursor-pendant', kind: 'furniture', name: 'Pointer Pendant', spots: ['ceiling'], price: { coins: 6500 }, level: 196, rooms: ALL },
  { id: 'cursor-hourglass', kind: 'furniture', name: 'Loading Hourglass', spots: ['floor-left', 'floor-right', 'counter'], price: { coins: 7000 }, level: 197, rooms: ALL },
  { id: 'cursor-neon', kind: 'furniture', name: 'Pointer Neon', spots: ['wall-left', 'wall-right'], price: { coins: 8000 }, level: 198, rooms: ALL },
  { id: 'cursor-statue', kind: 'furniture', name: 'Golden Cursor', spots: ['floor-left', 'floor-right', 'corner'], price: { coins: 9000 }, level: 199, rooms: LB },
  { id: 'wall-cursor', kind: 'wall', name: "Cursor's Wallpaper", price: { coins: 10000 }, level: 200 },
];
export const HOUSE_ITEMS = RAW.map((i) => ({ ...i, rooms: i.rooms ?? ALL }));
export const HOUSE_ITEM = Object.fromEntries(HOUSE_ITEMS.map((i) => [i.id, i]));

// What each room starts with: free wallpaper and floor, and in the bedroom a
// bed and a bedside lamp so nobody is ever stuck without a way to sleep.
// `DEFAULT_HOUSE` is the living room (wallet.house, as it was before there
// were other rooms); the others are in wallet.rooms.
// `place` only holds the fixed spots (FIXED_SPOTS: the bed and the
// nightstand); every other piece is free-placed, in `items` (see below).
//
// Every room also comes furnished with its built-in pieces (DEFAULT_PIECES),
// placed where the room used to draw them. `furnished` marks a room that has
// had them: a room saved before they existed gets them once, on normalize()
// in rules.js, and after that taking one out sticks.
// `covers`: the old spot names whose furniture used to hide the piece (see
// coveredSpots), so a room migrated with something already there doesn't
// get the piece on top of it, and an old queued `decor` event for that spot
// still replaces it.
export const FURNISHED = 1;
const piece = (item, x, y, covers) => Object.freeze({ item, x, y, covers: Object.freeze(covers) });
export const DEFAULT_PIECES = Object.freeze({
  living: Object.freeze([
    piece('frame-meadow', 73.6, 6.3, ['wall-left']),
    piece('clock-oak', 91.4, 5.9, ['wall-right']),
    piece('shelf-trinkets', 87.8, 48.9, ['wall-right']),
    piece('plant-leafy', 6.4, 1.9, ['floor-left', 'corner']),
    piece('lamp-floor', 72.9, 0.6, ['corner']),
    piece('sofa-teal', 86.3, 3.8, ['floor-right']),
  ]),
  kitchen: Object.freeze([
    piece('shelf-jars', 77.1, 26.8, ['wall-right']),
    piece('pendant-red', 66, 0, ['ceiling']),
    piece('table-bistro', 65.5, 10.4, ['floor-right']),
  ]),
  bedroom: Object.freeze([
    piece('lights-twinkle', 50, 0, ['ceiling']),
    piece('poster-moon', 37.4, 4.6, ['wall-left']),
    piece('wardrobe-plum', 94.3, 1.9, ['floor-right']),
  ]),
});
// A room's built-in pieces as `items` entries.
export const defaultItems = (room) => (DEFAULT_PIECES[room] ?? []).map(({ item, x, y }) => ({ item, x, y }));
// Whether a piece sits exactly where the room put it to start with.
export const atHome = (room, p) => (DEFAULT_PIECES[room] ?? []).some((d) => d.item === p.item && d.x === p.x && d.y === p.y);

const frozenItems = (room) => Object.freeze(defaultItems(room).map((p) => Object.freeze(p)));
export const DEFAULT_HOUSE = Object.freeze({
  wall: 'wall-cozy',
  floor: 'floor-oak',
  place: Object.freeze({}),
  items: frozenItems('living'),
  furnished: FURNISHED,
});
export const DEFAULT_ROOMS = Object.freeze({
  kitchen: Object.freeze({ wall: 'wall-kitchen-tile', floor: 'floor-kitchen-checker', place: Object.freeze({}), items: frozenItems('kitchen'), furnished: FURNISHED }),
  bedroom: Object.freeze({ wall: 'wall-bedroom-blue', floor: 'floor-oak', place: Object.freeze({ bed: 'bed-basic', nightstand: 'lamp-bedside' }), items: frozenItems('bedroom'), furnished: FURNISHED }),
});

// A room's wallpaper, floor and furniture out of a wallet.
export const roomOf = (wallet, room) => (room === 'living' ? wallet.house : wallet.rooms?.[room]) ?? (room === 'living' ? DEFAULT_HOUSE : DEFAULT_ROOMS[room]);

/* ---------------------- free-placed furniture ----------------------
   A room's furniture (all but its bed and nightstand) is a list of pieces
   `items: [{ item, x, y }]`, at most MAX_PIECES, one of each item. x and y
   are percent (0-100) of the piece's *band*, the strip of the room where
   that kind of piece can go, worked out from the spots it used to fit:
     ceiling  hangs from the top: only x counts
     wall     on the wall: x across, y from high up (0) to low (100)
     counter  on the kitchen counter: x along it, y is 0
     floor    stands on the floor: y from the back wall (0) to the front (100)
     rug      lies on the floor, under everything else
   The renderers (src/house/Pieces.jsx) draw each band from the room's own
   geometry, so the same numbers look right at any size. */
export const MAX_PIECES = 10;
// How many pieces count towards MAX_PIECES: the built-in ones don't (a room
// comes with them, and taking them out shouldn't be what makes room).
export const countPieces = (items) => (items ?? []).filter((p) => !HOUSE_ITEM[p?.item]?.builtin).length;
export const FIXED_SPOTS = ['bed', 'nightstand'];
export const BANDS = ['rug', 'ceiling', 'wall', 'counter', 'floor']; // back to front
export const SPOT_BAND = { ceiling: 'ceiling', 'wall-left': 'wall', 'wall-right': 'wall', counter: 'counter', corner: 'floor', 'floor-left': 'floor', 'floor-right': 'floor', rug: 'rug' };
// Where the old named spots are, as band positions (old wallets and old
// queued `decor` events land here).
export const SPOT_AT = Object.freeze({
  ceiling: { x: 50, y: 0 },
  'wall-left': { x: 32, y: 20 },
  'wall-right': { x: 70, y: 20 },
  counter: { x: 70, y: 0 },
  corner: { x: 94, y: 0 },
  'floor-left': { x: 14, y: 6 },
  'floor-right': { x: 82, y: 6 },
  rug: { x: 50, y: 0 },
});
const FLAT = new Set(['ceiling', 'counter']); // bands where only x counts

// A piece's band, or null when it isn't free-placed (walls, floors, beds, lamps).
export function bandOf(item) {
  if (item?.kind !== 'furniture') return null;
  const s = item.spots.find((s) => SPOT_BAND[s]);
  return s ? SPOT_BAND[s] : null;
}
// Whether a piece can be free-placed in a room: it names the room, and the
// room has a spot of its band (only the kitchen has a counter).
export const fitsRoom = (item, room) => !!bandOf(item) && item.rooms.includes(room) && item.spots.some((s) => SPOT_BAND[s] && ROOMS[room]?.spots.includes(s));

// A position made safe: numbers only, clamped to the band, 1 decimal.
// Null when x or y is not a finite number.
export function clampAt(band, x, y) {
  if (typeof x !== 'number' || !Number.isFinite(x)) return null;
  if (!FLAT.has(band) && (typeof y !== 'number' || !Number.isFinite(y))) return null;
  const c = (v) => Math.round(Math.min(100, Math.max(0, v)) * 10) / 10;
  return { x: c(x), y: FLAT.has(band) ? 0 : c(y) };
}

// Which of the old named spots some furniture stands in (the room used to
// hide its own prop there; see `covers` in DEFAULT_PIECES and data-has in
// RoomScene).
export function coveredSpots(items) {
  const out = new Set();
  for (const p of items ?? []) {
    const band = bandOf(HOUSE_ITEM[p?.item]);
    if (band === 'ceiling' || band === 'rug' || band === 'counter') out.add(band);
    if (band === 'wall') out.add(p.x < 52 ? 'wall-left' : 'wall-right');
    if (band === 'floor' && p.y < 45) out.add(p.x >= 88 ? 'corner' : p.x < 40 ? 'floor-left' : p.x > 60 ? 'floor-right' : 'floor-mid');
  }
  return [...out];
}

// A free spot for a piece being added: its old spot if nobody is near it,
// otherwise the candidate furthest from the other pieces of its band.
const GRID = {
  ceiling: [[50, 0], [25, 0], [75, 0], [12, 0], [88, 0], [38, 0], [62, 0]],
  wall: [[32, 20], [70, 20], [14, 30], [88, 30], [50, 8], [22, 60], [80, 60], [50, 45]],
  counter: [[70, 0], [30, 0], [50, 0], [12, 0], [88, 0]],
  floor: [[14, 6], [82, 6], [30, 40], [70, 40], [50, 80], [10, 75], [90, 75], [94, 0], [50, 10]],
  rug: [[50, 0], [30, 50], [70, 50], [50, 70]],
};
export function freeSpotFor(item, items = []) {
  const band = bandOf(item);
  if (!band) return null;
  const others = items.filter((p) => p.item !== item.id && bandOf(HOUSE_ITEM[p.item]) === band);
  const own = item.spots.filter((s) => SPOT_AT[s]).map((s) => [SPOT_AT[s].x, SPOT_AT[s].y]);
  let best = null;
  for (const [x, y] of [...own, ...GRID[band]]) {
    const gap = Math.min(Infinity, ...others.map((p) => Math.hypot(p.x - x, (p.y - y) * 0.6)));
    if (gap >= 18) return { x, y };
    if (!best || gap > best.gap) best = { x, y, gap };
  }
  return { x: best.x, y: best.y };
}

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
