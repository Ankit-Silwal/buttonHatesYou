// Cached art helpers for the Adventure mini-games (480x800 portrait).
// Glows, shadows, gradients and whole background layers are painted once into
// offscreen canvases and reused every frame, so a frame costs a handful of
// drawImage calls instead of rebuilding gradients and paths.

const W = 480;
const H = 800;

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

// One cache for every keyed sprite; make(ctx, canvas) paints it once.
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

/* ---------- colour ---------- */
const RGB = new Map();
let probe = null;
export function rgb(col) {
  let v = RGB.get(col);
  if (v) return v;
  if (col[0] === '#') {
    let h = col.slice(1);
    if (h.length === 3) h = h.replace(/./g, (m) => m + m);
    const n = parseInt(h, 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  } else {
    probe ??= makeCanvas(1, 1).getContext('2d');
    probe.fillStyle = '#000';
    probe.fillStyle = col;
    const r = probe.fillStyle;
    v = r[0] === '#' ? rgb(r) : (r.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
  }
  RGB.set(col, v);
  return v;
}
export function mix(a, b, k) {
  const A = rgb(a);
  const B = rgb(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('')}`;
}
export const rgba = (col, a) => {
  const [r, g, b] = rgb(col);
  return `rgba(${r},${g},${b},${a})`;
};
export const lighten = (col, k) => mix(col, '#ffffff', k);
export const darken = (col, k) => mix(col, '#000000', k);

/* ---------- light ---------- */
// A soft round light: white-hot core fading out through `color`.
export function glowSprite(color, core = 0.22) {
  return sprite(`glow:${color}:${core}`, 128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, rgba(lighten(color, 0.65), 1));
    g.addColorStop(core, rgba(color, 0.6));
    g.addColorStop(0.5, rgba(color, 0.18));
    g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });
}

// Additive glow of radius r at (x, y): one drawImage.
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

// The same light blended normally (bright things on bright skies).
export function softLight(c, x, y, r, color, a = 1) {
  if (a <= 0 || r <= 0) return;
  const ga = c.globalAlpha;
  c.globalAlpha = ga * Math.min(1, a);
  c.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  c.globalAlpha = ga;
}

// A soft dark ellipse: contact shadows under characters and props.
export function shadow(c, x, y, rx, a = 0.3, ry = rx * 0.3) {
  if (a <= 0 || rx <= 0) return;
  const s = sprite('shadow', 64, 32, (k) => {
    const g = k.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(0,0,0,0.85)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.4)');
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

// Soft light rays fanning down from a point (cached), drawn additively.
export function rays(c, x, y, r, color, a = 0.25, turn = 0) {
  const s = sprite(`rays:${color}`, 256, 256, (k) => {
    const g = k.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, rgba(color, 0.9));
    g.addColorStop(0.35, rgba(color, 0.35));
    g.addColorStop(1, rgba(color, 0));
    k.fillStyle = g;
    k.translate(128, 128);
    for (let i = 0; i < 14; i++) {
      const a0 = (i / 14) * Math.PI * 2;
      const w = 0.06 + hash(i) * 0.1;
      k.beginPath();
      k.moveTo(0, 0);
      k.arc(0, 0, 128, a0 - w, a0 + w);
      k.closePath();
      k.fill();
    }
  });
  const op = c.globalCompositeOperation;
  const ga = c.globalAlpha;
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = ga * a;
  c.save();
  c.translate(x, y);
  c.rotate(turn);
  c.drawImage(s, -r, -r, r * 2, r * 2);
  c.restore();
  c.globalAlpha = ga;
  c.globalCompositeOperation = op;
}

// Darkened corners over the whole frame (strength in steps of 0.05).
export function vignette(c, a = 0.35, color = '#000000') {
  const k = Math.round(a * 20) / 20;
  if (k <= 0) return;
  const s = sprite(`vig:${k}:${color}`, W / 2, H / 2, (v) => {
    v.scale(0.5, 0.5);
    const g = v.createRadialGradient(W / 2, H * 0.48, H * 0.28, W / 2, H / 2, H * 0.72);
    g.addColorStop(0, rgba(color, 0));
    g.addColorStop(0.55, rgba(color, k * 0.35));
    g.addColorStop(1, rgba(color, k));
    v.fillStyle = g;
    v.fillRect(0, 0, W, H);
  });
  c.drawImage(s, 0, 0, W, H);
}

// A vertical fade strip from colour at alpha a0 to a1, drawn stretched.
export function fade(c, x, y, w, h, color, a0, a1) {
  const s = sprite(`fade:${color}:${a0}:${a1}`, 2, 128, (k) => {
    const g = k.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, rgba(color, a0));
    g.addColorStop(1, rgba(color, a1));
    k.fillStyle = g;
    k.fillRect(0, 0, 2, 128);
  });
  c.drawImage(s, x, y, w, h);
}

// A full-frame vertical gradient (cached per colour list).
export function sky(c, stops) {
  const key = stops.join('|');
  const s = sprite(`sky:${key}`, 4, 256, (k) => {
    const g = k.createLinearGradient(0, 0, 0, 256);
    stops.forEach((col, i) => g.addColorStop(i / (stops.length - 1), col));
    k.fillStyle = g;
    k.fillRect(0, 0, 4, 256);
  });
  c.drawImage(s, 0, 0, W, H);
}

/* ---------- particles ---------- */
// Glowing sparks, embers, shards and shockwave rings, drawn additively.
// Pre-allocates a pool so bursts don't allocate in the hot loop.
export class Fx {
  constructor(max = 260) {
    this.pool = Array.from({ length: max }, () => ({ live: false }));
    this.rings = [];
  }
  spawn() {
    for (const p of this.pool) if (!p.live) return p;
    return this.pool[(Math.random() * this.pool.length) | 0];
  }
  // n glowing sparks flying out of (x, y)
  burst(x, y, color, n = 12, speed = 260, { gravity = 500, size = 3, life = 0.6, drag = 2.2, up = 0 } = {}) {
    for (let i = 0; i < n; i++) {
      const p = this.spawn();
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.65);
      p.live = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * v;
      p.vy = Math.sin(a) * v - up;
      p.g = gravity;
      p.drag = drag;
      p.r = size * (0.6 + Math.random() * 0.8);
      p.life = p.max = life * (0.6 + Math.random() * 0.6);
      p.color = color;
      p.streak = true;
    }
  }
  // slow floating motes (dust, pollen, embers)
  mote(x, y, color, { vx = 0, vy = -20, r = 2, life = 2 } = {}) {
    const p = this.spawn();
    p.live = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.g = 0;
    p.drag = 0;
    p.r = r;
    p.life = p.max = life;
    p.color = color;
    p.streak = false;
  }
  // an expanding shockwave ring
  ring(x, y, color, r = 60, life = 0.35, width = 6) {
    this.rings.push({ x, y, color, r, life, max: life, width });
  }
  update(dt) {
    for (const p of this.pool) {
      if (!p.live) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.live = false;
        continue;
      }
      const d = Math.max(0, 1 - p.drag * dt);
      p.vx *= d;
      p.vy = p.vy * d + p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (const r of this.rings) r.life -= dt;
    if (this.rings.length && this.rings.some((r) => r.life <= 0)) this.rings = this.rings.filter((r) => r.life > 0);
  }
  draw(c) {
    const op = c.globalCompositeOperation;
    c.globalCompositeOperation = 'lighter';
    c.lineCap = 'round';
    for (const r of this.rings) {
      const k = 1 - r.life / r.max;
      c.globalAlpha = (1 - k) * 0.9;
      c.strokeStyle = r.color;
      c.lineWidth = r.width * (1 - k) + 1;
      c.beginPath();
      c.arc(r.x, r.y, r.r * (0.25 + k * 0.75), 0, Math.PI * 2);
      c.stroke();
    }
    for (const p of this.pool) {
      if (!p.live) continue;
      const k = p.life / p.max;
      const rad = p.r * (0.5 + k * 0.5);
      c.globalAlpha = Math.min(1, k * 1.6);
      c.drawImage(glowSprite(p.color), p.x - rad * 4, p.y - rad * 4, rad * 8, rad * 8);
      if (p.streak) {
        c.strokeStyle = rgba(p.color, 1);
        c.lineWidth = rad;
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
        c.stroke();
      }
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = op;
  }
}
