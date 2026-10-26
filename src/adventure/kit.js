import { ITEM, DEFAULT_LOOK } from '@/economy/catalog';
import { drawButton, rr, text, heart } from '@/reason/draw';

// Shared bits for the Adventure mini-games. Every game is drawn on a fixed
// 480x800 portrait canvas (scaled to fit), with plain canvas shapes only.
export const W = 480;
export const H = 800;

export { rr, text, heart };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

const SCARVES = { red: '#d8433a', sage: '#8fb08a', striped: '#efe6d2', rainbow: '#f39ac0' };

// The outfit the player bought, as plain values a canvas can use.
export function lookOf(equipped = DEFAULT_LOOK) {
  const get = (slot) => (ITEM[equipped?.[slot]] ?? ITEM[DEFAULT_LOOK[slot]]).look;
  const color = get('color');
  return { color: color.c, dark: color.cd, eyes: get('eyes'), ears: get('ears'), scarf: get('scarf'), hat: get('hat') };
}

// The button, centered on (x, y), `size` wide, wearing `look`.
// o: { look, mood, t, flash, angle, squash, moving, tears, alpha, facing }
export function drawBobby(c, x, y, size, o = {}) {
  const look = o.look ?? lookOf();
  c.save();
  c.translate(x, y);
  if (o.angle) c.rotate(o.angle);
  if (o.squash) c.scale(1 + o.squash, 1 - o.squash);
  const s = size / 38; // the reason drawing is tuned for a 38px button
  c.scale(s, s);
  const bw = 38;
  const bh = 40;
  const bx = -bw / 2;
  const by = -bh / 2;

  if (o.alpha != null) c.globalAlpha = o.alpha;
  ears(c, look.ears, bx, by, bw, look);
  drawButton(c, {
    x: bx,
    y: by,
    w: bw,
    h: bh,
    color: look.color,
    dark: look.dark,
    mood: o.mood ?? 'calm',
    t: o.t ?? 0,
    flash: o.flash,
    moving: o.moving,
    tears: o.tears,
    facing: o.facing ?? 1,
    scarf: look.scarf ? SCARVES[look.scarf] : null,
  });
  eyes(c, look.eyes, bx, by, bw, o.facing ?? 1);
  hat(c, look.hat, bx, by, bw);
  c.restore();
}

function ears(c, kind, x, y, w, look) {
  if (!kind) return;
  c.fillStyle = kind === 'devil' ? '#b3202a' : look.dark;
  for (const side of [-1, 1]) {
    const ex = x + w / 2 + side * w * 0.3;
    c.beginPath();
    if (kind === 'bear') c.arc(ex, y + 4, 6, 0, Math.PI * 2);
    else if (kind === 'cat' || kind === 'devil') {
      c.moveTo(ex - 6, y + 6);
      c.lineTo(ex + side * 2, y - (kind === 'devil' ? 9 : 7));
      c.lineTo(ex + 6, y + 6);
    } else if (kind === 'bunny') c.ellipse(ex, y - 8, 4, 12, side * 0.15, 0, Math.PI * 2);
    c.fill();
  }
}

function eyes(c, kind, x, y, w, f) {
  if (!kind || kind === 'sleepy' || kind === 'googly') return;
  const cx = x + w / 2 + f * w * 0.08;
  const ey = y + 40 * 0.32 + 1;
  if (kind === 'shades') {
    c.fillStyle = '#16141c';
    rr(c, cx - 13, ey - 4, 11, 7, 2);
    c.fill();
    rr(c, cx + 2, ey - 4, 11, 7, 2);
    c.fill();
    c.fillRect(cx - 2, ey - 2, 4, 1.5);
  } else if (kind === 'hearts') {
    heart(c, cx - 7, ey, 3.4, '#ff4f7b');
    heart(c, cx + 7, ey, 3.4, '#ff4f7b');
  } else if (kind === 'stars') {
    c.fillStyle = '#ffd84d';
    for (const side of [-1, 1]) star(c, cx + side * 7, ey, 4);
  }
}

function star(c, x, y, r) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r * 0.45 : r;
    c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  c.fill();
}

function hat(c, kind, x, y, w) {
  if (!kind) return;
  const cx = x + w / 2;
  if (kind === 'beanie') {
    c.fillStyle = '#5b9bd5';
    c.beginPath();
    c.arc(cx, y + 6, 13, Math.PI, 0);
    c.fill();
    c.fillStyle = '#3b77ad';
    c.fillRect(cx - 14, y + 3, 28, 5);
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(cx, y - 8, 3.5, 0, Math.PI * 2);
    c.fill();
  } else if (kind === 'party') {
    c.fillStyle = '#a58bd6';
    c.beginPath();
    c.moveTo(cx - 9, y + 4);
    c.lineTo(cx + 2, y - 18);
    c.lineTo(cx + 11, y + 4);
    c.fill();
    c.fillStyle = '#ffd84d';
    c.beginPath();
    c.arc(cx + 2, y - 18, 3, 0, Math.PI * 2);
    c.fill();
  } else if (kind === 'top') {
    c.fillStyle = '#1f1c26';
    c.fillRect(cx - 14, y + 1, 28, 4);
    c.fillRect(cx - 9, y - 16, 18, 18);
    c.fillStyle = '#c0392b';
    c.fillRect(cx - 9, y - 4, 18, 3);
  } else if (kind === 'crown') {
    c.fillStyle = '#f2c14e';
    c.beginPath();
    c.moveTo(cx - 11, y + 4);
    c.lineTo(cx - 11, y - 8);
    c.lineTo(cx - 5, y - 2);
    c.lineTo(cx, y - 11);
    c.lineTo(cx + 5, y - 2);
    c.lineTo(cx + 11, y - 8);
    c.lineTo(cx + 11, y + 4);
    c.fill();
  }
}

// A speech bubble whose tail points down at (x, y).
export function bubble(c, x, y, str, { size = 15, bg = '#fff', color = '#2b1d17' } = {}) {
  c.font = `700 ${size}px "Fredoka", system-ui, sans-serif`;
  const tw = c.measureText(str).width;
  const w = tw + 20;
  const h = size + 14;
  const bx = clamp(x - w / 2, 6, W - w - 6);
  const by = y - h - 10;
  c.fillStyle = bg;
  rr(c, bx, by, w, h, 10);
  c.fill();
  c.beginPath();
  c.moveTo(clamp(x, bx + 12, bx + w - 12) - 6, by + h - 1);
  c.lineTo(x, y);
  c.lineTo(clamp(x, bx + 12, bx + w - 12) + 6, by + h - 1);
  c.fill();
  text(c, str, bx + w / 2, by + h / 2 + 1, { size, color });
}

// Something the button says now and then: call `.say(text, sec)`, `.update(dt)`,
// then `.draw(c, x, y)` above its head.
export class Mouth {
  line = null;
  left = 0;
  say(str, sec = 1.8) {
    this.line = str;
    this.left = sec;
  }
  // Says one of `lines`, but not too often.
  maybe(lines, chance = 0.35, sec) {
    if (this.left <= 0 && Math.random() < chance) this.say(pick(lines), sec);
  }
  update(dt) {
    this.left -= dt;
    if (this.left <= 0) this.line = null;
  }
  draw(c, x, y) {
    if (this.line) bubble(c, x, y, this.line);
  }
}

// Little bursts of dots for hits, pops and pickups.
export class Sparks {
  list = [];
  burst(x, y, color, n = 10, speed = 220) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.6);
      this.list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.3, color, r: 2 + Math.random() * 3 });
    }
  }
  // A number or word that floats up and fades.
  float(x, y, str, color = '#fff') {
    this.list.push({ x, y, vx: 0, vy: -70, life: 0.9, color, str });
  }
  update(dt) {
    for (const p of this.list) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (!p.str) p.vy += 400 * dt;
      p.life -= dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
  }
  draw(c) {
    for (const p of this.list) {
      c.globalAlpha = clamp(p.life * 2, 0, 1);
      if (p.str) text(c, p.str, p.x, p.y, { size: 20, color: p.color });
      else {
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.globalAlpha = 1;
  }
}

// A vertical gradient filling the whole canvas.
export function backdrop(c, top, bottom) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
}

// Score in the top middle, under the shell's buttons.
export function drawScore(c, score, sub) {
  text(c, String(score), W / 2, 92, { size: 46, color: '#fff', weight: 700 });
  if (sub) text(c, sub, W / 2, 126, { size: 15, color: 'rgba(255,255,255,0.85)', weight: 600 });
}
