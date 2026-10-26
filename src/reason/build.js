// Small helpers for laying out levels. The floor of most levels sits at GROUND.

export const GROUND = 460;

// Solid ground from x to x + w, deep enough that nothing shows underneath.
export const ground = (x, w, kind = 'grass', y = GROUND) => ({ x, y, w, h: 800, kind });

// A thin platform you can jump up through.
export const plat = (x, y, w, kind = 'wood') => ({ x, y, w, h: 16, kind, oneWay: true });

// A solid block.
export const block = (x, y, w, h, kind = 'stone') => ({ x, y, w, h, kind });

// Invisible walls at both ends so nobody walks out of the level.
export const edges = (w) => [
  { x: -60, y: -2000, w: 60, h: 4000, kind: 'none' },
  { x: w, y: -2000, w: 60, h: 4000, kind: 'none' },
];
