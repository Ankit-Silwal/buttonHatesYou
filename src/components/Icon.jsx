// The app's icons, drawn instead of emoji (the same set as the Android app's
// Icons.kt). The data still names its icons with emoji, which stay the stable
// ids; <Icon> looks them up here and draws a duotone line icon on a 24x24
// grid (a soft tinted fill under a 1.9-unit stroke), or, for the money, a
// coloured coin and gem. Anything not listed falls back to the emoji itself.

// Layers: f fill, l line, b both, s solid.
export const GLYPHS = {
  bolt: ['#f0a81c', [['b', 'M13 2 L4 14 h7 l-1 8 l9 -12 h-7 z']]],
  food: ['#d9822b', [['b', 'M4 11 a8 6.5 0 0 1 16 0 z'], ['l', 'M3.5 14.5 h17'], ['b', 'M4.5 17.5 h15 a3 3 0 0 1 -3 3 h-9 a3 3 0 0 1 -3 -3 z'], ['s', 'M8.3 7.5 a0.7 0.7 0 1 0 1.4 0 a0.7 0.7 0 1 0 -1.4 0 z'], ['s', 'M12.3 6.5 a0.7 0.7 0 1 0 1.4 0 a0.7 0.7 0 1 0 -1.4 0 z'], ['s', 'M14.8 8.5 a0.7 0.7 0 1 0 1.4 0 a0.7 0.7 0 1 0 -1.4 0 z']]],
  sleep: ['#6f63d3', [['b', 'M20 14.5 A8.5 8.5 0 1 1 9.5 4 a6.5 6.5 0 0 0 10.5 10.5 z'], ['l', 'M15 2.5 h4.5 l-4.5 4.5 h4.5']]],
  bubbles: ['#3fa7d6', [['b', 'M3.5 14 a5.5 5.5 0 1 0 11 0 a5.5 5.5 0 1 0 -11 0 z'], ['l', 'M14.5 6.5 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 z'], ['l', 'M16.7 16.5 a1.8 1.8 0 1 0 3.6 0 a1.8 1.8 0 1 0 -3.6 0 z'], ['s', 'M5.9 12 a1.1 1.1 0 1 0 2.2 0 a1.1 1.1 0 1 0 -2.2 0 z']]],
  pan: ['#5a6273', [['b', 'M3 13 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 z'], ['l', 'M15.5 8 l5.5 -5'], ['s', 'M7.8 13 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0 z']]],
  bed: ['#4f7fd0', [['l', 'M3 5 v15 M21 20 v-4.5 M3 16 h18'], ['b', 'M10 16 V10.5 h8 a3 3 0 0 1 3 3 V16 z'], ['b', 'M4.3 12.5 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0 z']]],
  bath: ['#3fa7d6', [['b', 'M2.5 12 h19 v2 a5.5 5.5 0 0 1 -5.5 5.5 h-8 a5.5 5.5 0 0 1 -5.5 -5.5 z'], ['l', 'M6.5 19.5 l-1 2 M17.5 19.5 l1 2 M5.5 12 V6 a2.2 2.2 0 0 1 4.4 0']]],
  sofa: ['#3c8c8a', [['l', 'M4.5 11 V8 a3 3 0 0 1 3 -3 h9 a3 3 0 0 1 3 3 v3'], ['b', 'M2 13.5 a2 2 0 0 1 4 0 v1 h12 v-1 a2 2 0 0 1 4 0 V18 H2 z'], ['l', 'M5 18 v2 M19 18 v2']]],
  gamepad: ['#5b5fd6', [['b', 'M7 7 h10 a5 5 0 0 1 4.6 7 l-1.3 3.2 a2.5 2.5 0 0 1 -4 0.9 L14 16 h-4 l-2.3 2.1 a2.5 2.5 0 0 1 -4 -0.9 L2.4 14 A5 5 0 0 1 7 7 z'], ['l', 'M8 9.8 v4.4 M5.8 12 h4.4'], ['s', 'M14.4 10.8 a1.1 1.1 0 1 0 2.2 0 a1.1 1.1 0 1 0 -2.2 0 z'], ['s', 'M16.7 13.2 a1.1 1.1 0 1 0 2.2 0 a1.1 1.1 0 1 0 -2.2 0 z']]],
  shirt: ['#3f8fd6', [['b', 'M8.5 3 L3 6 l2 5 l2.2 -1 V21 h9.6 V10 l2.2 1 l2 -5 L15.5 3 a3.5 3.5 0 0 1 -7 0 z']]],
  cart: ['#3c8c8a', [['b', 'M6 6.5 h15 l-2 8 H7.6 z'], ['l', 'M2 3 h3 l2.6 11.5 h11'], ['b', 'M7.3 19.5 a1.7 1.7 0 1 0 3.4 0 a1.7 1.7 0 1 0 -3.4 0 z'], ['b', 'M15.3 19.5 a1.7 1.7 0 1 0 3.4 0 a1.7 1.7 0 1 0 -3.4 0 z']]],
  bulb: ['#f0a81c', [['b', 'M9 17 h6 v-1.5 c0 -1.6 3 -3 3 -7 a6 6 0 0 0 -12 0 c0 4 3 5.4 3 7 z'], ['l', 'M10 20.5 h4']]],
  soap: ['#e07ba6', [['b', 'M4 11 h16 a2 2 0 0 1 2 2 v4 a3 3 0 0 1 -3 3 H5 a3 3 0 0 1 -3 -3 v-4 a2 2 0 0 1 2 -2 z'], ['l', 'M6.2 6 a2.3 2.3 0 1 0 4.6 0 a2.3 2.3 0 1 0 -4.6 0 z'], ['l', 'M13 4.8 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0 z'], ['l', 'M12 8.5 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 z']]],
  shower: ['#3fa7d6', [['l', 'M5 21 V7 a4 4 0 0 1 8 0 v1.5'], ['b', 'M9 8.5 h8 l-1.2 3 h-5.6 z'], ['l', 'M10.5 14.5 v1.4 M13 14.5 v1.4 M15.5 14.5 v1.4 M11.8 18.5 v1.4 M14.4 18.5 v1.4']]],
  trophy: ['#e09a12', [['b', 'M7 3 h10 v5.5 a5 5 0 0 1 -10 0 z'], ['l', 'M7 5 H4 v1 a3.5 3.5 0 0 0 3.5 3.5 M17 5 h3 v1 a3.5 3.5 0 0 1 -3.5 3.5 M12 13.5 v3.5'], ['b', 'M8 21 h8 v-2 a2 2 0 0 0 -2 -2 h-4 a2 2 0 0 0 -2 2 z']]],
  gift: ['#e0574a', [['b', 'M4 11 h16 v9 a1 1 0 0 1 -1 1 H5 a1 1 0 0 1 -1 -1 z'], ['b', 'M3 7 h18 v4 H3 z'], ['l', 'M12 7 v14'], ['l', 'M12 7 c-1 -3.2 -5 -4.2 -5 -1.6 C7 6.8 10 7 12 7 c2 0 5 -0.2 5 -1.6 c0 -2.6 -4 -1.6 -5 1.6']]],
  mic: ['#e2674f', [['b', 'M9 3.5 a3 3 0 0 1 6 0 v8 a3 3 0 0 1 -6 0 z'], ['l', 'M5.5 11 a6.5 6.5 0 0 0 13 0 M12 17.5 V21 M8.5 21 h7']]],
  gear: ['#6f7887', [['b', 'M12.00 2.00 L13.95 2.19 L14.91 4.98 L16.22 5.68 L19.07 4.93 L20.31 6.44 L19.02 9.09 L19.45 10.52 L22.00 12.00 L21.81 13.95 L19.02 14.91 L18.32 16.22 L19.07 19.07 L17.56 20.31 L14.91 19.02 L13.48 19.45 L12.00 22.00 L10.05 21.81 L9.09 19.02 L7.78 18.32 L4.93 19.07 L3.69 17.56 L4.98 14.91 L4.55 13.48 L2.00 12.00 L2.19 10.05 L4.98 9.09 L5.68 7.78 L4.93 4.93 L6.44 3.69 L9.09 4.98 L10.52 4.55 z'], ['l', 'M8.8 12 a3.2 3.2 0 1 0 6.4 0 a3.2 3.2 0 1 0 -6.4 0 z']]],
  speaker: ['#5a6273', [['b', 'M3.5 9 h4 l5.5 -4.5 v15 L7.5 15 h-4 z'], ['l', 'M16.5 9 a4.2 4.2 0 0 1 0 6 M19 6.5 a7.8 7.8 0 0 1 0 11']]],
  vibrate: ['#5a6273', [['b', 'M8.5 3 h7 a1.5 1.5 0 0 1 1.5 1.5 v15 a1.5 1.5 0 0 1 -1.5 1.5 h-7 a1.5 1.5 0 0 1 -1.5 -1.5 v-15 a1.5 1.5 0 0 1 1.5 -1.5 z'], ['l', 'M3.5 8.5 v7 M20.5 8.5 v7 M11 18 h2']]],
  trash: ['#c0453a', [['l', 'M3 6 h18 M9 6 V3.8 h6 V6'], ['b', 'M5 6 l1.2 14 a1.5 1.5 0 0 0 1.5 1.4 h8.6 a1.5 1.5 0 0 0 1.5 -1.4 L19 6 z'], ['l', 'M10 10 v7 M14 10 v7']]],
  flame: ['#e8622c', [['b', 'M12 22 a7 7 0 0 1 -7 -7 c0 -4 3 -6 4 -10.5 c2 2 2.4 4 2.2 5.5 c1.2 -1 2.2 -2.2 2.3 -4.5 c3 2 5.5 5.5 5.5 9.5 a7 7 0 0 1 -7 7 z']]],
  cookie: ['#b9772e', [['b', 'M3 12 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 z'], ['s', 'M7.2 9 a1.3 1.3 0 1 0 2.6 0 a1.3 1.3 0 1 0 -2.6 0 z'], ['s', 'M13.4 7.8 a1.1 1.1 0 1 0 2.2 0 a1.1 1.1 0 1 0 -2.2 0 z'], ['s', 'M14.1 14.2 a1.4 1.4 0 1 0 2.8 0 a1.4 1.4 0 1 0 -2.8 0 z'], ['s', 'M8.4 15.5 a1.1 1.1 0 1 0 2.2 0 a1.1 1.1 0 1 0 -2.2 0 z'], ['s', 'M11.4 11.8 a0.9 0.9 0 1 0 1.8 0 a0.9 0.9 0 1 0 -1.8 0 z']]],
  palette: ['#d9573f', [['b', 'M12 3 a9 9 0 1 0 0 18 c1.5 0 2 -1 2 -2 c0 -1.5 -1.5 -2 -1 -3.5 c0.4 -1 1.5 -1.5 3 -1.5 h2 a3 3 0 0 0 3 -3 C21 6.5 17 3 12 3 z'], ['s', 'M6.1 11 a1.4 1.4 0 1 0 2.8 0 a1.4 1.4 0 1 0 -2.8 0 z'], ['s', 'M8.6 7 a1.4 1.4 0 1 0 2.8 0 a1.4 1.4 0 1 0 -2.8 0 z'], ['s', 'M13.6 7 a1.4 1.4 0 1 0 2.8 0 a1.4 1.4 0 1 0 -2.8 0 z']]],
  eye: ['#4a3428', [['b', 'M2 12 c2.5 -5 7.5 -7 10 -7 s7.5 2 10 7 c-2.5 5 -7.5 7 -10 7 s-7.5 -2 -10 -7 z'], ['s', 'M8.8 12 a3.2 3.2 0 1 0 6.4 0 a3.2 3.2 0 1 0 -6.4 0 z']]],
  headphones: ['#5b5fd6', [['l', 'M4 15 v-3 a8 8 0 0 1 16 0 v3'], ['b', 'M3 14 h3.8 v6.5 H4.5 a1.5 1.5 0 0 1 -1.5 -1.5 z'], ['b', 'M21 14 h-3.8 v6.5 h2.3 a1.5 1.5 0 0 0 1.5 -1.5 z']]],
  scarf: ['#d9573f', [['b', 'M4.5 5.5 c3.5 2.2 11.5 2.2 15 0 v4.5 c-3.5 2.2 -11.5 2.2 -15 0 z'], ['b', 'M12.5 11.5 l2 9.5 h3.2 l-1.8 -10.2']]],
  cap: ['#d9573f', [['b', 'M4 15 a8 8 0 0 1 16 0 z'], ['l', 'M4 15 h17 a1.5 1.5 0 0 1 0 3 h-9'], ['s', 'M10.9 6.6 a1.1 1.1 0 1 0 2.2 0 a1.1 1.1 0 1 0 -2.2 0 z']]],
  tophat: ['#3b2a20', [['b', 'M7 3.5 h10 v13 H7 z'], ['l', 'M7 13 h10 M2.5 17 c3 2.4 16 2.4 19 0']]],
  frame: ['#8a5a2c', [['b', 'M3 4 h18 v16 H3 z'], ['f', 'M6 16.5 l4 -5 l3 3 l2 -2 l3 4 z'], ['l', 'M6 16.5 l4 -5 l3 3 l2 -2 l3 4 z'], ['l', 'M14 8.2 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0 z']]],
  planks: ['#9c6a3c', [['b', 'M3 5 h18 v14 H3 z'], ['l', 'M3 9.7 h18 M3 14.3 h18 M9 5 v4.7 M15 9.7 v4.6 M7 14.3 v4.7']]],
  drops: ['#3fa7d6', [['b', 'M9 3 c3 4 5 7 5 10 a5 5 0 0 1 -10 0 c0 -3 2 -6 5 -10 z'], ['b', 'M18 10 c1.5 2 2.5 3.5 2.5 5 a2.5 2.5 0 0 1 -5 0 c0 -1.5 1 -3 2.5 -5 z']]],
  coffee: ['#8a5a2c', [['b', 'M4 9 h12 v6 a5 5 0 0 1 -5 5 H9 a5 5 0 0 1 -5 -5 z'], ['l', 'M16 11 h1.5 a2.5 2.5 0 0 1 0 5 H16 M8 2.8 c-1 1.5 1 2 0 3.5 M12 2.8 c-1 1.5 1 2 0 3.5']]],
  drum: ['#d9573f', [['b', 'M4 9.5 v7.5 c0 2 3.6 3.5 8 3.5 s8 -1.5 8 -3.5 V9.5'], ['b', 'M4 9.5 a8 3.2 0 1 0 16 0 a8 3.2 0 1 0 -16 0 z'], ['l', 'M9.5 7 L5.5 2 M14.5 7 l4 -5']]],
  alarm: ['#d9573f', [['b', 'M4.5 13 a7.5 7.5 0 1 0 15 0 a7.5 7.5 0 1 0 -15 0 z'], ['l', 'M12 9.5 V13 l2.6 1.6 M3.5 6 l3 -3 M20.5 6 l-3 -3 M7 20 l-1.5 1.5 M17 20 l1.5 1.5']]],
  books: ['#4f7fd0', [['b', 'M4 4 h4 v16 H4 z'], ['b', 'M8 4 h4 v16 H8 z'], ['b', 'M13.5 5 l3.8 -1 l4.2 15.5 l-3.8 1 z']]],
  calendar: ['#d9573f', [['b', 'M3 6 a2 2 0 0 1 2 -2 h14 a2 2 0 0 1 2 2 v13 a2 2 0 0 1 -2 2 H5 a2 2 0 0 1 -2 -2 z'], ['l', 'M3 10 h18 M8 2 v4 M16 2 v4'], ['s', 'M7 14.5 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 z'], ['s', 'M11 14.5 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 z'], ['s', 'M15 14.5 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 z'], ['s', 'M7 18 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 z']]],
  ring: ['#c9a227', [['l', 'M6 15 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 z'], ['b', 'M9 3.5 h6 l2 3 l-5 4 l-5 -4 z']]],
  sword: ['#6f7887', [['b', 'M20.5 3.5 v4 l-10 10 l-4 -4 l10 -10 z'], ['l', 'M4.5 13 l6.5 6.5 M7.6 16.4 l-4.1 4.1']]],
  keyboard: ['#5b5fd6', [['b', 'M2 6 h20 a1 1 0 0 1 1 1 v10 a1 1 0 0 1 -1 1 H2 a1 1 0 0 1 -1 -1 V7 a1 1 0 0 1 1 -1 z'], ['l', 'M5.5 10 h0.1 M9.5 10 h0.1 M13.5 10 h0.1 M17.5 10 h0.1 M8 14 h8']]],
  play: ['#e2674f', [['b', 'M7 4 l13 8 l-13 8 z']]],
  restart: ['#5a6273', [['l', 'M20 12 a8 8 0 1 1 -2.4 -5.7'], ['s', 'M21 3 v6.5 h-6.5 z']]],
};

export const BY_EMOJI = {
  '⚡': 'bolt',
  '🍔': 'food',
  '💤': 'sleep',
  '🫧': 'bubbles',
  '🍳': 'pan',
  '🛏️': 'bed',
  '🛏': 'bed',
  '🛁': 'bath',
  '🛋️': 'sofa',
  '🛋': 'sofa',
  '🎮': 'gamepad',
  '👕': 'shirt',
  '🛒': 'cart',
  '💡': 'bulb',
  '🧼': 'soap',
  '🚿': 'shower',
  '🏆': 'trophy',
  '🎁': 'gift',
  '🎤': 'mic',
  '⚙️': 'gear',
  '⚙': 'gear',
  '🔊': 'speaker',
  '📳': 'vibrate',
  '🗑️': 'trash',
  '🗑': 'trash',
  '🔥': 'flame',
  '🍪': 'cookie',
  '🎨': 'palette',
  '👀': 'eye',
  '🎧': 'headphones',
  '🧣': 'scarf',
  '🧢': 'cap',
  '🎩': 'tophat',
  '🖼️': 'frame',
  '🖼': 'frame',
  '🪵': 'planks',
  '💦': 'drops',
  '☕': 'coffee',
  '🥁': 'drum',
  '⏰': 'alarm',
  '📚': 'books',
  '📅': 'calendar',
  '💍': 'ring',
  '🗡️': 'sword',
  '🗡': 'sword',
  '⌨️': 'keyboard',
  '⌨': 'keyboard',
  '▶': 'play',
  '↻': 'restart',
};

const COIN = '🪙';
const GEM = '💎';

export const hasIcon = (glyph) => glyph === COIN || glyph === GEM || !!BY_EMOJI[glyph];

function Coin() {
  return (
    <>
      <defs>
        <radialGradient id="icon-coin" cx="0.33" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffe58a" />
          <stop offset="0.6" stopColor="#f5b92e" />
          <stop offset="1" stopColor="#d99413" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11.3" fill="#b57a0e" />
      <circle cx="12" cy="12" r="9.7" fill="url(#icon-coin)" />
      <circle cx="12" cy="12" r="7.4" fill="none" stroke="#b57a0e" strokeOpacity="0.55" strokeWidth="0.9" />
      <g fill="#b57a0e" fillOpacity="0.75">
        <circle cx="10.1" cy="10.1" r="1.1" />
        <circle cx="13.9" cy="10.1" r="1.1" />
        <circle cx="10.1" cy="13.9" r="1.1" />
        <circle cx="13.9" cy="13.9" r="1.1" />
      </g>
      <path d="M4.7 9.3A8 8 0 0 1 8.4 4.9" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.1" strokeLinecap="round" />
    </>
  );
}

function Gem() {
  return (
    <>
      <path d="M2 9 L6.5 3.5 h11 L22 9 L12 21.5 z" fill="#2a86c8" />
      <path d="M2 9 h20 L17.5 3.5 h-11 z" fill="#8fdcff" />
      <path d="M7.5 9 L12 21.5 L16.5 9 z" fill="#4fb6e8" />
      <path d="M2 9 L12 21.5 L7.5 9 z" fill="#3aa0dc" />
      <path d="M9.5 3.5 L7.5 9 h9 l-2 -5.5 z" fill="#c4eeff" />
      <path d="M2 9 L6.5 3.5 h11 L22 9 L12 21.5 z" fill="none" stroke="#1c6fa8" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M5.8 6.5 l1.8 -2" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.2" strokeLinecap="round" />
    </>
  );
}

// `glyph` (an emoji) as a drawn icon `size` px square, in its own colour or
// `tint` (any CSS colour, e.g. 'currentColor'; the money keeps its colours).
export default function Icon({ glyph, size = 20, tint, className = '' }) {
  const cls = `icon ${className}`.trim();
  if (glyph === COIN || glyph === GEM) {
    return (
      <svg className={cls} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {glyph === COIN ? <Coin /> : <Gem />}
      </svg>
    );
  }
  const g = GLYPHS[BY_EMOJI[glyph]];
  if (!g) return <span className={cls} aria-hidden="true" style={{ fontSize: size * 0.85 }}>{glyph}</span>;
  const [own, layers] = g;
  const color = tint ?? own;
  return (
    <svg className={cls} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ color }}>
      {layers.map(([k, d], i) => (
        <path
          key={i}
          d={d}
          fill={k === 'l' ? 'none' : 'currentColor'}
          fillOpacity={k === 's' ? 1 : 0.22}
          stroke={k === 'l' || k === 'b' ? 'currentColor' : 'none'}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
