import { W, H, rand, pick, clamp, rr, heart, text, drawBobby, drawScore, Mouth, Sparks, reviveFx } from '../kit';
import { Fx, sprite, makeCanvas, glow, rays, vignette, hash } from '../fx';

// Whack-a-Button: clones of the button pop out of nine holes. Bonk them, but
// not the ones holding a heart. 45 seconds on the clock.
const TIME = 45;
const MORE_TIME = 15; // seconds a paid Continue puts back on the clock
const SIZE = 84;
const COLS = [100, 240, 380];
const ROWS = [330, 480, 630];
const HOLES = ROWS.flatMap((y) => COLS.map((x) => ({ x, y })));
const RISE = 0.15; // seconds to pop up or duck down
const TRAVEL = SIZE * 1.15;
const HOLE_W = 58;
const HOLE_H = 18;
// numpad keys follow the numpad's layout; the number row reads like a book
const NUMPAD = { Numpad7: 0, Numpad8: 1, Numpad9: 2, Numpad4: 3, Numpad5: 4, Numpad6: 5, Numpad1: 6, Numpad2: 7, Numpad3: 8 };

const IDLE = ['Missed me.', 'We are legion.', 'Too slow.', 'Is that a hammer or a feather?', 'Peekaboo. I hate you.'];
const BONK = ['OW.', 'My face!', 'Rude.', 'I felt that.', 'That one had a family.'];
const WHIFF = ['Swing and a miss.', 'Ha!', 'Not even close.'];
const ESCAPE = ['Too slow.', 'Nyeh.', 'Bye!'];
const SOB = ['It was a GIFT.', 'I just wanted a hug…', 'You monster.', 'Why would you…'];
const END = ['Finally. A nap.', 'My head hurts.', 'Time’s up. Leave.'];

export default function whack({ look, sound }) {
  const clones = [];
  const hammers = [];
  const mouth = new Mouth();
  const sparks = new Sparks(); // floating score numbers
  const fx = new Fx();
  let shake = 0;
  let pollen = 0;
  const talk = { x: W / 2, y: 260 };
  let left = TIME;
  let extra = 0; // seconds added by Continues, so the pace keeps rising
  let t = 0;
  let next = 0.6; // seconds until the next clone pops up
  let chat = 4;
  let lastTick = TIME;

  // later clones come faster and duck sooner, and more of them at once
  const played = () => TIME + extra - left;
  const interval = () => clamp(0.8 - played() * 0.011, 0.38, 0.8);
  const stay = () => clamp(1.05 - played() * 0.013, 0.5, 1.05);
  const most = () => Math.min(4, 1 + Math.floor(played() / 14));

  const rise = (cl) => clamp(Math.min(cl.age / RISE, (cl.end - cl.age) / RISE), 0, 1);
  const centerY = (cl) => HOLES[cl.hole].y + SIZE * 0.75 - rise(cl) * TRAVEL;
  // the clone in hole `cl.hole` says something (sometimes, if `chance` < 1)
  const say = (cl, lines, chance = 1, sec) => {
    if (chance < 1 && (mouth.left > 0 || Math.random() >= chance)) return;
    mouth.say(pick(lines), sec);
    talk.x = HOLES[cl.hole].x;
    talk.y = centerY(cl) - SIZE * 0.62;
  };

  const popUp = () => {
    const busy = new Set(clones.map((cl) => cl.hole));
    const free = HOLES.map((_, i) => i).filter((i) => !busy.has(i));
    if (!free.length || clones.filter((cl) => cl.bonked == null).length >= most()) return;
    const hasHeart = played() > 3 && Math.random() < 0.22;
    clones.push({
      hole: pick(free),
      age: 0,
      end: RISE * 2 + stay(),
      heart: hasHeart,
      mood: hasHeart ? 'happy' : pick(['angry', 'smug']),
      bonked: null, // seconds since it got bonked
    });
  };

  const bonk = (cl) => {
    cl.bonked = 0;
    cl.end = cl.age + 0.35 + RISE;
    const x = HOLES[cl.hole].x;
    const y = centerY(cl);
    if (cl.heart) {
      g.score = Math.max(0, g.score - 3);
      sound.sob();
      fx.burst(x, y, '#ff4f7b', 16, 220);
      fx.ring(x, y - SIZE * 0.2, '#ff8fb0', 70, 0.4);
      sparks.float(x, y - SIZE * 0.6, '-3', '#ff4f7b');
      say(cl, SOB, 1, 2.2);
    } else {
      g.score++;
      sound.hit();
      fx.burst(x, y - SIZE * 0.3, look.color, 12, 300);
      fx.burst(x, y - SIZE * 0.3, '#fff3a8', 10, 380, { size: 2.5, life: 0.4 });
      fx.ring(x, y - SIZE * 0.3, '#fff6c8', 80, 0.3, 8);
      shake = 0.12;
      sparks.float(x, y - SIZE * 0.6, '+1');
      say(cl, BONK, 0.18);
    }
  };

  const swing = (x, y) => hammers.push({ x, y, age: 0 });

  // the clone (if any) that is up enough in hole `i`
  const upIn = (i, enough) => clones.find((cl) => cl.hole === i && cl.bonked == null && rise(cl) > enough);

  const g = {
    score: 0,
    over: false,
    down(x, y) {
      if (g.over) return;
      swing(x, y);
      let best = null;
      let bestD = Infinity;
      for (const cl of clones) {
        if (cl.bonked != null || rise(cl) < 0.35) continue;
        const h = HOLES[cl.hole];
        const cy = centerY(cl);
        if (Math.abs(x - h.x) > HOLE_W || y < cy - SIZE * 0.65 || y > h.y + HOLE_H + 6) continue;
        const d = Math.hypot(x - h.x, y - cy);
        if (d < bestD) {
          bestD = d;
          best = cl;
        }
      }
      if (best) bonk(best);
      else {
        sound.click();
        if (mouth.left <= 0 && Math.random() < 0.15) {
          const up = clones.find((cl) => cl.bonked == null);
          if (up) say(up, WHIFF);
        }
      }
    },
    key(code) {
      if (g.over) return;
      const i = code in NUMPAD ? NUMPAD[code] : code.startsWith('Digit') ? Number(code.slice(5)) - 1 : -1;
      if (!(i >= 0 && i < 9)) return;
      const cl = upIn(i, 0.2);
      swing(HOLES[i].x, cl ? centerY(cl) - SIZE * 0.3 : HOLES[i].y - 10);
      if (cl) bonk(cl);
      else sound.click();
    },

    // a paid Continue: more time on the clock, same score, same pace
    revive() {
      g.over = false;
      extra += MORE_TIME;
      left = MORE_TIME;
      lastTick = Math.ceil(left);
      next = 0.4;
      reviveFx({ fx, words: sparks, mouth, sound }, W / 2, 250, look.color);
      talk.x = W / 2;
      talk.y = 230;
    },

    update(dt) {
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
      fx.update(dt);
      shake = Math.max(0, shake - dt);
      pollen -= dt;
      if (pollen <= 0) {
        pollen = rand(0.2, 0.5);
        fx.mote(rand(0, W), rand(240, H), '#fff1b8', { vx: rand(-12, 12), vy: rand(-18, -6), r: rand(1, 2), life: rand(2, 4) });
      }
      for (const hm of hammers) hm.age += dt;
      while (hammers.length && hammers[0].age > 0.3) hammers.shift();

      if (!g.over) {
        left -= dt;
        // tick through the last five seconds
        const sec = Math.ceil(left);
        if (sec !== lastTick) {
          lastTick = sec;
          if (sec > 0 && sec <= 5) sound.tick();
        }
        if (left <= 0) {
          left = 0;
          g.over = true;
          for (const cl of clones) cl.end = Math.min(cl.end, cl.age + rise(cl) * RISE);
          if (g.score >= 30) sound.win();
          else sound.bad();
          mouth.say(pick(END), 3);
          talk.x = W / 2;
          talk.y = 230;
        } else {
          next -= dt;
          if (next <= 0) {
            popUp();
            next = interval();
          }
          chat -= dt;
          if (chat <= 0) {
            const up = clones.find((cl) => cl.bonked == null && rise(cl) > 0.8);
            if (up) say(up, IDLE, 0.6);
            chat = rand(4, 7);
          }
        }
      }

      for (const cl of clones) {
        cl.age += dt;
        if (cl.bonked != null) cl.bonked += dt;
        if (cl.age >= cl.end) {
          cl.gone = true;
          if (cl.bonked == null && !cl.heart && !g.over) say(cl, ESCAPE, 0.12);
        }
      }
      for (let i = clones.length - 1; i >= 0; i--) if (clones[i].gone) clones.splice(i, 1);
    },

    draw(c) {
      scenery(c, t);
      c.save();
      if (shake) c.translate(rand(-2, 2) * shake * 10, rand(-2, 2) * shake * 10);

      HOLES.forEach((h, i) => {
        // only what sticks out above the front rim shows
        const cl = clones.find((k) => k.hole === i);
        if (cl) {
          c.save();
          c.beginPath();
          c.rect(h.x - HOLE_W - 30, h.y - SIZE * 2, (HOLE_W + 30) * 2, SIZE * 2);
          c.ellipse(h.x, h.y, HOLE_W, HOLE_H, 0, 0, Math.PI);
          c.clip();
          c.drawImage(inHole(cl, h, centerY(cl), look, t), h.x - BOX_X, h.y - BOX_UP, BOX_X * 2, BOX_UP + BOX_DOWN);
          c.restore();
        }

        // the front rim and its key number
        const lip = rim();
        c.drawImage(lip, h.x - lip.width / 2, h.y - HOLE_H - 6);
        text(c, String(i + 1), h.x + HOLE_W + 4, h.y + HOLE_H + 10, { size: 13, color: 'rgba(255,255,255,0.7)' });
      });
      c.restore();

      for (const hm of hammers) hammer(c, hm);
      fx.draw(c);
      sparks.draw(c);
      // the edges warm up, and pulse red in the last five seconds
      vignette(c, 0.3, '#3a1c08');
      if (!g.over && left < 5) vignette(c, 0.25 + 0.2 * Math.abs(Math.sin(t * 6)), '#c0182a');
      mouth.draw(c, talk.x, talk.y);

      drawScore(c, g.score, `${Math.ceil(left)}s left`);
      if (played() < 2.5) text(c, 'Bonk them. Not the hearts.', W / 2, 166, { size: 16, color: 'rgba(255,255,255,0.9)' });
    },
  };
  return g;
}

/* ---------- art ---------- */

const HORIZON = 228;

// The whole static garden at golden hour, painted once: sky, sun, layered
// hills, a striped lawn, and the nine holes dug into it.
function garden() {
  return sprite('whack:garden', W, H, (c) => {
    // sky
    const sk = c.createLinearGradient(0, 0, 0, HORIZON + 20);
    sk.addColorStop(0, '#2d6fc4');
    sk.addColorStop(0.55, '#79b9ea');
    sk.addColorStop(1, '#ffd9a6');
    c.fillStyle = sk;
    c.fillRect(0, 0, W, HORIZON + 40);
    // low sun behind the hills
    const sun = c.createRadialGradient(110, HORIZON - 30, 0, 110, HORIZON - 30, 260);
    sun.addColorStop(0, 'rgba(255,246,214,1)');
    sun.addColorStop(0.12, 'rgba(255,226,160,0.8)');
    sun.addColorStop(0.5, 'rgba(255,190,120,0.25)');
    sun.addColorStop(1, 'rgba(255,190,120,0)');
    c.fillStyle = sun;
    c.fillRect(0, 0, W, HORIZON + 40);

    // three hill layers, hazier the further away
    const hills = [
      ['#a9c9b6', HORIZON - 40, 0.011, 26, 1.3],
      ['#86b78c', HORIZON - 14, 0.017, 22, 4.1],
      ['#6aa865', HORIZON + 8, 0.024, 14, 2.2],
    ];
    hills.forEach(([col, base, f, amp, ph], i) => {
      const hill = () => {
        c.beginPath();
        c.moveTo(0, HORIZON + 60);
        for (let x = 0; x <= W; x += 8) c.lineTo(x, base - Math.sin(x * f + ph) * amp - Math.sin(x * f * 2.7 + ph) * amp * 0.3);
        c.lineTo(W, HORIZON + 60);
      };
      c.fillStyle = col;
      hill();
      c.fill();
      if (i === 1) {
        // a row of round trees on the middle hill
        for (let k = 0; k < 9; k++) {
          const tx = 20 + k * 55 + hash(k) * 20;
          const ty = base - Math.sin(tx * f + ph) * amp - Math.sin(tx * f * 2.7 + ph) * amp * 0.3;
          const r = 8 + hash(k + 3) * 6;
          c.fillStyle = '#5a6b48';
          c.fillRect(tx - 1.5, ty - r, 3, r + 4);
          const tg = c.createRadialGradient(tx - r * 0.5, ty - r * 2.2, 1, tx, ty - r * 1.5, r * 1.8);
          tg.addColorStop(0, '#a8d08e');
          tg.addColorStop(1, '#5d9461');
          c.fillStyle = tg;
          c.beginPath();
          c.arc(tx, ty - r * 1.7, r, 0, Math.PI * 2);
          c.arc(tx - r * 0.6, ty - r * 1.1, r * 0.75, 0, Math.PI * 2);
          c.arc(tx + r * 0.6, ty - r * 1.15, r * 0.7, 0, Math.PI * 2);
          c.fill();
        }
      }
      hill();
      // sun haze over each far layer
      const hz = c.createLinearGradient(0, base - amp * 1.5, 0, base + 40);
      hz.addColorStop(0, `rgba(255,224,170,${0.35 - i * 0.12})`);
      hz.addColorStop(1, 'rgba(255,224,170,0)');
      c.save();
      c.clip();
      c.fillStyle = hz;
      c.fillRect(0, base - amp * 2, W, 80);
      c.restore();
    });

    // the lawn
    const top = HORIZON + 6;
    const lawn = c.createLinearGradient(0, top, 0, H);
    lawn.addColorStop(0, '#8ccf62');
    lawn.addColorStop(0.4, '#5fae45');
    lawn.addColorStop(1, '#2f7a32');
    c.fillStyle = lawn;
    c.beginPath();
    c.moveTo(0, top + 6);
    c.quadraticCurveTo(W / 2, top - 8, W, top + 6);
    c.lineTo(W, H);
    c.lineTo(0, H);
    c.fill();
    c.save();
    c.clip();
    // mowing stripes, widening towards the viewer
    for (let i = 0; i < 9; i++) {
      if (i % 2) continue;
      c.fillStyle = 'rgba(255,255,220,0.07)';
      c.beginPath();
      const a = (i - 4.5) * 34;
      const b = (i - 3.5) * 34;
      c.moveTo(W / 2 + a, top);
      c.lineTo(W / 2 + b, top);
      c.lineTo(W / 2 + b * 4.2, H);
      c.lineTo(W / 2 + a * 4.2, H);
      c.fill();
    }
    // grass blades
    c.lineCap = 'round';
    for (let i = 0; i < 520; i++) {
      const x = hash(i) * W;
      const y = top + Math.pow(hash(i + 900), 0.8) * (H - top);
      const s = 0.5 + (y - top) / (H - top);
      c.strokeStyle = hash(i + 50) > 0.5 ? 'rgba(30,90,30,0.35)' : 'rgba(200,240,150,0.3)';
      c.lineWidth = 1.2 * s;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + (hash(i + 7) - 0.5) * 5 * s, y - (4 + hash(i + 3) * 6) * s);
      c.stroke();
    }
    // warm light falling across from the sun side
    const lit = c.createLinearGradient(0, top, W, H);
    lit.addColorStop(0, 'rgba(255,220,140,0.22)');
    lit.addColorStop(0.6, 'rgba(255,220,140,0)');
    c.fillStyle = lit;
    c.fillRect(0, top - 10, W, H);
    c.restore();
    // horizon haze line
    const hz = c.createLinearGradient(0, top - 14, 0, top + 30);
    hz.addColorStop(0, 'rgba(255,230,180,0)');
    hz.addColorStop(0.5, 'rgba(255,230,180,0.35)');
    hz.addColorStop(1, 'rgba(255,230,180,0)');
    c.fillStyle = hz;
    c.fillRect(0, top - 14, W, 44);

    // the holes: a dirt mound and a deep dark pit
    for (const h of HOLES) {
      const sh = c.createRadialGradient(h.x, h.y + 14, 10, h.x, h.y + 14, HOLE_W + 30);
      sh.addColorStop(0, 'rgba(10,40,10,0.45)');
      sh.addColorStop(1, 'rgba(10,40,10,0)');
      c.fillStyle = sh;
      c.beginPath();
      c.ellipse(h.x, h.y + 12, HOLE_W + 30, HOLE_H + 22, 0, 0, Math.PI * 2);
      c.fill();
      const mound = c.createLinearGradient(0, h.y - HOLE_H - 6, 0, h.y + HOLE_H + 14);
      mound.addColorStop(0, '#b98457');
      mound.addColorStop(0.5, '#8e5d3b');
      mound.addColorStop(1, '#5b3a24');
      c.fillStyle = mound;
      c.beginPath();
      c.ellipse(h.x, h.y + 4, HOLE_W + 9, HOLE_H + 9, 0, 0, Math.PI * 2);
      c.fill();
      // crumbs of dirt on the mound
      for (let i = 0; i < 14; i++) {
        const a = hash(i + h.x) * Math.PI * 2;
        c.fillStyle = hash(i + h.y) > 0.5 ? 'rgba(60,35,20,0.5)' : 'rgba(220,170,120,0.45)';
        c.beginPath();
        c.arc(h.x + Math.cos(a) * (HOLE_W + 4), h.y + 4 + Math.sin(a) * (HOLE_H + 4), 1.5 + hash(i) * 1.5, 0, Math.PI * 2);
        c.fill();
      }
      const pit = c.createRadialGradient(h.x, h.y + 6, 2, h.x, h.y, HOLE_W);
      pit.addColorStop(0, '#050302');
      pit.addColorStop(0.7, '#1c120b');
      pit.addColorStop(1, '#3a2617');
      c.fillStyle = pit;
      c.beginPath();
      c.ellipse(h.x, h.y, HOLE_W, HOLE_H, 0, 0, Math.PI * 2);
      c.fill();
      // the far inner wall catches a bit of light
      c.strokeStyle = 'rgba(160,110,70,0.5)';
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(h.x, h.y + 2, HOLE_W - 3, HOLE_H - 3, 0, Math.PI + 0.25, -0.25);
      c.stroke();
    }
  });
}

// The near lip of a hole, drawn over whatever is popping out of it.
function rim() {
  return sprite('whack:rim', (HOLE_W + 14) * 2, HOLE_H * 2 + 30, (c) => {
    const cx = HOLE_W + 14;
    const cy = HOLE_H + 6;
    c.lineCap = 'round';
    const g = c.createLinearGradient(0, cy, 0, cy + HOLE_H + 8);
    g.addColorStop(0, '#c99566');
    g.addColorStop(1, '#6e4529');
    c.strokeStyle = g;
    c.lineWidth = 8;
    c.beginPath();
    c.ellipse(cx, cy, HOLE_W + 2, HOLE_H + 2, 0, 0.08, Math.PI - 0.08);
    c.stroke();
    c.strokeStyle = 'rgba(255,225,180,0.55)';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(cx, cy - 2, HOLE_W + 1, HOLE_H, 0, 0.3, Math.PI - 0.3);
    c.stroke();
  });
}

// A clone drawn on its own little canvas, so the hole's shadow can darken
// just the clone (source-atop) and not the lawn around it.
const BOX_X = 100;
const BOX_UP = 190;
const BOX_DOWN = 40;
const RES = 2;
let scratch = null;
function inHole(cl, h, y, look, t) {
  scratch ??= makeCanvas(BOX_X * 2 * RES, (BOX_UP + BOX_DOWN) * RES);
  const s = scratch.getContext('2d');
  s.setTransform(1, 0, 0, 1, 0, 0);
  s.clearRect(0, 0, scratch.width, scratch.height);
  s.setTransform(RES, 0, 0, RES, (BOX_X - h.x) * RES, (BOX_UP - h.y) * RES);
  clone(s, cl, h.x, y, look, t);
  // it gets darker the deeper it sits in the hole
  s.globalCompositeOperation = 'source-atop';
  s.drawImage(depth(), h.x - BOX_X, h.y - 40, BOX_X * 2, 40 + BOX_DOWN);
  s.globalCompositeOperation = 'source-over';
  return scratch;
}

// A shadow band that darkens a clone where it sinks into the hole.
function depth() {
  return sprite('whack:depth', 4, 64, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, 'rgba(20,10,5,0)');
    g.addColorStop(1, 'rgba(20,10,5,0.75)');
    c.fillStyle = g;
    c.fillRect(0, 0, 4, 64);
  });
}

// A soft drifting cloud.
function puffSprite() {
  return sprite('whack:puff', 220, 110, (c) => {
    const g = c.createLinearGradient(0, 20, 0, 100);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(255,214,190,0.75)');
    c.fillStyle = g;
    c.shadowColor = 'rgba(255,255,255,0.7)';
    c.shadowBlur = 14;
    c.beginPath();
    for (const [x, y, r] of [
      [60, 70, 26],
      [100, 52, 34],
      [146, 64, 28],
      [120, 78, 24],
      [80, 82, 20],
    ]) {
      c.moveTo(x + r, y);
      c.arc(x, y, r, 0, Math.PI * 2);
    }
    c.fill();
  });
}

function scenery(c, t) {
  c.drawImage(garden(), 0, 0);
  const p = puffSprite();
  for (let i = 0; i < 3; i++) {
    const x = ((i * 190 + t * (6 + i * 3)) % (W + 240)) - 220;
    c.globalAlpha = 0.7 - i * 0.12;
    c.drawImage(p, x, 40 + i * 52, 220 * (0.9 - i * 0.15), 110 * (0.9 - i * 0.15));
  }
  c.globalAlpha = 1;
  rays(c, 110, HORIZON - 30, 420, '#ffe6b0', 0.16, t * 0.03);
}

function clone(c, cl, x, y, look, t) {
  const bonked = cl.bonked != null;
  const squash = bonked ? 0.3 * Math.max(0, 1 - cl.bonked / 0.35) : 0;
  if (cl.heart && !bonked) glow(c, x + SIZE * 0.44, y - SIZE * 0.02, 46, '#ff4f7b', 0.55 + Math.sin(t * 8) * 0.15);
  drawBobby(c, x, y, SIZE, {
    look,
    t: t + cl.hole, // so the clones don't all blink together
    squash,
    flash: bonked && cl.bonked < 0.08,
    mood: bonked ? (cl.heart ? 'sad' : 'closed') : cl.mood,
    tears: bonked && cl.heart,
  });
  if (cl.heart) {
    // a stubby arm holding the heart out to you
    c.strokeStyle = look.dark;
    c.lineWidth = 5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x + SIZE * 0.3, y + SIZE * 0.1);
    c.lineTo(x + SIZE * 0.42, y + SIZE * 0.02);
    c.stroke();
    const beat = 1 + Math.sin(t * 8) * 0.08;
    heart(c, x + SIZE * 0.44, y - SIZE * 0.02, 13 * beat, bonked ? '#b0496a' : '#ff4f7b', '#fff');
    if (!bonked) {
      c.fillStyle = 'rgba(255,255,255,0.75)';
      c.beginPath();
      c.ellipse(x + SIZE * 0.4, y - SIZE * 0.07, 3, 2, -0.6, 0, Math.PI * 2);
      c.fill();
    }
  } else if (bonked) {
    // little glowing stars spinning round its head
    for (let i = 0; i < 3; i++) {
      const a = t * 7 + (i * Math.PI * 2) / 3;
      const sx = x + Math.cos(a) * SIZE * 0.32;
      const sy = y - SIZE * 0.55 + Math.sin(a) * 6;
      glow(c, sx, sy, 16, '#ffd84d', 0.8);
      c.fillStyle = '#fff3a0';
      star(c, sx, sy, 5, a);
    }
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

// A shaded mallet, cached once and swung with a motion smear.
function malletSprite() {
  return sprite('whack:mallet', 80, 120, (c) => {
    c.translate(40, 100); // the grip end of the handle
    const L = 70;
    const hg = c.createLinearGradient(-5, 0, 5, 0);
    hg.addColorStop(0, '#7a4f25');
    hg.addColorStop(0.4, '#d9a464');
    hg.addColorStop(1, '#8a5a2c');
    c.fillStyle = hg;
    rr(c, -4, -L, 8, L + 16, 4);
    c.fill();
    c.fillStyle = 'rgba(40,20,10,0.5)';
    for (let i = 0; i < 3; i++) c.fillRect(-4, 4 + i * 4, 8, 1.5);
    const head = c.createLinearGradient(0, -L - 14, 0, -L + 14);
    head.addColorStop(0, '#ff7a6a');
    head.addColorStop(0.45, '#d8433a');
    head.addColorStop(1, '#8e1f1a');
    c.fillStyle = head;
    rr(c, -28, -L - 14, 56, 28, 7);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.45)';
    rr(c, -22, -L - 11, 40, 5, 2.5);
    c.fill();
    const band = c.createLinearGradient(0, -L - 14, 0, -L + 14);
    band.addColorStop(0, '#ffffff');
    band.addColorStop(0.5, '#c9ccd6');
    band.addColorStop(1, '#6f7380');
    c.fillStyle = band;
    rr(c, -31, -L - 15, 8, 30, 3);
    c.fill();
    rr(c, 23, -L - 15, 8, 30, 3);
    c.fill();
  });
}

function hammer(c, hm) {
  const L = 70;
  const rest = -0.6;
  // a quick swing down onto the tapped point, then it fades away
  const a = hm.age < 0.07 ? 0.5 + (rest - 0.5) * (hm.age / 0.07) : rest;
  c.save();
  c.globalAlpha = clamp((0.3 - hm.age) / 0.12, 0, 1);
  c.translate(hm.x - L * Math.sin(rest), hm.y + L * Math.cos(rest));
  if (hm.age < 0.12) {
    // a pale smear along the arc of the swing
    c.globalAlpha *= 1 - hm.age / 0.12;
    c.strokeStyle = 'rgba(255,255,255,0.55)';
    c.lineWidth = 26;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(0, 0, L, -Math.PI / 2 + rest, -Math.PI / 2 + Math.max(rest, a) + 0.01, false);
    c.stroke();
    c.globalAlpha = clamp((0.3 - hm.age) / 0.12, 0, 1);
  }
  c.rotate(a);
  c.drawImage(malletSprite(), -40, -100);
  c.restore();
}
