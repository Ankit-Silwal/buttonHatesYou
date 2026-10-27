import { W, H, rand, pick, clamp, rr, text, heart, drawBobby, drawScore, bubble, Mouth, Sparks, reviveFx } from '../kit';
import { Fx, sprite, glow, shadow, vignette, hash } from '../fx';

// Slice Spree: fruit and junk are tossed up from the bottom. Swipe across them
// to slice them. Sometimes the button is tossed up too. Do NOT slice it.
const GRAVITY = 900;
const LIVES = 3;
const TRAIL = 0.2; // how long a bit of blade trail stays, in seconds
const COMBO = 3;
const BOBBY = 62;

const KINDS = {
  melon: { r: 40, juice: '#ff5a6e', inner: '#ff4f62' },
  orange: { r: 28, juice: '#ffa53a', inner: '#ffc06a' },
  banana: { r: 30, juice: '#fff2a0', inner: '#fff6c9' },
  key: { r: 28, juice: '#cfd6e2', inner: '#5d6274' },
  duck: { r: 30, juice: '#ffe14d', inner: '#e8b81a' },
};
const NAMES = Object.keys(KINDS);

const TOSSED = ["Don't you DARE.", 'Put me DOWN!', 'Not the face!', 'I bruise easily!', 'Eyes on the fruit!'];
const SAFE = ['Phew.', 'Still in one piece.', 'Missed me. Good.'];
const MISSES = ['Ha. Missed one.', 'Butterfingers.', 'That melon was free.', 'You call that a swipe?'];
const COMBOS = ['Okay, that was a bit cool.', 'Show-off.', 'Calm down, ninja.'];
const IDLE = ['I hate fruit.', 'Swipe faster.', "That duck is mine, by the way.", 'Who throws a keyboard key?'];
const HURT = ['YOU CUT ME?!', 'MY FACE!!', 'I KNEW IT!!', 'BETRAYAL!!'];
const FAIL = ['Three strikes. Bye.', 'Fruit wins.', 'Pathetic.'];

export default function slice({ look, sound }) {
  const items = []; // { kind, x, y, vx, vy, angle, va, r, glyph }
  const halves = []; // { kind, x, y, vx, vy, angle, va, inner, side, glyph }
  const trail = []; // { x, y, life }
  const queue = []; // tosses waiting to happen, { at, bobby }
  const mouth = new Mouth();
  const sparks = new Sparks(); // floating words
  const fx = new Fx();
  const splats = []; // juice left on the board: { x, y, color, angle, size, life }
  const slashes = []; // bright cut lines: { x, y, angle, life }
  let started = false;
  let t = 0;
  let lives = LIVES;
  let held = false;
  let last = null; // the previous pointer position while swiping
  let hits = 0; // slices in the current swipe
  let wave = 0; // seconds until the next wave
  let chat = 4; // seconds until the button feels like talking again
  let hurt = null; // the button, if it got sliced
  let shout = '';
  let flash = 0;

  const flyer = () => items.find((it) => it.kind === 'bobby');

  const toss = (bobby) => {
    const x = rand(70, W - 70);
    const vy = -rand(1000, 1150);
    const apex = -vy / GRAVITY; // seconds until it stops rising
    const kind = bobby ? 'bobby' : pick(NAMES);
    items.push({
      kind,
      x,
      y: H + 40,
      vx: (rand(110, W - 110) - x) / (apex * 1.6),
      vy,
      angle: rand(0, Math.PI * 2),
      va: rand(-3, 3),
      r: bobby ? BOBBY * 0.48 : KINDS[kind].r,
      glyph: pick(['Q', 'W', 'E', 'R', 'Z', 'X', 'A', '?']),
    });
    sound.jump();
    if (bobby) mouth.say(pick(TOSSED), 1.4);
  };

  const nextWave = () => {
    const n = Math.min(1 + Math.floor(g.score / 10) + (Math.random() < 0.4 ? 1 : 0), 6);
    const withBobby = g.score >= 4 && !flyer() && Math.random() < Math.min(0.15 + g.score / 300, 0.35);
    const who = withBobby ? Math.floor(Math.random() * n) : -1;
    let at = 0;
    for (let i = 0; i < n; i++) {
      queue.push({ at, bobby: i === who });
      at += rand(0.12, 0.4);
    }
    wave = at + Math.max(0.8, 2.1 - g.score * 0.022);
  };

  const cutBobby = (it) => {
    g.over = true;
    hurt = it;
    flash = 0.2;
    it.vy = Math.min(it.vy, -320);
    it.va = Math.sign(it.va || 1) * 14;
    shout = pick(HURT);
    mouth.line = null; // the big shout below says it all
    sound.crack();
    sound.hit();
    fx.burst(it.x, it.y, look.color, 30, 380);
    fx.burst(it.x, it.y, '#ffffff', 14, 260, { size: 2 });
    fx.ring(it.x, it.y, '#ff8a7a', 120, 0.5, 10);
  };

  const cut = (it, angle) => {
    items.splice(items.indexOf(it), 1);
    const kind = KINDS[it.kind];
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);
    for (const side of [-1, 1]) {
      halves.push({
        kind: it.kind,
        x: it.x + nx * side * 4,
        y: it.y + ny * side * 4,
        vx: it.vx * 0.6 + nx * side * 130,
        vy: Math.min(it.vy, 0) * 0.4 + ny * side * 130 - 80,
        angle,
        va: side * rand(2, 4),
        inner: it.angle - angle,
        side,
        glyph: it.glyph,
      });
    }
    fx.burst(it.x, it.y, kind.juice, 16, 320, { gravity: 700 });
    fx.burst(it.x, it.y, '#ffffff', 5, 200, { size: 1.6, life: 0.3 });
    if (splats.length > 20) splats.shift();
    splats.push({ x: it.x, y: it.y, color: kind.juice, angle: rand(0, Math.PI * 2), size: it.r * rand(1.6, 2.2), life: 3 });
    slashes.push({ x: it.x, y: it.y, angle, life: 0.22, r: it.r * 1.9 });
    sound.pop();
    g.score++;
    hits++;
  };

  // The blade moved from (ax, ay) to (bx, by): slice whatever it crossed.
  const slash = (ax, ay, bx, by) => {
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 1) return;
    const angle = Math.atan2(by - ay, bx - ax);
    for (const it of [...items]) {
      // distance from the item to the nearest point on the segment
      const k = clamp(((it.x - ax) * (bx - ax) + (it.y - ay) * (by - ay)) / (len * len), 0, 1);
      const d = Math.hypot(ax + (bx - ax) * k - it.x, ay + (by - ay) * k - it.y);
      if (d > it.r * 0.9) continue;
      if (it.kind === 'bobby') {
        cutBobby(it);
        return;
      }
      cut(it, angle);
    }
  };

  // A swipe ended: three or more slices in one go earn a bonus.
  const endSwipe = () => {
    if (hits >= COMBO && !g.over) {
      g.score += hits;
      sparks.float(last ? last.x : W / 2, (last ? last.y : H / 2) - 30, `Combo x${hits}! +${hits}`, '#fff6a8');
      sound.ring();
      mouth.maybe(COMBOS, 0.5);
    }
    hits = 0;
  };

  const lose = (it) => {
    lives--;
    sound.bad();
    sparks.float(clamp(it.x, 40, W - 40), H - 60, '✕', '#ff5a6e');
    if (lives <= 0) {
      g.over = true;
      sound.sob();
      mouth.say(pick(FAIL), 3);
    } else mouth.maybe(MISSES, 0.6);
  };

  const g = {
    score: 0,
    over: false,
    down(x, y) {
      if (g.over) return;
      if (!started) {
        started = true;
        wave = 0.6;
      }
      held = true;
      hits = 0;
      last = { x, y };
      trail.push({ x, y, life: TRAIL });
    },
    move(x, y) {
      if (!held || g.over) return;
      slash(last.x, last.y, x, y);
      last = { x, y };
      trail.push({ x, y, life: TRAIL });
    },
    up() {
      if (!held) return;
      held = false;
      endSwipe();
    },

    // a paid Continue: a life back, everything in the air (the button too)
    // cleared away, and a short breather before the next wave
    revive() {
      g.over = false;
      lives = Math.max(lives, 1);
      for (const it of items) fx.burst(it.x, it.y, '#cfefff', 8, 180);
      items.length = 0;
      queue.length = 0;
      hurt = null;
      shout = '';
      flash = 0;
      held = false;
      hits = 0;
      wave = 1.4;
      reviveFx({ fx, words: sparks, mouth, sound }, W / 2, H / 2, look.color);
    },

    update(dt) {
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
      fx.update(dt);
      for (const sp of splats) sp.life -= dt;
      while (splats.length && splats[0].life <= 0) splats.shift();
      for (const sl of slashes) sl.life -= dt;
      while (slashes.length && slashes[0].life <= 0) slashes.shift();
      flash = Math.max(0, flash - dt);
      for (const p of trail) p.life -= dt;
      while (trail.length && trail[0].life <= 0) trail.shift();

      for (const it of items) {
        it.vy += GRAVITY * dt;
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        it.angle += it.va * dt;
      }
      for (const h of halves) {
        h.vy += GRAVITY * dt;
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        h.angle += h.va * dt;
      }
      for (let i = halves.length - 1; i >= 0; i--) if (halves[i].y > H + 80) halves.splice(i, 1);

      // whatever falls back off the bottom unsliced
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (it.vy < 0 || it.y < H + 60) continue;
        items.splice(i, 1);
        if (g.over) continue;
        if (it.kind === 'bobby') mouth.say(pick(SAFE), 1.4);
        else lose(it);
      }
      if (!started || g.over) return;

      wave -= dt;
      if (wave <= 0) nextWave();
      for (const q of queue) q.at -= dt;
      while (queue.length && queue[0].at <= 0) toss(queue.shift().bobby);

      chat -= dt;
      if (chat <= 0) {
        chat = rand(5, 9);
        mouth.maybe(IDLE, 0.6);
      }
    },

    draw(c) {
      c.drawImage(board(), 0, 0);
      // juice soaks into the board and fades
      for (const sp of splats) {
        c.globalAlpha = clamp(sp.life / 3, 0, 1) * 0.5;
        c.save();
        c.translate(sp.x, sp.y);
        c.rotate(sp.angle);
        c.drawImage(splatSprite(sp.color), -sp.size, -sp.size, sp.size * 2, sp.size * 2);
        c.restore();
      }
      c.globalAlpha = 1;

      // everything in the air casts a soft shadow on the board below
      for (const it of items) shadow(c, it.x + 14, it.y + 26, it.r * 1.05, 0.4, it.r * 0.6);
      for (const h of halves) shadow(c, h.x + 14, h.y + 26, KINDS[h.kind].r * 0.9, 0.3, KINDS[h.kind].r * 0.45);

      for (const h of halves) half(c, h);
      for (const it of items) {
        if (it.kind === 'bobby') {
          const hit = it === hurt;
          drawBobby(c, it.x, it.y, BOBBY, { look, t, angle: it.angle, mood: hit ? 'shout' : 'worried', flash: flash > 0 && hit, tears: hit });
          if (hit) plaster(c, it.x, it.y, it.angle);
        } else {
          c.save();
          c.translate(it.x, it.y);
          c.rotate(it.angle);
          drawItem(c, it.kind, it.glyph);
          c.restore();
        }
      }

      // the blade trail: a glowing ribbon, thick and bright at the tip
      c.lineCap = 'round';
      c.lineJoin = 'round';
      const op = c.globalCompositeOperation;
      c.globalCompositeOperation = 'lighter';
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1];
        const b = trail[i];
        const k = clamp(b.life / TRAIL, 0, 1);
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.strokeStyle = `rgba(80,170,255,${0.22 * k})`;
        c.lineWidth = 6 + 22 * k;
        c.stroke();
        c.strokeStyle = `rgba(170,225,255,${0.5 * k})`;
        c.lineWidth = 3 + 9 * k;
        c.stroke();
        c.strokeStyle = `rgba(255,255,255,${k})`;
        c.lineWidth = 1 + 4 * k;
        c.stroke();
      }
      const tip = trail[trail.length - 1];
      if (tip && held) glow(c, tip.x, tip.y, 26, '#9fd8ff', clamp(tip.life / TRAIL, 0, 1));
      // a white-hot line where something was just cut
      for (const sl of slashes) {
        const k = sl.life / 0.22;
        const dx = Math.cos(sl.angle) * sl.r * (1.4 - k * 0.4);
        const dy = Math.sin(sl.angle) * sl.r * (1.4 - k * 0.4);
        c.strokeStyle = `rgba(255,255,255,${k})`;
        c.lineWidth = 2 + 5 * k;
        c.beginPath();
        c.moveTo(sl.x - dx, sl.y - dy);
        c.lineTo(sl.x + dx, sl.y + dy);
        c.stroke();
        glow(c, sl.x, sl.y, sl.r * 1.2, '#ffffff', k * 0.6);
      }
      c.globalCompositeOperation = op;

      fx.draw(c);
      sparks.draw(c);

      // the button peeks up from the corner, unless it is the one in the air
      const up = flyer();
      if (up) mouth.draw(c, up.x, up.y - BOBBY * 0.6);
      else if (!hurt) {
        const mood = lives < LIVES && mouth.line ? 'smug' : g.over ? 'happy' : 'calm';
        drawBobby(c, W - 48, H - 24, 64, { look, t, mood, facing: -1 });
        mouth.draw(c, W - 48, H - 64);
      }
      if (hurt) bubble(c, clamp(hurt.x, 60, W - 60), clamp(hurt.y - BOBBY * 0.6, 220, H - 120), shout, { size: 30, bg: '#ffe9e6', color: '#b3202a' });

      for (let i = 0; i < LIVES; i++) {
        if (i < lives) glow(c, W / 2 + (i - 1) * 30, 150, 22, '#ff4f7b', 0.5);
        heart(c, W / 2 + (i - 1) * 30, 150, 10, i < lives ? '#ff4f7b' : 'rgba(255,255,255,0.25)');
      }
      if (flash > 0 || hurt) vignette(c, hurt ? 0.35 + flash * 2 : flash * 3, '#d01a20');

      if (started) drawScore(c, g.score);
      else drawScore(c, 'Swipe to start', 'Slice everything. Except me.');
    },
  };
  return g;
}

/* ---------- art ---------- */

// The chopping board: dark oiled planks with grain, a warm pool of light
// from above and deep corners. Painted once.
function board() {
  return sprite('slice:board', W, H, (c) => {
    const base = c.createLinearGradient(0, 0, W, H);
    base.addColorStop(0, '#5a3520');
    base.addColorStop(1, '#3a2213');
    c.fillStyle = base;
    c.fillRect(0, 0, W, H);
    for (let p = 0; p < 6; p++) {
      const x0 = p * 80;
      // each plank a slightly different tone
      c.fillStyle = `rgba(${p % 2 ? '255,200,150' : '0,0,0'},${0.03 + hash(p) * 0.05})`;
      c.fillRect(x0, 0, 80, H);
      // wavy grain lines
      c.lineWidth = 1;
      for (let i = 0; i < 16; i++) {
        const gx = x0 + 4 + hash(p * 20 + i) * 72;
        c.strokeStyle = hash(p * 31 + i) > 0.5 ? 'rgba(20,8,2,0.28)' : 'rgba(255,190,130,0.08)';
        c.beginPath();
        for (let y = 0; y <= H; y += 20) c.lineTo(gx + Math.sin(y * 0.012 + i + p) * 3 + Math.sin(y * 0.05 + i) * 0.8, y);
        c.stroke();
      }
      // a knot or two
      for (let k = 0; k < 2; k++) {
        if (hash(p * 7 + k) < 0.5) continue;
        const kx = x0 + 20 + hash(p + k * 3) * 40;
        const ky = hash(p * 3 + k) * H;
        for (let r = 3; r < 14; r += 3) {
          c.strokeStyle = 'rgba(20,8,2,0.25)';
          c.beginPath();
          c.ellipse(kx, ky, r * 0.7, r * 1.6, 0, 0, Math.PI * 2);
          c.stroke();
        }
      }
      // knife scratches
      for (let i = 0; i < 5; i++) {
        const sx = x0 + hash(p * 9 + i) * 80;
        const sy = hash(p * 13 + i) * H;
        const a = hash(p + i * 5) * Math.PI;
        c.strokeStyle = 'rgba(255,220,180,0.07)';
        c.beginPath();
        c.moveTo(sx, sy);
        c.lineTo(sx + Math.cos(a) * 40, sy + Math.sin(a) * 40);
        c.stroke();
      }
      // the seam between planks: a dark gap with a lit edge
      c.fillStyle = 'rgba(10,4,0,0.55)';
      c.fillRect(x0 - 1.5, 0, 3, H);
      c.fillStyle = 'rgba(255,200,150,0.08)';
      c.fillRect(x0 + 1.5, 0, 1.5, H);
    }
    // a warm overhead light
    const light = c.createRadialGradient(W / 2, H * 0.4, 20, W / 2, H * 0.45, H * 0.65);
    light.addColorStop(0, 'rgba(255,200,140,0.32)');
    light.addColorStop(0.5, 'rgba(255,170,110,0.1)');
    light.addColorStop(1, 'rgba(255,170,110,0)');
    c.fillStyle = light;
    c.fillRect(0, 0, W, H);
    const v = c.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H / 2, H * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(8,3,0,0.7)');
    c.fillStyle = v;
    c.fillRect(0, 0, W, H);
  });
}

// A juice splat left on the board.
function splatSprite(color) {
  return sprite(`slice:splat:${color}`, 128, 128, (c) => {
    c.translate(64, 64);
    c.fillStyle = color;
    c.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r = 26 + hash(i + color.length) * 14;
      c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    c.fill();
    for (let i = 0; i < 9; i++) {
      const a = hash(i * 3) * Math.PI * 2;
      const d = 40 + hash(i * 5) * 20;
      c.beginPath();
      c.arc(Math.cos(a) * d, Math.sin(a) * d, 2 + hash(i * 7) * 5, 0, Math.PI * 2);
      c.fill();
    }
    // wet highlight
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.beginPath();
    c.ellipse(-8, -10, 12, 6, -0.5, 0, Math.PI * 2);
    c.fill();
  });
}

const IRES = 2; // item sprites are painted at twice the size, for crisp edges
const IPAD = 10;

// An item's sprite, centered, unrotated (cached per kind and glyph).
function itemSprite(kind, glyph) {
  const r = KINDS[kind].r;
  const size = (r * 2 + IPAD * 2) * (kind === 'banana' ? 1.5 : 1);
  return sprite(`slice:item:${kind}:${kind === 'key' ? glyph : ''}`, size * IRES, size * IRES, (c) => {
    c.scale(IRES, IRES);
    c.translate(size / 2, size / 2);
    paintItem(c, kind, glyph);
  });
}

function drawItem(c, kind, glyph) {
  const spr = itemSprite(kind, glyph);
  const s = spr.width / IRES;
  c.drawImage(spr, -s / 2, -s / 2, s, s);
}

// A round body with a lit side, a dark side and a soft specular spot.
function ball(c, r, hi, mid, lo) {
  const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.05);
  g.addColorStop(0, hi);
  g.addColorStop(0.55, mid);
  g.addColorStop(1, lo);
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
}

function shine(c, x, y, rx, ry, a = 0.6) {
  const g = c.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, `rgba(255,255,255,${a})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(x, y, rx, ry, -0.6, 0, Math.PI * 2);
  c.fill();
}

// a warm rim light along the lower right edge
function rim(c, r, color = 'rgba(255,190,120,0.5)') {
  c.strokeStyle = color;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 0, r - 1, -0.3, 1.6);
  c.stroke();
}

function paintItem(c, kind, glyph) {
  const r = KINDS[kind].r;
  if (kind === 'melon') {
    ball(c, r, '#7fd36a', '#3a9a38', '#174a1a');
    c.save();
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.clip();
    c.strokeStyle = 'rgba(16,60,20,0.75)';
    c.lineWidth = 5;
    for (const k of [-0.75, -0.25, 0.25, 0.75]) {
      c.beginPath();
      for (let y = -r; y <= r; y += 4) c.lineTo(k * r * Math.sqrt(1 - (y / r) ** 2) + Math.sin(y * 0.5) * 1.5, y);
      c.stroke();
    }
    c.restore();
    shine(c, -r * 0.38, -r * 0.42, r * 0.4, r * 0.24, 0.55);
    rim(c, r, 'rgba(190,255,170,0.35)');
  } else if (kind === 'orange') {
    ball(c, r, '#ffd08a', '#ff9418', '#b44a00');
    c.fillStyle = 'rgba(150,60,0,0.3)';
    for (let i = 0; i < 26; i++) {
      const a = hash(i) * Math.PI * 2;
      const d = Math.sqrt(hash(i + 9)) * r * 0.85;
      c.beginPath();
      c.arc(Math.cos(a) * d, Math.sin(a) * d, 1.1, 0, Math.PI * 2);
      c.fill();
    }
    shine(c, -r * 0.35, -r * 0.4, r * 0.42, r * 0.26, 0.65);
    rim(c, r);
    const lg = c.createLinearGradient(0, -r - 4, 0, -r + 6);
    lg.addColorStop(0, '#8fd06a');
    lg.addColorStop(1, '#2f7a2c');
    c.fillStyle = lg;
    c.beginPath();
    c.ellipse(6, -r + 2, 9, 4.5, -0.4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#5a3a1a';
    c.fillRect(-1.5, -r - 1, 3, 5);
  } else if (kind === 'banana') {
    c.save();
    c.translate(0, -r * 0.2);
    const path = () => {
      c.beginPath();
      c.arc(0, -r, r * 1.6, Math.PI * 0.22, Math.PI * 0.78);
      c.arc(0, -r * 1.35, r * 1.5, Math.PI * 0.76, Math.PI * 0.24, true);
      c.closePath();
    };
    const g = c.createLinearGradient(0, r * 0.1, 0, r * 0.7);
    g.addColorStop(0, '#fff3a0');
    g.addColorStop(0.5, '#ffd52a');
    g.addColorStop(1, '#c99a12');
    c.fillStyle = g;
    path();
    c.fill();
    c.strokeStyle = '#a07a10';
    c.lineWidth = 1.5;
    c.stroke();
    c.strokeStyle = 'rgba(255,255,230,0.75)';
    c.lineWidth = 2.5;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(0, -r * 1.35, r * 1.5 + 3, Math.PI * 0.35, Math.PI * 0.62);
    c.stroke();
    c.fillStyle = '#4e3414';
    c.beginPath();
    c.arc(Math.cos(Math.PI * 0.22) * r * 1.6, -r + Math.sin(Math.PI * 0.22) * r * 1.6, 3, 0, Math.PI * 2);
    c.arc(Math.cos(Math.PI * 0.78) * r * 1.6, -r + Math.sin(Math.PI * 0.78) * r * 1.6, 3, 0, Math.PI * 2);
    c.fill();
    c.restore();
  } else if (kind === 'key') {
    // a keycap: dark sides, a dished top face, the letter
    const side = c.createLinearGradient(0, -r * 0.7, 0, r * 0.9);
    side.addColorStop(0, '#b9bdcb');
    side.addColorStop(1, '#5f6372');
    c.fillStyle = side;
    rr(c, -r * 0.8, -r * 0.7, r * 1.6, r * 1.6, 8);
    c.fill();
    const top = c.createLinearGradient(0, -r * 0.8, 0, r * 0.5);
    top.addColorStop(0, '#ffffff');
    top.addColorStop(1, '#d9dce6');
    c.fillStyle = top;
    rr(c, -r * 0.65, -r * 0.8, r * 1.3, r * 1.3, 7);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-r * 0.5, -r * 0.78);
    c.lineTo(r * 0.5, -r * 0.78);
    c.stroke();
    text(c, glyph, 0, -r * 0.15, { size: 22, color: '#3a3d4a' });
  } else if (kind === 'duck') {
    const g = c.createRadialGradient(-r * 0.4, -r * 0.5, 2, 0, 0, r * 1.2);
    g.addColorStop(0, '#fff6a0');
    g.addColorStop(0.5, '#ffd21f');
    g.addColorStop(1, '#d99a00');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(0, r * 0.3, r, r * 0.6, 0, 0, Math.PI * 2);
    c.arc(-r * 0.35, -r * 0.35, r * 0.48, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ff8a1f';
    c.beginPath();
    c.ellipse(-r * 0.9, -r * 0.25, r * 0.25, r * 0.12, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#2b1d17';
    c.beginPath();
    c.arc(-r * 0.45, -r * 0.45, 3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(-r * 0.48, -r * 0.5, 1, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#eaa800';
    c.beginPath();
    c.ellipse(r * 0.25, r * 0.2, r * 0.4, r * 0.2, 0.3, 0, Math.PI * 2);
    c.fill();
    shine(c, -r * 0.5, -r * 0.55, r * 0.22, r * 0.14, 0.8);
    shine(c, r * 0.1, r * 0.05, r * 0.3, r * 0.12, 0.45);
  }
}

// Half of a sliced item: the item clipped along the cut, showing its inside.
function half(c, h) {
  const r = KINDS[h.kind].r;
  c.save();
  c.translate(h.x, h.y);
  c.rotate(h.angle);
  c.beginPath();
  c.rect(-r * 2, h.side < 0 ? -r * 2 : 0, r * 4, r * 2);
  c.clip();
  c.save();
  c.rotate(h.inner);
  drawItem(c, h.kind, h.glyph);
  c.restore();
  // the juicy cut face
  const inner = KINDS[h.kind].inner;
  const g = c.createRadialGradient(0, 0, 0, 0, 0, r * 0.85);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.25, inner);
  g.addColorStop(1, inner);
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(0, 0, r * 0.85, r * 0.2, 0, 0, Math.PI * 2);
  c.fill();
  if (h.kind === 'melon') {
    c.fillStyle = '#2b1d17';
    for (const k of [-0.5, -0.15, 0.2, 0.55]) {
      c.beginPath();
      c.arc(k * r, h.side * 3, 2, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

// A sticking plaster across the button's face, for when it got cut.
function plaster(c, x, y, angle) {
  c.save();
  c.translate(x, y);
  c.rotate(angle + 0.6);
  c.fillStyle = '#f5c9a0';
  rr(c, -24, -6, 48, 12, 5);
  c.fill();
  c.fillStyle = '#e8a77a';
  c.fillRect(-6, -5, 12, 10);
  c.fillStyle = 'rgba(255,255,255,0.4)';
  c.fillRect(-22, -5, 44, 2);
  c.restore();
}
