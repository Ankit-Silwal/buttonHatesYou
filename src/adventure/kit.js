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
  // the outfit slot may be missing from older saves or defaults: never throw
  const outfit = (ITEM[equipped?.outfit] ?? ITEM[DEFAULT_LOOK?.outfit])?.look ?? null;
  return { color: color.c, dark: color.cd, eyes: get('eyes'), ears: get('ears'), scarf: get('scarf'), hat: get('hat'), outfit };
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
  const clothed = !!OUTFITS[look.outfit];
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
    // with clothes on, the plain scarf is redrawn over them instead
    scarf: look.scarf && !clothed ? SCARVES[look.scarf] : null,
  });
  const f = o.facing ?? 1;
  try {
    outfit(c, look.outfit, bx, by, bw);
    if (clothed && look.scarf && SCARVES[look.scarf]) {
      c.fillStyle = SCARVES[look.scarf];
      c.fillRect(bx + 2, by + 40 * 0.68 - 0.6, bw - 4, 5);
    }
  } catch {}
  // glossy sheen and a cool rim of bounce light, pre-rendered in the body's shape
  if (!o.flash) {
    const bob = o.moving ? Math.abs(Math.sin((o.t ?? 0) * 14)) * 2 : 0;
    c.drawImage(bodyGloss(), bx - 1, by - bob - 1, bw + 2, 33);
  }
  try {
    neckItem(c, look.scarf, bx, by, bw);
    browLids(c, look.eyes, o.mood ?? 'calm', bx, by, bw, f);
    eyes(c, look.eyes, bx, by, bw, f, look);
    gear(c, look.ears, bx, by, bw);
    hat(c, look.hat, bx, by, bw);
  } catch {}
  c.restore();
}

// ---- clothes ---------------------------------------------------------------

// The body's silhouette (two overlapping rounded rects, as in bodyGloss).
function bodyPath(c, x, y) {
  c.beginPath();
  c.roundRect(x, y, 38, 31 * 0.82, 31 * 0.45);
  c.roundRect(x, y + 31 * 0.25, 38, 31 * 0.75, 31 * 0.42);
}

// The garment's shape: a curved neckline (high at the sides, low in the middle,
// so the mouth stays clear) down past the bottom of the body.
function clothPath(c, x, y, dip = 24) {
  c.beginPath();
  c.moveTo(x - 2, y + 19);
  c.quadraticCurveTo(x + 19, y + 2 * dip - 19, x + 40, y + 19);
  c.lineTo(x + 40, y + 36);
  c.lineTo(x - 2, y + 36);
  c.closePath();
}

// Lays the garment's base colour with a little depth, inside the body.
function cloth(c, x, y, fill, dip) {
  clothPath(c, x, y, dip);
  c.fillStyle = fill;
  c.fill();
  const g = c.createLinearGradient(0, y + 20, 0, y + 31);
  g.addColorStop(0, 'rgba(255,255,255,0.07)');
  g.addColorStop(1, 'rgba(10,0,20,0.28)');
  c.fillStyle = g;
  c.fill();
}

// stroke along the neckline
function neckline(c, x, y, color, lw, dip = 24) {
  c.strokeStyle = color;
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - 2, y + 19);
  c.quadraticCurveTo(x + 19, y + 2 * dip - 19, x + 40, y + 19);
  c.stroke();
}

const OUTFITS = {
  tee(c, x, y) {
    const cx = x + 19;
    cloth(c, x, y, '#2e3140');
    neckline(c, x, y, '#454a5c', 1.8);
    c.fillStyle = '#e3b95a';
    c.beginPath();
    c.moveTo(cx + 1.6, y + 25.6);
    c.lineTo(cx - 2.4, y + 29);
    c.lineTo(cx - 0.2, y + 29);
    c.lineTo(cx - 1.4, y + 32);
    c.lineTo(cx + 2.8, y + 28.2);
    c.lineTo(cx + 0.6, y + 28.2);
    c.closePath();
    c.fill();
  },
  hoodie(c, x, y) {
    const cx = x + 19;
    cloth(c, x, y, '#6a6e86');
    // the hood, bunched behind the neck
    neckline(c, x, y, '#575b72', 3.4);
    neckline(c, x, y - 0.5, 'rgba(255,255,255,0.14)', 1);
    // front pouch
    c.fillStyle = 'rgba(30,25,50,0.22)';
    rr(c, cx - 8, y + 27, 16, 6, 2);
    c.fill();
    c.strokeStyle = 'rgba(30,25,50,0.35)';
    c.lineWidth = 0.8;
    c.stroke();
    // drawstrings
    c.strokeStyle = '#ece8dd';
    c.lineWidth = 0.9;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(cx + s * 3.2, y + 22.6);
      c.lineTo(cx + s * 3.6, y + 27.4);
      c.stroke();
      c.fillStyle = '#ece8dd';
      c.beginPath();
      c.arc(cx + s * 3.6, y + 28, 0.8, 0, Math.PI * 2);
      c.fill();
    }
  },
  track(c, x, y) {
    const cx = x + 19;
    cloth(c, x, y, '#2d4a74');
    c.fillStyle = '#e9e4d6';
    c.fillRect(x + 5, y + 18, 1.8, 18);
    c.fillRect(x + 31.2, y + 18, 1.8, 18);
    c.fillStyle = '#d3694a';
    c.fillRect(x + 7.2, y + 18, 0.9, 18);
    c.fillRect(x + 29.9, y + 18, 0.9, 18);
    neckline(c, x, y, '#1f3556', 2.4);
    c.strokeStyle = 'rgba(235,235,245,0.75)';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(cx, y + 24);
    c.lineTo(cx, y + 34);
    c.stroke();
  },
  denim(c, x, y) {
    const cx = x + 19;
    cloth(c, x, y, '#4c6f99');
    c.strokeStyle = 'rgba(235,205,140,0.8)';
    c.lineWidth = 0.7;
    c.setLineDash([1.6, 1.2]);
    c.beginPath();
    c.moveTo(cx, y + 24);
    c.lineTo(cx, y + 34);
    c.stroke();
    for (const s of [-1, 1]) {
      c.fillStyle = 'rgba(20,35,60,0.2)';
      rr(c, cx + s * 8 - 3.2, y + 26.4, 6.4, 5, 1);
      c.fill();
      c.stroke();
    }
    c.setLineDash([]);
    // collar points
    c.fillStyle = '#3a5a82';
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(cx + s * 11, y + 19.6);
      c.lineTo(cx + s * 2, y + 24.2);
      c.lineTo(cx + s * 3.4, y + 28);
      c.lineTo(cx + s * 9, y + 23);
      c.closePath();
      c.fill();
    }
  },
  varsity(c, x, y) {
    const cx = x + 19;
    cloth(c, x, y, '#7a3040');
    neckline(c, x, y, '#ece3cf', 2.6);
    neckline(c, x, y + 2.6, '#7a3040', 1);
    neckline(c, x, y + 3.6, '#ece3cf', 1.2);
    c.fillStyle = '#ece3cf';
    c.beginPath();
    c.arc(cx - 8, y + 28, 3.6, 0, Math.PI * 2);
    c.fill();
    text(c, 'B', cx - 8, y + 28.4, { size: 6.2, color: '#7a3040', weight: 800 });
    c.fillStyle = '#ece3cf';
    c.fillRect(x, y + 33.3, 38, 1.4);
  },
  blazer(c, x, y) {
    const cx = x + 19;
    cloth(c, x, y, '#363942');
    // white shirt in the V
    c.fillStyle = '#f0eee8';
    c.beginPath();
    c.moveTo(cx - 5.5, y + 20.4);
    c.lineTo(cx + 5.5, y + 20.4);
    c.lineTo(cx, y + 31);
    c.closePath();
    c.fill();
    // lapels
    c.fillStyle = '#4a4d58';
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(cx + s * 11, y + 19.4);
      c.lineTo(cx + s * 5, y + 20.2);
      c.lineTo(cx + s * 0.4, y + 30);
      c.lineTo(cx + s * 6, y + 28);
      c.closePath();
      c.fill();
    }
    c.fillStyle = '#16171c';
    c.beginPath();
    c.arc(cx + 2, y + 31, 0.9, 0, Math.PI * 2);
    c.fill();
  },
  leather(c, x, y) {
    const cx = x + 19;
    cloth(c, x, y, '#1b1a20');
    // collar flaps
    c.fillStyle = '#2b2a33';
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(cx + s * 11, y + 19.4);
      c.lineTo(cx + s * 2.4, y + 22.6);
      c.lineTo(cx + s * 5.4, y + 27);
      c.lineTo(cx + s * 10, y + 23);
      c.closePath();
      c.fill();
    }
    // asymmetric zip
    c.strokeStyle = '#b9bcc6';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(cx - 0.6, y + 24.6);
    c.lineTo(cx + 5, y + 34);
    c.stroke();
    // shine
    c.fillStyle = 'rgba(255,255,255,0.16)';
    c.beginPath();
    c.ellipse(cx - 9, y + 27.5, 1.6, 4.5, 0.35, 0, Math.PI * 2);
    c.fill();
  },
  puffer(c, x, y) {
    const cx = x + 19;
    cloth(c, x, y, '#3d7a74');
    // quilted baffles
    c.lineWidth = 0.9;
    for (const by of [26, 29.2, 32.4]) {
      c.strokeStyle = 'rgba(10,30,30,0.35)';
      c.beginPath();
      c.moveTo(x - 1, y + by);
      c.quadraticCurveTo(cx, y + by + 1.4, x + 39, y + by);
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.14)';
      c.beginPath();
      c.moveTo(x - 1, y + by - 1.1);
      c.quadraticCurveTo(cx, y + by + 0.3, x + 39, y + by - 1.1);
      c.stroke();
    }
    // high collar
    neckline(c, x, y, '#2f625d', 4);
    neckline(c, x, y - 0.8, 'rgba(255,255,255,0.18)', 1.1);
  },
};

function outfit(c, kind, x, y) {
  const draw = OUTFITS[kind];
  if (!draw) return;
  c.save();
  bodyPath(c, x, y);
  c.clip();
  draw(c, x, y);
  c.restore();
}

// ---- neck items --------------------------------------------------------------

function neckItem(c, kind, x, y, w) {
  const cx = x + w / 2;
  if (kind === 'lanyard') {
    c.strokeStyle = '#c24f4f';
    c.lineWidth = 1.5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx - 8, y + 19.6);
    c.lineTo(cx - 0.8, y + 26);
    c.moveTo(cx + 8, y + 19.6);
    c.lineTo(cx + 0.8, y + 26);
    c.stroke();
    c.fillStyle = '#f4f1ea';
    rr(c, cx - 3.6, y + 25.6, 7.2, 8, 1.2);
    c.fill();
    c.strokeStyle = 'rgba(30,20,40,0.35)';
    c.lineWidth = 0.6;
    c.stroke();
    c.fillStyle = '#7d8fb0';
    c.beginPath();
    c.arc(cx, y + 28.6, 1.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#c24f4f';
    c.fillRect(cx - 2.6, y + 31.2, 5.2, 0.9);
  } else if (kind === 'bandana') {
    c.fillStyle = '#b0413e';
    c.beginPath();
    c.moveTo(x + 4, y + 20.6);
    c.quadraticCurveTo(cx, y + 24, x + w - 4, y + 20.6);
    c.lineTo(cx + 0.6, y + 31);
    c.lineTo(cx - 0.6, y + 31);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)';
    for (const [dx, dy] of [[-4, 22.8], [0, 25.6], [4, 22.8], [0, 29]]) {
      c.beginPath();
      c.arc(cx + dx, y + dy, 0.8, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#8f302f';
    c.fillRect(x + 4, y + 19.8, w - 8, 1.6);
  } else if (kind === 'chain') {
    c.strokeStyle = '#e0b954';
    c.lineWidth = 0.9;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx - 8, y + 20);
    c.quadraticCurveTo(cx, y + 30.5, cx + 8, y + 20);
    c.stroke();
    c.fillStyle = '#f2cf6a';
    c.beginPath();
    c.arc(cx, y + 26, 1.9, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.fillRect(cx - 0.9, y + 25, 0.8, 0.8);
  }
}

// A faint heavier upper lid and brows for the calm/smug moods: very subtle,
// and only over plain eyes.
function browLids(c, kind, mood, x, y, w, f) {
  if (mood !== 'calm' && mood !== 'smug') return;
  if (kind && kind !== 'glasses') return;
  const cx = x + w / 2 + f * w * 0.08;
  const ey = y + 31 * 0.42;
  for (const side of [-1, 1]) {
    const px = cx + side * 7;
    c.save();
    c.beginPath();
    c.ellipse(px, ey, 4.2, 5, 0, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = 'rgba(40,20,40,0.16)';
    c.fillRect(px - 5, ey - 5.5, 10, 2.8);
    c.restore();
    c.strokeStyle = 'rgba(43,29,23,0.3)';
    c.lineWidth = 1.1;
    c.lineCap = 'round';
    c.beginPath();
    const drop = mood === 'smug' ? 0.8 : 0;
    c.moveTo(px - side * 3.6, ey - 7.2 + drop);
    c.quadraticCurveTo(px, ey - 8.4, px + side * 3.6, ey - 7 - drop);
    c.stroke();
  }
}

// Over-ear and in-ear audio gear, drawn after the body (the animal ears
// are drawn before it, by ears()).
function gear(c, kind, x, y, w) {
  if (kind === 'earbuds') {
    for (const s of [-1, 1]) {
      const ex = x + w / 2 + s * (w / 2 - 0.4);
      c.strokeStyle = 'rgba(245,245,250,0.7)';
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(ex, y + 17);
      c.quadraticCurveTo(ex + s * 1.5, y + 24, ex + s * 0.5, y + 30);
      c.stroke();
      c.fillStyle = '#f6f6fa';
      c.beginPath();
      c.ellipse(ex, y + 15.5, 1.7, 2.5, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(60,50,80,0.4)';
      c.lineWidth = 0.5;
      c.stroke();
    }
  } else if (kind === 'headphones') {
    const cx = x + w / 2;
    c.lineCap = 'round';
    c.strokeStyle = '#25242d';
    c.lineWidth = 2.8;
    c.beginPath();
    c.ellipse(cx, y + 13, w / 2 + 2, 16, 0, Math.PI, Math.PI * 2);
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.18)';
    c.lineWidth = 0.9;
    c.beginPath();
    c.ellipse(cx, y + 12.4, w / 2 + 2, 15.6, 0, Math.PI * 1.15, Math.PI * 1.6);
    c.stroke();
    for (const s of [-1, 1]) {
      const ex = cx + s * (w / 2 + 1.5);
      c.fillStyle = '#2d2c38';
      rr(c, ex - 3.4, y + 8.5, 6.8, 11, 3);
      c.fill();
      c.fillStyle = '#d9574d';
      rr(c, ex - 1.4 - s * 0.9, y + 11, 2.6, 6, 1.2);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.16)';
      rr(c, ex - 2.6, y + 9.2, 2, 3, 1);
      c.fill();
    }
  }
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
  if (!kind || kind === 'earbuds' || kind === 'headphones') return;
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

function eyes(c, kind, x, y, w, f, look) {
  if (!kind || kind === 'sleepy' || kind === 'googly') return;
  const cx = x + w / 2 + f * w * 0.08;
  const ey = y + 40 * 0.32 + 1;
  if (kind === 'chill') {
    // relaxed half-lids: skin-coloured lids over the top of each eye
    const e0 = y + 31 * 0.42;
    for (const side of [-1, 1]) {
      const px = cx + side * 7;
      c.fillStyle = look?.color ?? '#ffffff';
      c.beginPath();
      c.ellipse(px, e0, 4.8, 5.6, 0, Math.PI, Math.PI * 2);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(43,29,23,0.85)';
      c.lineWidth = 1.2;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(px - 4.4, e0 - 0.4);
      c.lineTo(px + 4.4, e0 - 0.4);
      c.stroke();
    }
  } else if (kind === 'glasses') {
    const e0 = y + 31 * 0.42;
    c.strokeStyle = '#3b3a45';
    c.lineWidth = 0.9;
    for (const side of [-1, 1]) {
      const px = cx + side * 7;
      c.fillStyle = 'rgba(200,230,255,0.12)';
      c.beginPath();
      c.arc(px, e0, 5.8, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(px + side * 5.8, e0 - 0.5);
      c.lineTo(px + side * 9, e0 - 1.2);
      c.stroke();
    }
    c.beginPath();
    c.arc(cx, e0 - 2.4, 2.6, Math.PI * 1.15, Math.PI * 1.85);
    c.stroke();
  } else if (kind === 'aviators') {
    const e0 = y + 31 * 0.42;
    for (const side of [-1, 1]) {
      const px = cx + side * 7.2;
      c.beginPath();
      c.moveTo(px - 5.8, e0 - 4);
      c.lineTo(px + 5.8, e0 - 4);
      c.bezierCurveTo(px + 6.4, e0 + 2, px + 3.4, e0 + 6, px, e0 + 6);
      c.bezierCurveTo(px - 3.4, e0 + 6, px - 6.4, e0 + 2, px - 5.8, e0 - 4);
      c.closePath();
      c.fillStyle = 'rgba(24,22,30,0.92)';
      c.fill();
      c.strokeStyle = '#d9b24f';
      c.lineWidth = 0.9;
      c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.28)';
      c.beginPath();
      c.ellipse(px - side * 1.5, e0 - 1.6, 2, 0.8, -0.5, 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = '#d9b24f';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(cx - 1.6, e0 - 3.4);
    c.lineTo(cx + 1.6, e0 - 3.4);
    c.stroke();
  } else if (kind === 'visor') {
    const e0 = y + 31 * 0.42;
    c.save();
    c.globalAlpha *= 0.45;
    c.drawImage(glowSprite('#4fe3ff'), cx - 22, e0 - 15, 44, 30);
    c.restore();
    c.fillStyle = '#15131d';
    rr(c, cx - 16, e0 - 4.8, 32, 9.6, 4.6);
    c.fill();
    const g = c.createLinearGradient(cx - 14, 0, cx + 14, 0);
    g.addColorStop(0, '#46e6ff');
    g.addColorStop(0.55, '#7f8cff');
    g.addColorStop(1, '#ff4fd0');
    c.fillStyle = g;
    rr(c, cx - 14, e0 - 2.6, 28, 5.2, 2.6);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.65)';
    rr(c, cx - 11, e0 - 1.9, 12, 1.3, 0.65);
    c.fill();
  } else if (kind === 'shades') {
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
  } else if (kind === 'headband') {
    c.save();
    bodyPath(c, x, y);
    c.clip();
    c.beginPath();
    c.moveTo(x - 1, y + 6);
    c.quadraticCurveTo(cx, y - 1.5, x + 39, y + 6);
    c.lineTo(x + 39, y + 9.5);
    c.quadraticCurveTo(cx, y + 2, x - 1, y + 9.5);
    c.closePath();
    c.fillStyle = '#c4473f';
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(x - 1, y + 7.4);
    c.quadraticCurveTo(cx, y - 0.1, x + 39, y + 7.4);
    c.stroke();
    c.restore();
  } else if (kind === 'cap') {
    // snapback, brim forward and flat
    c.fillStyle = '#2f4a73';
    c.beginPath();
    c.ellipse(cx, y + 4.5, 16.5, 13.5, 0, Math.PI, Math.PI * 2);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.18)';
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(cx, y - 9);
    c.lineTo(cx, y + 4);
    c.moveTo(cx - 8, y - 6.5);
    c.quadraticCurveTo(cx - 6, y - 1, cx - 7, y + 4);
    c.moveTo(cx + 8, y - 6.5);
    c.quadraticCurveTo(cx + 6, y - 1, cx + 7, y + 4);
    c.stroke();
    c.fillStyle = '#e8e2d2';
    c.beginPath();
    c.arc(cx, y - 9, 1.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#d3694a';
    rr(c, cx - 3.5, y - 3, 7, 4.2, 1);
    c.fill();
    c.fillStyle = '#1f3250';
    c.beginPath();
    c.ellipse(cx, y + 4.2, 19.5, 3.4, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.beginPath();
    c.ellipse(cx, y + 3.4, 17, 1.4, 0, Math.PI, Math.PI * 2);
    c.fill();
  } else if (kind === 'bucket') {
    c.fillStyle = '#8c926c';
    c.beginPath();
    c.moveTo(cx - 12, y + 3);
    c.lineTo(cx - 10, y - 8);
    c.quadraticCurveTo(cx, y - 11.5, cx + 10, y - 8);
    c.lineTo(cx + 12, y + 3);
    c.closePath();
    c.fill();
    c.fillStyle = '#ece3cf';
    c.fillRect(cx - 11.6, y - 1.6, 23.2, 2);
    // the brim droops all the way round
    c.fillStyle = '#767b58';
    c.beginPath();
    c.moveTo(cx - 12.5, y + 1.8);
    c.quadraticCurveTo(cx - 22, y + 2.5, cx - 20.5, y + 7.6);
    c.quadraticCurveTo(cx, y + 3.8, cx + 20.5, y + 7.6);
    c.quadraticCurveTo(cx + 22, y + 2.5, cx + 12.5, y + 1.8);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.18)';
    c.lineWidth = 0.7;
    c.stroke();
  } else if (kind === 'beret') {
    c.save();
    c.translate(cx + 2, y + 0.5);
    c.rotate(-0.2);
    c.fillStyle = '#7a3b52';
    c.beginPath();
    c.ellipse(0, 0, 16.5, 7.4, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.14)';
    c.beginPath();
    c.ellipse(-3, -2.6, 9, 2.6, -0.1, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(30,5,20,0.3)';
    c.lineWidth = 0.9;
    c.beginPath();
    c.ellipse(0, 1.8, 14, 4.6, 0, 0.1, Math.PI - 0.1);
    c.stroke();
    c.fillStyle = '#5e2a3d';
    rr(c, 0.5, -10, 2.4, 3.6, 1);
    c.fill();
    c.restore();
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

// A paid Continue brings the button back: a burst, a floating "Continue!"
// and a grumble. `fx` needs .burst, `words` (optional) .float.
const REVIVED = ['You PAID for this?', 'Diamonds. On me. Why.', 'I was finally free.', 'Round two. Ugh.', 'Back again. Great.'];
export function reviveFx({ fx, words = fx, mouth, sound }, x, y, color = '#ffffff') {
  fx.burst(x, y, '#8fe9ff', 20, 300);
  fx.burst(x, y, color, 10, 200);
  words.float?.(x, y + 36, 'Continue!', '#aef3ff');
  mouth.say(pick(REVIVED), 2.2);
  sound.win?.();
}
// The button blinks while it can't be hit (a few seconds after a Continue).
export const blinkAlpha = (safe, t) => (safe > 0 && Math.floor(t * 12) % 2 ? 0.35 : 1);

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
