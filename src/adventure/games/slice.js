import { W, H, rand, pick, clamp, rr, text, heart, drawBobby, drawScore, backdrop, bubble, Mouth, Sparks } from '../kit';

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
  const sparks = new Sparks();
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
    sparks.burst(it.x, it.y, look.color, 26, 320);
    sparks.burst(it.x, it.y, '#fff', 12, 200);
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
    sparks.burst(it.x, it.y, kind.juice, 14, 260);
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

    update(dt) {
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
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
      backdrop(c, '#7a4b2a', '#4a2c18');
      // planks on the chopping board
      c.strokeStyle = 'rgba(0,0,0,0.18)';
      c.lineWidth = 3;
      for (let x = 80; x < W; x += 80) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, H);
        c.stroke();
      }

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

      // the blade trail: thick and bright at the tip, thin where it fades
      c.lineCap = 'round';
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1];
        const b = trail[i];
        const k = clamp(b.life / TRAIL, 0, 1);
        c.strokeStyle = `rgba(190,230,255,${0.35 * k})`;
        c.lineWidth = 4 + 14 * k;
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
        c.strokeStyle = `rgba(255,255,255,${k})`;
        c.lineWidth = 1 + 6 * k;
        c.stroke();
      }

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

      for (let i = 0; i < LIVES; i++) heart(c, W / 2 + (i - 1) * 30, 150, 10, i < lives ? '#ff4f7b' : 'rgba(255,255,255,0.25)');

      if (started) drawScore(c, g.score);
      else drawScore(c, 'Swipe to start', 'Slice everything. Except me.');
    },
  };
  return g;
}

// One item, centered on the origin, already rotated.
function drawItem(c, kind, glyph) {
  const r = KINDS[kind].r;
  if (kind === 'melon') {
    c.fillStyle = '#3f9a3c';
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#2a6e2a';
    c.lineWidth = 5;
    for (const k of [-0.55, 0, 0.55]) {
      c.beginPath();
      c.ellipse(k * r, 0, r * 0.18, r * 0.92, 0, 0, Math.PI * 2);
      c.stroke();
    }
  } else if (kind === 'orange') {
    c.fillStyle = '#ff9a1f';
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(160,80,0,0.35)';
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.arc(Math.cos(i * 2.1) * r * 0.55, Math.sin(i * 2.1) * r * 0.5, 1.6, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#4f9a3c';
    c.beginPath();
    c.ellipse(5, -r + 2, 8, 4, -0.4, 0, Math.PI * 2);
    c.fill();
  } else if (kind === 'banana') {
    c.save();
    c.translate(0, -r * 0.2);
    c.fillStyle = '#ffd93b';
    c.strokeStyle = '#c9a321';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, -r, r * 1.6, Math.PI * 0.22, Math.PI * 0.78);
    c.arc(0, -r * 1.35, r * 1.5, Math.PI * 0.76, Math.PI * 0.24, true);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = '#6b4a1e';
    c.beginPath();
    c.arc(Math.cos(Math.PI * 0.22) * r * 1.6, -r + Math.sin(Math.PI * 0.22) * r * 1.6, 3, 0, Math.PI * 2);
    c.arc(Math.cos(Math.PI * 0.78) * r * 1.6, -r + Math.sin(Math.PI * 0.78) * r * 1.6, 3, 0, Math.PI * 2);
    c.fill();
    c.restore();
  } else if (kind === 'key') {
    c.fillStyle = '#9da1b0';
    rr(c, -r * 0.8, -r * 0.7, r * 1.6, r * 1.6, 8);
    c.fill();
    c.fillStyle = '#f1f1f4';
    rr(c, -r * 0.65, -r * 0.8, r * 1.3, r * 1.3, 7);
    c.fill();
    text(c, glyph, 0, -r * 0.15, { size: 22, color: '#3a3d4a' });
  } else if (kind === 'duck') {
    c.fillStyle = '#ffd21f';
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
    c.fillStyle = '#f2b400';
    c.beginPath();
    c.ellipse(r * 0.25, r * 0.2, r * 0.4, r * 0.2, 0.3, 0, Math.PI * 2);
    c.fill();
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
  c.fillStyle = KINDS[h.kind].inner;
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
  c.restore();
}
