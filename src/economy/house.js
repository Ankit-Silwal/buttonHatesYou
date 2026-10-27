// The button's house and its fridge. Prices are on the same scale as the
// outfits (games pay tens to hundreds of coins); food is cheap because it's
// a need.
// Shared by the browser and the server,
// like catalog.js, so prices are checked against the same table on both.
// The pictures are drawn by src/house/art.jsx, keyed by item id.

// Where furniture can go. Each piece lists the spots it fits in.
export const SPOTS = [
  { id: 'ceiling', name: 'Ceiling' },
  { id: 'wall-left', name: 'Wall, left' },
  { id: 'wall-right', name: 'Wall, right' },
  { id: 'bed', name: 'Bed' },
  { id: 'floor-left', name: 'Floor, left' },
  { id: 'floor-right', name: 'Floor, right' },
  { id: 'corner', name: 'Corner' },
  { id: 'rug', name: 'Rug' },
];
export const SPOT = Object.fromEntries(SPOTS.map((s) => [s.id, s]));

// `kind`: 'wall' (wallpaper), 'floor', or 'furniture'. No price = free and
// always owned.
export const HOUSE_ITEMS = [
  { id: 'wall-cozy', kind: 'wall', name: 'Cozy Cream' },
  { id: 'wall-mint', kind: 'wall', name: 'Mint Stripes', price: { coins: 300 } },
  { id: 'wall-candy', kind: 'wall', name: 'Candy Shop', price: { coins: 500 } },
  { id: 'wall-beach', kind: 'wall', name: 'Beach House', price: { coins: 900 } },
  { id: 'wall-city', kind: 'wall', name: 'Night City', price: { coins: 1200 } },
  { id: 'wall-gamer', kind: 'wall', name: 'Gamer RGB', price: { coins: 1800 } },
  { id: 'wall-space', kind: 'wall', name: 'Space Station', price: { diamonds: 8 } },

  { id: 'floor-oak', kind: 'floor', name: 'Oak Boards' },
  { id: 'floor-carpet', kind: 'floor', name: 'Plush Carpet', price: { coins: 300 } },
  { id: 'floor-checker', kind: 'floor', name: 'Diner Checker', price: { coins: 450 } },
  { id: 'floor-bamboo', kind: 'floor', name: 'Bamboo Mat', price: { coins: 600 } },
  { id: 'floor-marble', kind: 'floor', name: 'Marble', price: { coins: 1200 } },
  { id: 'floor-neon', kind: 'floor', name: 'Neon Grid', price: { diamonds: 6 } },

  { id: 'bed-basic', kind: 'furniture', name: 'Old Mattress', spots: ['bed'] },
  { id: 'bed-cozy', kind: 'furniture', name: 'Cozy Bed', spots: ['bed'], price: { coins: 1200 } },
  { id: 'bed-cloud', kind: 'furniture', name: 'Cloud Bed', spots: ['bed'], price: { diamonds: 12 } },

  { id: 'lamp-arc', kind: 'furniture', name: 'Arc Lamp', spots: ['corner'], price: { coins: 600 } },
  { id: 'lamp-lava', kind: 'furniture', name: 'Lava Lamp', spots: ['floor-left', 'floor-right'], price: { coins: 900 } },
  { id: 'lamp-pendant', kind: 'furniture', name: 'Pendant Lamp', spots: ['ceiling'], price: { coins: 400 } },
  { id: 'lights-fairy', kind: 'furniture', name: 'Fairy Lights', spots: ['ceiling'], price: { coins: 500 } },
  { id: 'disco-ball', kind: 'furniture', name: 'Disco Ball', spots: ['ceiling'], price: { coins: 2500 } },

  { id: 'plant-monstera', kind: 'furniture', name: 'Monstera', spots: ['corner', 'floor-left', 'floor-right'], price: { coins: 400 } },
  { id: 'plant-cactus', kind: 'furniture', name: 'Grumpy Cactus', spots: ['floor-left', 'floor-right'], price: { coins: 150 } },
  { id: 'fish-bowl', kind: 'furniture', name: 'Fish Bowl', spots: ['floor-left', 'floor-right'], price: { coins: 1500 } },
  { id: 'beanbag', kind: 'furniture', name: 'Beanbag', spots: ['floor-right', 'floor-left'], price: { coins: 800 } },
  { id: 'tv-retro', kind: 'furniture', name: 'Retro TV', spots: ['floor-right', 'floor-left'], price: { coins: 2000 } },

  { id: 'rug-round', kind: 'furniture', name: 'Round Rug', spots: ['rug'], price: { coins: 350 } },
  { id: 'rug-rainbow', kind: 'furniture', name: 'Rainbow Rug', spots: ['rug'], price: { diamonds: 6 } },

  { id: 'poster-band', kind: 'furniture', name: 'Band Poster', spots: ['wall-left', 'wall-right'], price: { coins: 150 } },
  { id: 'clock-wall', kind: 'furniture', name: 'Wall Clock', spots: ['wall-left', 'wall-right'], price: { coins: 250 } },
  { id: 'shelf-books', kind: 'furniture', name: 'Book Shelf', spots: ['wall-left', 'wall-right'], price: { coins: 400 } },
  { id: 'art-portrait', kind: 'furniture', name: 'Self Portrait', spots: ['wall-left', 'wall-right'], price: { coins: 3000 } },
  { id: 'neon-sign', kind: 'furniture', name: 'Neon Sign', spots: ['wall-left', 'wall-right'], price: { diamonds: 10 } },
];
export const HOUSE_ITEM = Object.fromEntries(HOUSE_ITEMS.map((i) => [i.id, i]));

// A new player's house: free wallpaper, floor, and a bed so nobody is ever
// stuck without a way to sleep.
export const DEFAULT_HOUSE = Object.freeze({
  wall: 'wall-cozy',
  floor: 'floor-oak',
  place: Object.freeze({ bed: 'bed-basic' }),
});

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
