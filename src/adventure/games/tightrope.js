import { W, H, rand, pick, clamp, rr, text, drawBobby, drawScore, Mouth, Sparks, reviveFx, blinkAlpha, vignette, layer, scrollTile } from '../kit';
import { Fx, sprite, glow, hash } from '../fx';

// Wobble Walk: the button crosses a tightrope high above a city. It walks on
// its own; hold the left or right half of the screen (or ← →) to lean against
// the wobble, the wind and the pigeons. Past ~1 rad of tilt it falls.
const PX = 30; // pixels per meter
const CX = W / 2;
const ROPE = 520; // rope height at the button
const SIZE = 74;
const LIMIT = 1; // radians of tilt before the fall
const LEAN = 10; // rad/s^2 of lean while a side is held
const FALL_ACC = 4; // the tilt feeds itself: an upside-down pendulum
const SPAN = 118; // half length of the balancing pole

const START = ['I regret this.', 'Nope nope nope.', 'DON’T LOOK DOWN', 'Who approved this?', 'No shoes. Great.'];
const SCARED = ['DON’T LOOK DOWN', 'Nope nope nope.', 'Mama!', 'I regret this.', 'Not like this!'];
const RELIEF = ['Totally meant that.', 'Smooth.', 'I was never worried.', 'Nailed it. Barely.', 'Pfft. Easy.'];
const IDLE = ['Is the rope… moving?', 'It is a long way down.', 'I should have stayed in bed.', 'Wind. Of course.', 'Look at me go. Slowly.'];
const WIND = ['Is that wind?', 'Oh no.', 'Here it comes.', 'Hold on, hold on.'];
const BIRD = ['PIGEON!', 'Rude!', 'Move it, feathers!'];
const LADDER = ['Why is there a LADDER.', 'A wobbly bit. Great.', 'Rungs. Nobody asked.'];
const BALLOON = ['Is that a balloon?', 'Oh no, it’s gassy.', 'Please don’t.'];
const FALL = ['AAAAAH!', 'Tell my mother…', 'Whoooaaa!', 'Of COURSE.'];
const PUFFS = [
  ['PFFT', '#b6e35a'],
  ['ACHOO!', '#ffffff'],
  ['BRAAP', '#d8e66a'],
];

export default function tightrope({ look, sound, keys }) {
  const mouth = new Mouth();
  const sparks = new Sparks();
  const fx = new Fx();
  const ph = [rand(0, 6.3), rand(0, 6.3), rand(0, 6.3)];
  const birds = Array.from({ length: 5 }, (_, i) => ({ x: rand(0, W), y: rand(150, 430), s: rand(14, 26), v: rand(0.2, 0.5), p: i * 1.7 }));
  const streaks = [];
  let haz = [];
  let gust = null;
  let gNext = 4.5;
  let nextHaz = 70;
  let fall = null;
  let banner = null;
  let t = 0;
  let sc = 0; // pixels scrolled, for the scenery
  let dist = 0;
  let speed = 5;
  let tilt = 0;
  let w = 0; // angular velocity
  let ptr = 0; // -1 / 0 / 1 from the pointer
  let held = false;
  let lean = 0;
  let calm = 0; // seconds of gentle air after a Continue
  let bounce = 0; // rope bounce, decays
  let ladderF = 0;
  let mile = 0;
  let danger = false;
  let smug = 0;
  let scare = 0; // cooldown for the scared quip
  let chat = 7;
  let windVis = 0;

  const busy = () => gust || haz.some((h) => h.k !== 'l');
  const say = (lines, sec = 1.8) => mouth.say(pick(lines), sec);
  const shove = (v) => {
    w += v;
    bounce = Math.min(1, bounce + 0.6);
  };

  const startGust = (diff) => {
    const warn = 1.3 - diff * 0.45;
    gust = { dir: Math.random() < 0.5 ? -1 : 1, str: (2.6 + diff * 3.9) * rand(0.85, 1.1), warn, dur: rand(1.3, 2), t: 0 };
    if (Math.random() < 0.5) say(WIND, 1.5);
  };

  const spawnHazard = () => {
    const kind = mile === 0 && dist < 120 ? 'p' : pick(['p', 'l', 'b']);
    if (kind === 'p') {
      const side = Math.random() < 0.5 ? -1 : 1;
      haz.push({ k: 'p', side, x: side < 0 ? -50 : W + 50, t: 0, hit: false });
      say(BIRD, 1.4);
    } else if (kind === 'l') {
      haz.push({ k: 'l', d0: dist + 10, d1: dist + 27 });
      say(LADDER, 2);
    } else {
      const side = Math.random() < 0.5 ? -1 : 1;
      haz.push({ k: 'b', side, x: side < 0 ? -100 : W + 100, t: 0, puff: 1.2, left: 3, puffs: [] });
      say(BALLOON, 1.8);
    }
  };

  const startFall = () => {
    const s = tilt < 0 ? -1 : 1;
    fall = { x: 0, y: 0, vx: s * 70, vy: -280, rot: tilt, vr: s * 6, t: 0, poof: false, pole: { x: 0, y: -30, vx: -s * 120, vy: -200, rot: tilt, vr: -s * 9 } };
    sound.bad?.();
    say(FALL, 2);
    sparks.float(CX, ROPE - 130, 'AAAAH!', '#ffffff');
    fx.burst(CX, ROPE - 20, '#fff3a8', 10, 260);
  };

  // y of the rope at screen x: sags under the button, bobs when bounced
  const ropeAt = (x) => {
    const dx = Math.abs(x - CX) / CX;
    const diff = clamp(dist / 500, 0, 1);
    const bob = Math.sin(t * 9) * (bounce * 7 + diff * 2.5 + 1) * (1 - dx * 0.7);
    return ROPE + bob - (8 + diff * 14) * Math.pow(dx, 1.4);
  };

  const g = {
    score: 0,
    over: false,
    down(x) {
      held = true;
      ptr = x < CX ? -1 : 1;
    },
    move(x) {
      if (held) ptr = x < CX ? -1 : 1;
    },
    up() {
      held = false;
      ptr = 0;
    },

    // a paid Continue: upright again, with a few seconds of gentle air
    revive() {
      g.over = false;
      fall = null;
      tilt = 0;
      w = 0;
      calm = 2.6;
      gust = null;
      gNext = 4;
      haz = haz.filter((h) => h.k === 'l' && h.d1 > dist);
      nextHaz = Math.max(nextHaz, dist + 40);
      reviveFx({ fx, words: sparks, mouth, sound }, CX, ROPE - 70, look.color);
    },

    update(dt) {
      dt = Number.isFinite(dt) ? clamp(dt, 0, 0.05) : 0;
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
      fx.update(dt);
      bounce = Math.max(0, bounce - dt * 0.8);
      smug = Math.max(0, smug - dt);
      scare = Math.max(0, scare - dt);
      if (banner && (banner.t += dt) > 2.4) banner = null;
      if (t > 0.4 && !g.start) {
        g.start = true;
        say(START, 2.6);
      }

      // wind streaks
      const dir = gust ? gust.dir : 0;
      windVis = gust ? dir * (gust.t < gust.warn ? 0.5 * (gust.t / gust.warn) : 1) : 0;
      if (Math.random() < Math.abs(windVis) * 30 * dt && streaks.length < 40) {
        streaks.push({ x: dir > 0 ? -60 : W + 60, y: rand(200, 690), l: rand(40, 110), v: rand(700, 1000), a: rand(0.3, 0.7) });
      }
      for (let i = streaks.length - 1; i >= 0; i--) {
        const s = streaks[i];
        s.x += (windVis < 0 ? -1 : 1) * s.v * dt;
        if (s.x < -140 || s.x > W + 140) streaks.splice(i, 1);
      }

      for (const b of birds) b.x = (((b.x - b.v * 14 * dt - speed * PX * 0.04 * dt + 40) % (W + 80)) + W + 80) % (W + 80) - 40;

      if (fall) {
        stepFall(dt);
        sc += 30 * dt;
      } else if (!g.over) {
        sc += speed * PX * dt;
        stepWalk(dt);
      }
      // hazards keep moving (and puffs keep flying) even in the fall
      stepHazards(dt);
    },

    draw(c) {
      scenery(c, t, sc, birds);
      for (const s of streaks) {
        c.globalAlpha = s.a * 0.55;
        c.strokeStyle = '#fff';
        c.lineWidth = 2;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(s.x, s.y);
        c.lineTo(s.x - Math.sign(windVis || 1) * s.l, s.y);
        c.stroke();
      }
      c.globalAlpha = 1;

      rope(c, sc, ropeAt);
      for (const h of haz) if (h.k === 'l') ladder(c, h, dist, ropeAt);

      const by = ropeAt(CX);
      if (fall) drawFall(c);
      else drawWalker(c, by);
      for (const h of haz) if (h.k === 'p') pigeon(c, h, t);
      fx.draw(c);

      fogFront(c, t);
      for (const h of haz) if (h.k === 'b') balloon(c, h, t);
      flag(c, windVis, t);
      sparks.draw(c);

      if (!fall && Math.abs(tilt) > 0.55) vignette(c, Math.round(clamp((Math.abs(tilt) - 0.5) * 1.2, 0, 0.6) * 5) / 5 + 0.2, '#c0182a');
      vignette(c, 0.25, '#2a1840');
      mouth.draw(c, CX, fall ? 380 : by - 104);
      drawScore(c, g.score, 'meters');
      meter(c, tilt, t);
      if (t < 3) text(c, 'Hold left / right to lean', CX, 188, { size: 16, color: 'rgba(255,255,255,0.92)' });
      if (banner) drawBanner(c, banner);
    },
  };

  /* ---------- simulation ---------- */

  function stepWalk(dt) {
    const diff = clamp(dist / 500, 0, 1);
    speed = clamp(5 + dist * 0.018, 5, 11.5);
    dist += speed * dt;
    g.score = Math.floor(dist);
    calm = Math.max(0, calm - dt);
    // gentle at the start, and for a moment after a Continue
    const ease = clamp((t - 0.6) / 4, 0.05, 1);
    const f = Math.min(ease, calm > 0 ? clamp(1 - calm / 2, 0.1, 1) : 1);

    // gusts: telegraphed by the flag and streaks, then they push
    let gustAcc = 0;
    if (gust) {
      gust.t += dt;
      if (gust.t >= gust.warn) {
        const p = (gust.t - gust.warn) / gust.dur;
        if (p >= 1) {
          gust = null;
          gNext = rand(5.5 - diff * 3.3, 8 - diff * 3.8);
        } else gustAcc = gust.dir * gust.str * Math.pow(Math.sin(Math.PI * p), 0.6);
      }
    } else if (t > 4 && calm <= 0 && (gNext -= dt) <= 0) {
      if (busy()) gNext = 0.5;
      else startGust(diff);
    }

    // the wobbly ladder bit shakes the walker harder
    const onLadder = haz.some((h) => h.k === 'l' && dist >= h.d0 && dist <= h.d1);
    ladderF += ((onLadder ? 1 : 0) - ladderF) * Math.min(1, dt * 4);
    if (onLadder) bounce = Math.max(bounce, 0.45);

    const n = Math.sin(t * 1.3 + ph[0]) + 0.6 * Math.sin(t * 2.9 + ph[1]) + 0.35 * Math.sin(t * 5.3 + ph[2]);
    const wob = n * (1.1 + diff * 1.9) * (1 + ladderF * 0.9) * f;

    const kx = keys ? (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0) : 0;
    const target = clamp(ptr + kx, -1, 1);
    lean += (target - lean) * Math.min(1, dt * 12);

    w += (FALL_ACC * tilt + wob + gustAcc * f + LEAN * lean) * dt;
    w -= w * 0.9 * dt;
    if (!Number.isFinite(w) || !Number.isFinite(tilt)) {
      w = 0;
      tilt = 0;
    }
    tilt += w * dt;

    // hazards on a ~100 m beat, one at a time, never during a gust
    if (dist >= nextHaz && calm <= 0 && !busy()) {
      spawnHazard();
      nextHaz = dist + rand(92, 112);
    } else if (dist >= nextHaz) nextHaz = dist + 2;

    // moods and quips
    const a = Math.abs(tilt);
    if (a > 0.6) {
      if (!danger) danger = true;
      if (scare <= 0 && mouth.left <= 0) {
        say(SCARED, 1.3);
        scare = 5;
      }
    } else if (danger && a < 0.18) {
      danger = false;
      smug = 1.3;
      if (Math.random() < 0.6) say(RELIEF, 1.5);
      sparks.float(CX + 40, ROPE - 90, 'phew', '#fff3a8');
    }
    chat -= dt;
    if (chat <= 0) {
      chat = rand(8, 13);
      if (mouth.left <= 0) say(IDLE, 2);
    }

    // milestone every 100 m
    const m = Math.floor(dist / 100);
    if (m > mile) {
      mile = m;
      banner = { t: 0, txt: `${m * 100} m!` };
      sound.win?.();
      for (const x of [110, 240, 370]) fx.burst(x, 250 + rand(-20, 20), pick(['#ffd84d', '#ff7aa8', '#8fe9ff']), 14, 280);
    }

    if (calm > 0) tilt = clamp(tilt, -0.9, 0.9);
    else if (Math.abs(tilt) > LIMIT) {
      tilt = clamp(tilt, -LIMIT, LIMIT);
      startFall();
    }
  }

  function stepFall(dt) {
    const f = fall;
    f.t += dt;
    for (const o of [f, f.pole]) {
      o.vy += 900 * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.rot += o.vr * dt;
    }
    f.vx += Math.sin(f.t * 10) * 40 * dt; // dizzy drift
    if (!f.poof && f.y > 215) {
      f.poof = true;
      f.tPoof = 0;
      for (let i = 0; i < 3; i++) fx.burst(CX + f.x + rand(-30, 30), ROPE + 210, '#ffffff', 10, 200, { gravity: -50, size: 5, life: 0.9 });
      fx.ring(CX + f.x, ROPE + 200, '#ffffff', 90, 0.5, 8);
      sound.thud?.();
      mouth.say('…I’m fine.', 1.6);
    }
    if (f.poof && (f.tPoof += dt) > 0.7) {
      g.over = true;
      sound.sob?.();
    }
  }

  function stepHazards(dt) {
    for (const h of haz) {
      if (h.k === 'p') {
        h.t += dt;
        h.x -= h.side * 190 * dt; // side -1 flies right, +1 flies left
        if (!h.hit && !fall && !g.over && Math.abs(h.x - CX) < 38) {
          h.hit = true;
          shove(-h.side * 2.6);
          sound.hit?.();
          fx.burst(h.x, ROPE - 70, '#e8e4f0', 10, 220, { gravity: 200, size: 2.5, life: 0.8 });
          sparks.float(CX, ROPE - 150, 'BONK', '#ffd84d');
        }
        h.dead = h.x < -70 || h.x > W + 70;
      } else if (h.k === 'b') {
        h.t += dt;
        h.x -= h.side * 80 * dt;
        if (h.left > 0 && h.x > 70 && h.x < W - 70 && (h.puff -= dt) <= 0 && !fall && !g.over) {
          h.puff = 1.5;
          h.left--;
          const [txt, col] = pick(PUFFS);
          h.puffs.push({ x0: h.x, y0: 300, p: 0, txt, col, dir: Math.abs(h.x - CX) < 20 ? pick([-1, 1]) : Math.sign(CX - h.x) });
        }
        for (const q of h.puffs) {
          q.p += dt / 1.2;
          if (q.p >= 1 && !q.done) {
            q.done = true;
            if (!fall && !g.over) {
              shove(q.dir * 2.2);
              sound.pop?.();
              fx.burst(CX, ROPE - 60, q.col, 10, 200, { gravity: -80, size: 4, life: 0.7 });
            }
          }
        }
        h.puffs = h.puffs.filter((q) => q.p < 1.15);
        h.dead = h.x < -140 || h.x > W + 140 || (h.t > 20);
      } else h.dead = dist > h.d1 + 12;
    }
    haz = haz.filter((h) => !h.dead);
  }

  /* ---------- drawing the button ---------- */

  function drawWalker(c, by) {
    const a = blinkAlpha(calm, t);
    const stride = Math.sin(t * speed * 1.7);
    const mood = smug > 0 ? 'smug' : Math.abs(tilt) > 0.62 ? 'shout' : Math.abs(tilt) > 0.3 ? 'worried' : calm > 0 ? 'happy' : 'calm';
    c.save();
    c.globalAlpha = a;
    c.translate(CX, by);
    c.rotate(tilt);
    // tiny feet taking turns
    c.fillStyle = look.dark;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.ellipse(s * 10 + 4, -3 - Math.max(0, stride * s) * 5, 10, 5, 0, 0, Math.PI * 2);
      c.fill();
    }
    drawBobby(c, 0, -SIZE * 0.38, SIZE, { look, mood, t, moving: true, squash: stride * 0.025, facing: 1 });
    // the pole counter-swings against the tilt
    c.translate(0, -30);
    c.rotate(-tilt * 0.65 + Math.sin(t * 3) * 0.03);
    pole(c);
    c.fillStyle = look.dark;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.arc(s * 24, 0, 5.5, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    if (Math.abs(tilt) > 0.5 && !g.over) {
      c.globalAlpha = 0.9;
      text(c, '!', CX + 52 * Math.sign(tilt), by - 100, { size: 30, color: '#ff4f5e' });
      c.globalAlpha = 1;
    }
  }

  function drawFall(c) {
    const f = fall;
    c.save();
    c.translate(CX + f.pole.x, ROPE + f.pole.y);
    c.rotate(f.pole.rot);
    pole(c);
    c.restore();
    const x = CX + f.x;
    const y = ROPE - SIZE * 0.38 + f.y;
    drawBobby(c, x, y, SIZE, { look, mood: f.t < 0.5 ? 'shout' : 'closed', t, angle: f.rot, flash: f.t < 0.06 });
    // dizzy stars circling its head
    for (let i = 0; i < 3; i++) {
      const a = t * 9 + (i * Math.PI * 2) / 3;
      const sx = x + Math.cos(a) * 34;
      const sy = y - 44 + Math.sin(a) * 9;
      glow(c, sx, sy, 15, '#ffd84d', 0.8);
      c.fillStyle = '#fff3a0';
      star(c, sx, sy, 5, a);
    }
  }

  return g;
}

/* ---------- art ---------- */

function pole(c) {
  const g = c.createLinearGradient(0, -3, 0, 3);
  g.addColorStop(0, '#c99a62');
  g.addColorStop(1, '#6e4a2b');
  c.fillStyle = g;
  rr(c, -SPAN, -3, SPAN * 2, 6, 3);
  c.fill();
  for (const s of [-1, 1]) {
    c.fillStyle = s < 0 ? '#ff6f7a' : '#6fb7ff';
    c.beginPath();
    c.arc(s * SPAN, 0, 8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.6)';
    c.beginPath();
    c.arc(s * SPAN - 2.5, -2.5, 2.5, 0, Math.PI * 2);
    c.fill();
  }
}

function star(c, x, y, r, turn) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = turn + (i * Math.PI) / 5;
    const rad = i % 2 ? r * 0.45 : r;
    c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  c.fill();
}

// The rope itself with bunting that streams past to show the speed.
const FLAGS = ['#ff6f7a', '#ffd84d', '#6fb7ff', '#8fe08a'];
function rope(c, sc, ropeAt) {
  c.lineCap = 'round';
  c.strokeStyle = '#4a3a30';
  c.lineWidth = 5;
  c.beginPath();
  for (let x = -10; x <= W + 10; x += 10) c.lineTo(x, ropeAt(x));
  c.stroke();
  c.strokeStyle = 'rgba(255,225,180,0.55)';
  c.lineWidth = 1.5;
  c.beginPath();
  for (let x = -10; x <= W + 10; x += 10) c.lineTo(x, ropeAt(x) - 1.5);
  c.stroke();
  // twist marks
  c.strokeStyle = 'rgba(30,20,15,0.5)';
  c.lineWidth = 1.5;
  const off = sc % 14;
  c.beginPath();
  for (let x = -off; x < W; x += 14) {
    const y = ropeAt(x);
    c.moveTo(x, y - 2);
    c.lineTo(x + 5, y + 2);
  }
  c.stroke();
  // bunting every 2 m
  const gap = 2 * PX;
  const first = Math.floor(sc / gap) - 1;
  for (let k = first; k < first + W / gap + 3; k++) {
    const x = k * gap - sc + CX * 0 + 0;
    if (x < -20 || x > W + 20 || Math.abs(x - CX) < 50) continue;
    const y = ropeAt(x);
    c.fillStyle = FLAGS[((k % 4) + 4) % 4];
    c.beginPath();
    c.moveTo(x - 8, y + 1);
    c.lineTo(x + 8, y + 1);
    c.lineTo(x, y + 20);
    c.fill();
  }
}

function ladder(c, h, dist, ropeAt) {
  const x0 = CX + (h.d0 - dist) * PX;
  const x1 = CX + (h.d1 - dist) * PX;
  if (x1 < -20 || x0 > W + 20) return;
  const a = Math.max(-10, x0);
  const b = Math.min(W + 10, x1);
  c.lineCap = 'round';
  c.strokeStyle = '#7a4f2a';
  c.lineWidth = 4;
  for (const dy of [-6, 8]) {
    c.beginPath();
    for (let x = a; x <= b; x += 10) c.lineTo(x, ropeAt(x) + dy);
    c.stroke();
  }
  c.lineWidth = 3;
  c.strokeStyle = '#c99a62';
  for (let x = x0; x <= x1; x += 27) {
    if (x < -5 || x > W + 5) continue;
    const y = ropeAt(x);
    c.beginPath();
    c.moveTo(x, y - 6);
    c.lineTo(x, y + 8);
    c.stroke();
  }
}

function pigeon(c, h, t) {
  const dir = -h.side; // facing the way it flies
  const y = ROPE - 76 + Math.sin(h.t * 7) * 8;
  const flap = Math.sin(h.t * 22);
  c.save();
  c.translate(h.x, y);
  c.scale(dir, 1);
  c.fillStyle = '#9ba3b8';
  c.beginPath();
  c.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#7e87a0';
  c.beginPath();
  c.moveTo(-14, -2);
  c.lineTo(-34, -6 + flap * 3);
  c.lineTo(-16, 8);
  c.fill();
  c.fillStyle = '#b9c0d4';
  c.beginPath();
  c.ellipse(-2, -4 - flap * 10, 9, 15, -0.4 + flap * 0.5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#7fb3a0';
  c.beginPath();
  c.arc(16, -8, 8, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffb347';
  c.beginPath();
  c.moveTo(22, -9);
  c.lineTo(31, -6);
  c.lineTo(22, -5);
  c.fill();
  c.fillStyle = '#fff';
  c.beginPath();
  c.arc(18, -10, 3, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#222';
  c.beginPath();
  c.arc(19, -10, 1.4, 0, Math.PI * 2);
  c.fill();
  // grumpy brow
  c.strokeStyle = '#2b2b3a';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(14, -15);
  c.lineTo(23, -12);
  c.stroke();
  c.restore();
}

// The passerby hot-air balloon that lets one rip.
function balloon(c, h, t) {
  const y = 230 + Math.sin(h.t * 1.6) * 10;
  c.drawImage(balloonSprite('#ff8a5c', '#ffe08a'), h.x - 55, y - 80, 110, 150);
  c.lineJoin = 'round';
  for (const q of h.puffs) {
    const p = clamp(q.p, 0, 1);
    const x = q.x0 + (CX - q.x0) * p;
    const yy = 300 + (ROPE - 70 - 300) * p;
    const r = 14 + p * 20;
    c.globalAlpha = clamp((1.15 - q.p) * 3, 0, 1);
    glow(c, x, yy, r * 2, q.col, 0.7);
    c.fillStyle = q.col;
    c.beginPath();
    c.arc(x - r * 0.5, yy, r * 0.7, 0, Math.PI * 2);
    c.arc(x + r * 0.5, yy + 2, r * 0.65, 0, Math.PI * 2);
    c.arc(x, yy - r * 0.4, r * 0.7, 0, Math.PI * 2);
    c.fill();
    text(c, q.txt, x, yy - r - 12, { size: 18, color: '#fff' });
    c.globalAlpha = 1;
  }
}

// A pennant on a little pole: limp when calm, streaming when the wind is up.
function flag(c, v, t) {
  const px = W - 62;
  const py = 232;
  c.strokeStyle = '#5a4a58';
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(px, py + 56);
  c.lineTo(px, py - 4);
  c.stroke();
  const k = Math.abs(v);
  const dir = v < 0 ? -1 : 1;
  const ang = 1.2 * (1 - Math.min(1, k * 1.2));
  const len = 40;
  const fl = Math.sin(t * (6 + k * 16)) * (3 + k * 7);
  const tx = px + dir * Math.cos(ang) * len;
  const ty = py + 6 + Math.sin(ang) * len + fl;
  c.fillStyle = k > 0.8 ? '#ff4f5e' : k > 0.2 ? '#ffb347' : '#ff6f7a';
  c.beginPath();
  c.moveTo(px, py);
  c.quadraticCurveTo((px + tx) / 2, (py + ty) / 2 - fl * 0.8, tx, ty);
  c.lineTo(px, py + 14);
  c.fill();
  if (k > 0.2) {
    c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 10);
    text(c, dir > 0 ? 'WIND →' : '← WIND', px - 6 * dir, py - 20, { size: 13, color: '#fff' });
    c.globalAlpha = 1;
  }
}

// A readout of how far over you are leaning.
function meter(c, tilt, t) {
  const x = CX - 90;
  const y = 154;
  c.fillStyle = 'rgba(30,14,40,0.28)';
  rr(c, x, y, 180, 9, 4.5);
  c.fill();
  const a = clamp(Math.abs(tilt) / LIMIT, 0, 1);
  c.fillStyle = a > 0.75 ? '#ff4f5e' : a > 0.45 ? '#ffb347' : '#8fe08a';
  const wd = a * 90;
  if (tilt < 0) rr(c, CX - wd, y, wd, 9, 4.5);
  else rr(c, CX, y, wd, 9, 4.5);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.9)';
  c.fillRect(CX - 1, y - 2, 2, 13);
}

function drawBanner(c, b) {
  const k = b.t < 0.3 ? b.t / 0.3 : b.t > 2 ? Math.max(0, (2.4 - b.t) / 0.4) : 1;
  const y = 300 - (1 - k) * 40;
  c.globalAlpha = clamp(k, 0, 1);
  c.fillStyle = '#ffd84d';
  c.strokeStyle = '#a8731a';
  c.lineWidth = 4;
  rr(c, CX - 120, y - 30, 240, 60, 14);
  c.fill();
  c.stroke();
  text(c, b.txt, CX, y + 1, { size: 34, color: '#5a2d0c', weight: 700 });
  c.globalAlpha = 1;
}

/* ---------- scenery ---------- */

function blob(c, x, y, r) {
  c.moveTo(x + r, y);
  c.arc(x, y, r, 0, Math.PI * 2);
}

function cloudTile(key, n, seed, alpha) {
  return sprite(key, W, 330, (c) => {
    for (let i = 0; i < n; i++) {
      const bx = hash(i + seed) * W;
      const by = 40 + hash(i * 3 + seed + 5) * 250;
      const r = 20 + hash(i * 7 + seed) * 22;
      for (const ox of [-W, 0, W]) {
        const gr = c.createLinearGradient(0, by - r, 0, by + r);
        gr.addColorStop(0, `rgba(255,255,255,${alpha})`);
        gr.addColorStop(1, `rgba(255,222,236,${alpha * 0.8})`);
        c.fillStyle = gr;
        c.beginPath();
        blob(c, bx + ox, by, r);
        blob(c, bx + ox - r * 1.1, by + r * 0.3, r * 0.75);
        blob(c, bx + ox + r * 1.2, by + r * 0.25, r * 0.8);
        blob(c, bx + ox + r * 0.3, by - r * 0.5, r * 0.8);
        c.fill();
      }
    }
  });
}

function skyline(key, h, top, bottom, seed, lo, hi, lit) {
  return sprite(key, W, h, (c) => {
    let x = 0;
    for (let i = 0; x < W; i++) {
      const bw = 22 + hash(i + seed) * 28;
      const bh = lo + hash(i * 3 + seed + 9) * (hi - lo);
      const gr = c.createLinearGradient(0, h - bh, 0, h);
      gr.addColorStop(0, top);
      gr.addColorStop(1, bottom);
      c.fillStyle = gr;
      c.fillRect(x, h - bh, bw + 1, bh);
      if (hash(i + seed + 20) > 0.6) c.fillRect(x + bw * 0.4, h - bh - 14, 3, 14); // antenna
      if (lit) {
        c.fillStyle = 'rgba(255,240,200,0.5)';
        for (let wy = h - bh + 8; wy < h - 6; wy += 12) for (let wx = x + 5; wx < x + bw - 4; wx += 9) if (hash(wx * 7 + wy) > 0.55) c.fillRect(wx, wy, 3, 4);
      }
      x += bw;
    }
  });
}

function balloonSprite(a, b) {
  return sprite(`rope:balloon:${a}`, 110, 150, (c) => {
    const g = c.createRadialGradient(40, 40, 6, 55, 55, 60);
    g.addColorStop(0, '#fff6dc');
    g.addColorStop(0.2, a);
    g.addColorStop(1, '#c04a2a');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(55, 4);
    c.bezierCurveTo(108, 4, 108, 80, 68, 108);
    c.lineTo(42, 108);
    c.bezierCurveTo(2, 80, 2, 4, 55, 4);
    c.fill();
    c.fillStyle = b;
    c.beginPath();
    c.moveTo(55, 4);
    c.bezierCurveTo(30, 30, 30, 80, 46, 108);
    c.lineTo(64, 108);
    c.bezierCurveTo(80, 80, 80, 30, 55, 4);
    c.fill();
    c.strokeStyle = '#6b4a2f';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(44, 108);
    c.lineTo(48, 126);
    c.moveTo(66, 108);
    c.lineTo(62, 126);
    c.stroke();
    c.fillStyle = '#8a5a30';
    rr(c, 46, 126, 18, 14, 3);
    c.fill();
  });
}

function birdShape(c, x, y, s, flap) {
  c.beginPath();
  c.moveTo(x - s, y - flap * s * 0.4);
  c.quadraticCurveTo(x - s * 0.4, y - s * 0.5 - flap * s * 0.3, x, y);
  c.quadraticCurveTo(x + s * 0.4, y - s * 0.5 - flap * s * 0.3, x + s, y - flap * s * 0.4);
  c.stroke();
}

function sky() {
  return layer('rope:sky', (c) => {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#4f9be6');
    g.addColorStop(0.45, '#9dd3f7');
    g.addColorStop(0.75, '#ffd9e6');
    g.addColorStop(1, '#ffeacb');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    const s = c.createRadialGradient(360, 330, 0, 360, 330, 240);
    s.addColorStop(0, 'rgba(255,248,214,0.95)');
    s.addColorStop(0.15, 'rgba(255,236,170,0.55)');
    s.addColorStop(1, 'rgba(255,236,170,0)');
    c.fillStyle = s;
    c.fillRect(0, 0, W, H);
  });
}

function scenery(c, t, sc, birds) {
  c.drawImage(sky(), 0, 0);
  scrollTile(c, cloudTile('rope:cl1', 4, 3, 0.55), sc * 0.015 + t * 4, 150);
  // far skyline and a drifting balloon
  scrollTile(c, skyline('rope:sk1', 150, '#c4c3e6', '#e9d9ee', 1, 40, 110, false), sc * 0.04, 590);
  const bx = ((((560 - t * 10 - sc * 0.03) % (W + 200)) + W + 200) % (W + 200)) - 100;
  c.globalAlpha = 0.9;
  c.drawImage(balloonSprite('#7fb2ff', '#ffe08a'), bx - 28, 390 + Math.sin(t * 0.8) * 8, 56, 76);
  c.globalAlpha = 1;
  c.strokeStyle = 'rgba(70,60,110,0.6)';
  c.lineWidth = 1.8;
  c.lineCap = 'round';
  for (const b of birds) birdShape(c, b.x, b.y, b.s * 0.5, Math.sin(t * 9 + b.p));
  scrollTile(c, cloudTile('rope:cl2', 3, 11, 0.8), sc * 0.05 + t * 8, 380);
  scrollTile(c, skyline('rope:sk2', 140, '#8a89c4', '#c6b4d8', 7, 50, 120, true), sc * 0.1, 640);
  scrollTile(c, skyline('rope:sk3', 120, '#6a68a6', '#a58fc0', 13, 40, 100, true), sc * 0.2, 690);
}

// Drifting fog that swallows whatever falls off the rope.
function fogFront(c, t) {
  const fog = cloudTile('rope:fog', 9, 21, 0.97);
  scrollTile(c, fog, t * 12, 640);
  scrollTile(c, fog, -t * 7 + 200, 690);
  const g = c.createLinearGradient(0, 735, 0, H);
  g.addColorStop(0, 'rgba(255,236,244,0)');
  g.addColorStop(0.3, 'rgba(255,236,244,1)');
  g.addColorStop(1, '#fff0f6');
  c.fillStyle = g;
  c.fillRect(0, 735, W, H - 735);
}
