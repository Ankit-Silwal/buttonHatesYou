// Cached art helpers for the story games: glow sprites, tile textures,
// gradients and screen overlays are rendered once into offscreen canvases and
// reused every frame, so the per-frame cost is a handful of drawImage calls.

const W = 960;
const H = 540;

export const hash = (i) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export function makeCanvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil(w));
  cv.height = Math.max(1, Math.ceil(h));
  return cv;
}

// One cache for every keyed sprite. make(ctx, canvas) draws it once.
const SPRITES = new Map();
export function sprite(key, w, h, make) {
  let cv = SPRITES.get(key);
  if (!cv) {
    cv = makeCanvas(w, h);
    make(cv.getContext('2d'), cv);
    SPRITES.set(key, cv);
  }
  return cv;
}

/* ---------- colour helpers ---------- */
let probe = null;
const RGB = new Map();
export function rgb(hex) {
  if (hex[0] !== '#') {
    // any other CSS colour: let a canvas resolve it once
    let v = RGB.get(hex);
    if (!v) {
      probe ??= makeCanvas(1, 1).getContext('2d');
      probe.fillStyle = '#000';
      probe.fillStyle = hex;
      const r = probe.fillStyle;
      v = r[0] === '#' ? rgb(r) : (r.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
      RGB.set(hex, v);
    }
    return v;
  }
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.replace(/./g, (m) => m + m);
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mix(a, b, k) {
  const A = rgb(a);
  const B = rgb(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * k));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
export const rgba = (hex, a) => {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};
export const lighten = (hex, k) => mix(hex, '#ffffff', k);
export const darken = (hex, k) => mix(hex, '#000000', k);

/* ---------- glows ---------- */
// A soft round light, white-hot in the middle and fading to `color`.
export function glowSprite(color, core = 0.25) {
  return sprite(`glow:${color}:${core}`, 128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, rgba(lighten(color, 0.6), 1));
    g.addColorStop(core, rgba(color, 0.55));
    g.addColorStop(0.55, rgba(color, 0.16));
    g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });
}

// Additive glow of radius r at (x, y). Cheap: one drawImage.
export function glow(c, x, y, r, color, a = 1, core) {
  if (a <= 0 || r <= 0) return;
  const op = c.globalCompositeOperation;
  const ga = c.globalAlpha;
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = ga * Math.min(1, a);
  c.drawImage(glowSprite(color, core), x - r, y - r, r * 2, r * 2);
  c.globalAlpha = ga;
  c.globalCompositeOperation = op;
}

// The same light drawn normally (for light colours on light skies, where
// additive blending would just blow out to white).
export function softLight(c, x, y, r, color, a = 1) {
  if (a <= 0) return;
  const ga = c.globalAlpha;
  c.globalAlpha = ga * Math.min(1, a);
  c.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  c.globalAlpha = ga;
}

// A soft dark ellipse: contact shadows under characters and props.
export function shadow(c, x, y, rx, a = 0.28, ry = rx * 0.28) {
  if (a <= 0) return;
  const s = sprite('shadow', 64, 32, (k) => {
    const g = k.createRadialGradient(32, 16, 0, 32, 16, 32);
    g.addColorStop(0, 'rgba(0,0,0,0.9)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.45)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    k.setTransform(1, 0, 0, 0.5, 0, 0);
    k.fillStyle = g;
    k.fillRect(0, 0, 64, 64);
  });
  const ga = c.globalAlpha;
  c.globalAlpha = ga * a;
  c.drawImage(s, x - rx, y - ry, rx * 2, ry * 2);
  c.globalAlpha = ga;
}

// Vertical fade strip (alpha from a0 to a1 of colour), cached, drawn stretched.
export function fadeStrip(color, a0, a1, mid = 0.5) {
  return sprite(`strip:${color}:${a0}:${a1}:${mid}`, 4, 256, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, rgba(color, a0));
    g.addColorStop(mid, rgba(color, a0 + (a1 - a0) * 0.6));
    g.addColorStop(1, rgba(color, a1));
    c.fillStyle = g;
    c.fillRect(0, 0, 4, 256);
  });
}
// Horizontal version (for side edges).
export function fadeStripX(color, a0, a1) {
  return sprite(`stripx:${color}:${a0}:${a1}`, 256, 4, (c) => {
    const g = c.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, rgba(color, a0));
    g.addColorStop(1, rgba(color, a1));
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 4);
  });
}

/* ---------- textures ---------- */
// World-aligned repeating patterns. Patterns are created per context.
export function pattern(c, key, size, make) {
  const store = (c.__patterns ??= new Map());
  let p = store.get(key);
  if (!p) {
    const cv = sprite(`tex:${key}`, size, size, make);
    p = c.createPattern(cv, 'repeat');
    store.set(key, p);
  }
  return p;
}

// Speckle noise helper for textures.
export function speckle(c, w, h, n, colors, min = 1, max = 3, seed = 0) {
  for (let i = 0; i < n; i++) {
    c.fillStyle = colors[i % colors.length];
    const s = min + hash(i * 3.1 + seed) * (max - min);
    c.fillRect(Math.floor(hash(i + seed * 7.7) * w), Math.floor(hash(i * 1.7 + 40 + seed) * h), s, s);
  }
}

/* ---------- per-theme screen overlays ---------- */
// grade: { edge: vignette colour, ev: vignette strength, top/bottom: tint wash }
export function gradeOverlay(key, grade) {
  return sprite(`grade:${key}`, W / 2, H / 2, (c) => {
    c.scale(0.5, 0.5);
    if (grade.top) {
      const t = c.createLinearGradient(0, 0, 0, H * 0.6);
      t.addColorStop(0, rgba(grade.top, grade.topA ?? 0.12));
      t.addColorStop(1, rgba(grade.top, 0));
      c.fillStyle = t;
      c.fillRect(0, 0, W, H);
    }
    if (grade.bottom) {
      const b = c.createLinearGradient(0, H * 0.5, 0, H);
      b.addColorStop(0, rgba(grade.bottom, 0));
      b.addColorStop(1, rgba(grade.bottom, grade.bottomA ?? 0.18));
      c.fillStyle = b;
      c.fillRect(0, 0, W, H);
    }
    const v = c.createRadialGradient(W / 2, H * 0.48, H * 0.32, W / 2, H / 2, H * 1.02);
    v.addColorStop(0, rgba(grade.edge ?? '#000000', 0));
    v.addColorStop(0.6, rgba(grade.edge ?? '#000000', (grade.ev ?? 0.3) * 0.35));
    v.addColorStop(1, rgba(grade.edge ?? '#000000', grade.ev ?? 0.3));
    c.fillStyle = v;
    c.fillRect(0, 0, W, H);
  });
}

// Generic darkening vignette used by fx.vignette (strength baked in steps).
export function vignetteSprite(a) {
  const k = Math.round(a * 20) / 20;
  return sprite(`vig:${k}`, W / 2, H / 2, (c) => {
    c.scale(0.5, 0.5);
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, `rgba(0,0,0,${k})`);
    c.fillStyle = v;
    c.fillRect(0, 0, W, H);
  });
}
