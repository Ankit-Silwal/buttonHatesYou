import { ITEM, DEFAULT_LOOK } from '@/economy/catalog';
import { drawButton, rr, text, heart, FONTS } from '@/reason/draw';
import { sprite, glowSprite, glow, softLight, shadow, rgba, mix, lighten, darken, hash } from '@/reason/fx';

// Cached light helpers (offscreen sprites, one drawImage each) for the games.
export { sprite, glowSprite, glow, softLight, shadow, rgba, mix, lighten, darken, hash };

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
  // glossy sheen and a cool rim of bounce light, pre-rendered in the body's shape
  if (!o.flash) {
    const bob = o.moving ? Math.abs(Math.sin((o.t ?? 0) * 14)) * 2 : 0;
    c.drawImage(bodyGloss(), bx - 1, by - bob - 1, bw + 2, 33);
  }
  eyes(c, look.eyes, bx, by, bw, o.facing ?? 1);
  hat(c, look.hat, bx, by, bw);
  c.restore();
}

// The body of drawButton at w=38, h=40 spans 31px (two rounded rects). This
// sprite (drawn over it, 1px margin) holds a glassy top sheen, a soft specular
// streak and a cool rim light along the lower right edge, masked to the body.
function bodyGloss() {
  const K = 4;
  return sprite('adv:bodyGloss', 40 * K, 33 * K, (c) => {
    c.scale(K, K);
    c.translate(1, 1);
    const body = () => {
      c.beginPath();
      c.roundRect(0, 0, 38, 31 * 0.82, 31 * 0.45);
      c.roundRect(0, 31 * 0.25, 38, 31 * 0.75, 31 * 0.42);
    };
    // rim: a thick edge stroke, kept only towards the lower right
    c.save();
    body();
    c.clip();
    c.lineWidth = 3.2;
    c.strokeStyle = 'rgba(205,235,255,0.75)';
    c.beginPath();
    rr(c, 0, 0, 38, 31 * 0.82, 31 * 0.45);
    c.stroke();
    c.beginPath();
    rr(c, 0, 31 * 0.25, 38, 31 * 0.75, 31 * 0.42);
    c.stroke();
    c.globalCompositeOperation = 'destination-in';
    const m = c.createLinearGradient(6, 2, 34, 31);
    m.addColorStop(0, 'rgba(0,0,0,0)');
    m.addColorStop(0.55, 'rgba(0,0,0,0)');
    m.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = m;
    c.fillRect(-2, -2, 42, 36);
    c.restore();
    // glassy sheen over the upper face, fading down
    c.save();
    body();
    c.clip();
    c.globalCompositeOperation = 'source-over';
    const s = c.createLinearGradient(0, 0, 0, 12);
    s.addColorStop(0, 'rgba(255,255,255,0.34)');
    s.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = s;
    c.beginPath();
    c.ellipse(19, 2, 17, 9, 0, 0, Math.PI * 2);
    c.fill();
    // a crisp specular streak top left
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.beginPath();
    c.ellipse(9.5, 6.5, 4.6, 1.6, -0.75, 0, Math.PI * 2);
    c.fill();
    // a touch of occlusion at the very bottom
    const b = c.createLinearGradient(0, 24, 0, 31);
    b.addColorStop(0, 'rgba(20,0,30,0)');
    b.addColorStop(1, 'rgba(20,0,30,0.22)');
    c.fillStyle = b;
    c.fillRect(0, 24, 38, 8);
    c.restore();
  });
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
  c.font = `700 ${size}px ${FONTS()}`;
  const tw = c.measureText(str).width;
  const w = tw + 20;
  const h = size + 14;
  const bx = clamp(x - w / 2, 6, W - w - 6);
  const by = y - h - 10;
  // a soft cached drop shadow, then the bubble with its tail as one shape
  shadow(c, bx + w / 2, by + h + 4, w * 0.55, 0.22, 7);
  const tx = clamp(x, bx + 12, bx + w - 12);
  c.beginPath();
  c.roundRect(bx, by, w, h, 11);
  c.moveTo(tx - 7, by + h - 1);
  c.lineTo(x, y);
  c.lineTo(tx + 7, by + h - 1);
  c.fillStyle = bg;
  c.fill();
  c.lineWidth = 1.5;
  c.strokeStyle = 'rgba(40,20,50,0.14)';
  c.beginPath();
  c.roundRect(bx + 0.75, by + 0.75, w - 1.5, h - 1.5, 10.5);
  c.stroke();
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

// Little bursts of glowing sparks for hits, pops and pickups: each spark is a
// motion-streaked core with a soft cached halo, and a burst opens with a quick
// shockwave ring.
export class Sparks {
  list = [];
  burst(x, y, color, n = 10, speed = 220) {
    if (n >= 5) this.list.push({ x, y, vx: 0, vy: 0, life: 0.32, max: 0.32, color, ring: 10 + speed * 0.12 });
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.6);
      const life = 0.5 + Math.random() * 0.3;
      this.list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, color, r: 2 + Math.random() * 3 });
    }
  }
  // A number or word that floats up and fades.
  float(x, y, str, color = '#fff') {
    this.list.push({ x, y, vx: 0, vy: -70, life: 0.9, max: 0.9, color, str });
  }
  update(dt) {
    let n = 0;
    for (const p of this.list) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.str) p.vy *= 1 - Math.min(1, dt * 2.2); // eases to a stop
      else if (!p.ring) {
        p.vy += 400 * dt;
        p.vx *= 1 - Math.min(1, dt * 1.5);
      }
      p.life -= dt;
      if (p.life > 0) this.list[n++] = p;
    }
    this.list.length = n;
  }
  draw(c) {
    c.lineCap = 'round';
    for (const p of this.list) {
      const k = p.life / (p.max ?? 0.8);
      const a = clamp(p.life * 2, 0, 1);
      if (p.str) {
        // pops in big, settles, then fades
        const age = (p.max ?? 0.9) - p.life;
        const s = age < 0.12 ? 1.5 - age * 4.2 : 1;
        c.globalAlpha = a;
        c.font = `700 ${Math.round(20 * s)}px ${FONTS()}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.lineJoin = 'round';
        c.lineWidth = 5;
        c.strokeStyle = 'rgba(30,14,40,0.38)';
        c.strokeText(p.str, p.x, p.y + 1.5);
        c.fillStyle = p.color;
        c.fillText(p.str, p.x, p.y);
      } else if (p.ring) {
        const r = p.ring * (1 - k * k) + 4;
        c.globalAlpha = k * 0.85;
        c.strokeStyle = p.color;
        c.lineWidth = 1 + k * 5;
        c.beginPath();
        c.arc(p.x, p.y, r, 0, Math.PI * 2);
        c.stroke();
      } else {
        c.globalAlpha = a * 0.6;
        const g = p.r * 4;
        c.drawImage(glowSprite(p.color), p.x - g, p.y - g, g * 2, g * 2);
        c.globalAlpha = a;
        c.strokeStyle = p.color;
        c.lineWidth = p.r * (0.6 + 0.6 * k) * 1.6;
        c.beginPath();
        c.moveTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
        c.lineTo(p.x, p.y);
        c.stroke();
        if (k > 0.55) {
          c.fillStyle = '#ffffff';
          c.globalAlpha = (k - 0.55) * 2;
          c.beginPath();
          c.arc(p.x, p.y, p.r * 0.45, 0, Math.PI * 2);
          c.fill();
        }
      }
    }
    c.globalAlpha = 1;
  }
}

// A soft radial vignette over the whole 480x800 frame (cached per strength
// and colour).
export function vignette(c, a = 0.35, color = '#000000') {
  const v = sprite(`adv:vig:${a}:${color}`, W / 2, H / 2, (k) => {
    k.scale(0.5, 0.5);
    const g = k.createRadialGradient(W / 2, H * 0.45, H * 0.28, W / 2, H / 2, H * 0.72);
    g.addColorStop(0, rgba(color, 0));
    g.addColorStop(0.6, rgba(color, a * 0.4));
    g.addColorStop(1, rgba(color, a));
    k.fillStyle = g;
    k.fillRect(0, 0, W, H);
  });
  c.drawImage(v, 0, 0, W, H);
}

// Draws a horizontally tiling image across the frame, scrolled left by `off`.
export function scrollTile(c, img, off, y, h = img.height) {
  const iw = img.width;
  for (let x = -(((off % iw) + iw) % iw); x < W; x += iw) c.drawImage(img, Math.round(x), y, iw, h);
}

// A cached full-frame painting: make(ctx) draws it once at `res` scale.
export function layer(key, make, res = 1) {
  return sprite(`adv:layer:${key}`, W * res, H * res, (k) => {
    k.scale(res, res);
    make(k);
  });
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
  // a soft dark halo behind the number keeps it readable on any sky
  c.globalAlpha = 0.12;
  c.drawImage(glowSprite('#1a0b24', 0.05), W / 2 - 90, 52, 180, 80);
  c.globalAlpha = 1;
  c.lineJoin = 'round';
  c.font = `700 46px ${FONTS()}`;
  c.lineWidth = 6;
  c.strokeStyle = 'rgba(30,14,40,0.28)';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.strokeText(String(score), W / 2, 95);
  text(c, String(score), W / 2, 92, { size: 46, color: '#fff', weight: 700 });
  if (sub) {
    c.font = `600 15px ${FONTS()}`;
    c.lineWidth = 4;
    c.strokeText(sub, W / 2, 127);
    text(c, sub, W / 2, 126, { size: 15, color: 'rgba(255,255,255,0.92)', weight: 600 });
  }
}
