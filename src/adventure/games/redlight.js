import { W, H, rand, pick, clamp, rr, text, drawBobby, drawScore, Mouth, Sparks, reviveFx, blinkAlpha, layer } from '../kit';
import { Fx, sprite, glow, shadow, vignette } from '../fx';

// Freeze!: the button sneaks down a hallway toward a giant angry cursor. Hold
// to run while it faces away. When it twitches, let go. Caught moving = over.
const BX = 240; // the button never leaves this spot, the hallway moves
const BY = 565;
const CX = 240;
const CY = 345;
const SIZE = 96;
const SAFE = 2.2; // seconds of blinking safety after a paid Continue
const REACT = 0.6; // how far round the cursor must be to catch you
const S = 0.2; // hallway units that scroll by per meter

const SNEAK = ['I see nothing.', 'Just a casual stroll.', 'Nothing to see here.', 'Totally invisible.', 'La la la.'];
const FREEZE = ['Statue. I am a statue.', 'Not moving. At all.', 'Was never here.', 'Uh oh uh oh uh oh.'];
const STARE = ['Was that you?', 'I heard something.', 'Who clicked?', 'Hmm. Suspicious.', 'Show yourself.'];
const FAKED = ['Just kidding.', 'Gotcha. Almost.', 'Jumpy, are we?', 'Ha. You flinched.'];
const FAKE_BTN = ['Jerk.', 'That was cheating.', 'I hate you.', 'My nerves!'];
const CAUGHT = ['GOTCHA.', 'CLICKED.', 'I SAW THAT.', 'Left click. Left you.'];
const CAUGHT_BTN = ['I can explain.', 'It was the wind.', 'Not me. Another button.', 'Oof.'];
const MILE = ['Still alive.', 'Look at me go.', 'Am I famous yet?', 'Do not look back.'];

const ease = (k) => {
  k = clamp(k, 0, 1);
  return k * k * (3 - 2 * k);
};

export default function redlight({ look, sound, keys }) {
  const bm = new Mouth(); // the button
  const cm = new Mouth(); // the cursor
  const sparks = new Sparks();
  const fx = new Fx();
  let t = 0;
  let dist = 0;
  let speed = 0;
  let ptr = false;
  let st = 'away'; // away | warn | turn | stare | back | fake
  let stT = 0;
  let dur = 2.4; // how long the current phase lasts
  let fake = false;
  let f = 0; // 0 facing away .. 1 facing you
  let safe = 0;
  let shake = 0;
  let flash = 0;
  let lunge = 0;
  let kick = 0; // squash when you stop short
  let tickT = 0;
  let dust = 0;
  let quipT = 0.4;
  let miles = 0;
  let wasRun = false;
  let first = true;

  const held = () => !!(ptr || keys?.has('Space') || keys?.has('ArrowUp') || keys?.has('KeyW'));
  // later rounds: shorter green phases and warnings, more fake-outs
  const green = () => rand(clamp(2.9 - dist / 260, 1.1, 2.9), clamp(4.2 - dist / 220, 1.9, 4.2));
  const warnTime = () => clamp(0.8 - dist / 1400, 0.5, 0.8);
  const stareTime = () => rand(clamp(1.5 - dist / 900, 0.9, 1.5), clamp(2.0 - dist / 800, 1.2, 2.0));
  const fakeChance = () => clamp((dist - 60) / 700, 0, 0.35);
  const top = () => clamp(14 + dist / 50, 14, 26); // m/s

  const goto = (s, d) => {
    st = s;
    stT = 0;
    if (d != null) dur = d;
  };
  const sayB = (lines, sec = 1.6) => {
    if (bm.left <= 0) bm.say(pick(lines), sec);
  };

  const caught = () => {
    g.over = true;
    speed = 0;
    shake = 0.55;
    flash = 0.35;
    st = 'stare';
    f = 1;
    sound.bad?.();
    sound.crash?.();
    fx.burst(BX, BY - 20, '#ff3b3b', 26, 380);
    fx.burst(BX, BY - 20, '#ffd84d', 12, 300);
    fx.ring(BX, BY - 20, '#ff6a5a', 130, 0.5, 10);
    fx.ring(CX, CY, '#ff3b3b', 200, 0.6, 12);
    cm.say(pick(CAUGHT), 2.6);
    bm.say(pick(CAUGHT_BTN), 2.6);
  };

  const g = {
    score: 0,
    over: false,
    down() {
      ptr = true;
    },
    up() {
      ptr = false;
    },

    // a paid Continue: same meters, the cursor looks away, a blink of safety
    revive() {
      g.over = false;
      safe = SAFE;
      ptr = false;
      speed = 0;
      lunge = 0;
      fake = false;
      f = 0;
      goto('away', 2.6);
      reviveFx({ fx, words: sparks, mouth: bm, sound }, BX, BY - 30, look.color);
      cm.line = null;
    },

    update(dt) {
      dt = clamp(dt, 0, 0.05);
      t += dt;
      bm.update(dt);
      cm.update(dt);
      sparks.update(dt);
      fx.update(dt);
      shake = Math.max(0, shake - dt);
      flash = Math.max(0, flash - dt);
      kick = Math.max(0, kick - dt * 4);
      safe = Math.max(0, safe - dt);
      if (g.over) lunge = Math.min(1, lunge + dt * 6);

      if (!g.over) {
        stT += dt;
        // ---- the cursor's mood swings ----
        if (st === 'away') {
          f = 0;
          if (stT >= dur) {
            fake = Math.random() < fakeChance();
            goto('warn', warnTime());
            tickT = 0;
            sound.tick?.();
            if (speed > 2) sayB(FREEZE, 1.2);
          }
        } else if (st === 'warn') {
          f = 0.16 * Math.abs(Math.sin(stT * 24));
          tickT -= dt;
          if (tickT <= 0) {
            tickT = 0.14;
            sound.tick?.();
          }
          if (stT >= dur) goto(fake ? 'fake' : 'turn', fake ? 0.3 : 0.16);
          if (st === 'fake') {
            cm.say(pick(FAKED), 1.4);
            if (speed < 2) sayB(FAKE_BTN, 1.4);
          }
        } else if (st === 'turn') {
          f = 0.16 + 0.84 * ease(stT / dur);
          if (stT >= dur) {
            goto('stare', stareTime());
            f = 1;
            sound.nope?.();
            shake = 0.1;
            cm.say(pick(STARE), Math.min(1.4, dur));
          }
        } else if (st === 'stare') {
          f = 1;
          if (stT >= dur) goto('back', 0.4);
        } else if (st === 'back') {
          f = 1 - ease(stT / dur);
          if (stT >= dur) goto('away', green());
        } else if (st === 'fake') {
          f = 0.3 * (1 - ease(stT / dur));
          if (stT >= dur) goto('away', rand(0.9, 1.8));
        }

        // ---- running ----
        const run = held();
        if (run) speed = Math.min(top(), speed + 60 * dt);
        else {
          if (speed > 6) kick = 0.5;
          speed = Math.max(0, speed - 300 * dt);
        }
        if (run && !wasRun && first && t > 0.1) {
          first = false;
          sayB(SNEAK, 2);
        }
        wasRun = run;
        dist += speed * dt;
        g.score = Math.floor(dist);

        // ---- busted? ----
        if (!safe && f >= REACT && (st === 'turn' || st === 'stare') && (run || speed > 4)) caught();

        // ---- juice ----
        if (speed > 3) {
          dust -= dt;
          if (dust <= 0) {
            dust = 0.05;
            fx.mote(BX + rand(-26, 26), BY + 44, '#d9d2e6', { vx: rand(-30, 30), vy: rand(10, 40), r: rand(2, 4), life: rand(0.3, 0.6), add: false });
          }
        }
        const m = Math.floor(dist / 100);
        if (m > miles) {
          miles = m;
          sound.ring?.();
          sparks.float(BX, BY - 100, `${m * 100} m!`, '#ffe27a');
          fx.ring(BX, BY - 10, '#ffe27a', 90, 0.4);
          if (m % 2 === 0) sayB(MILE, 1.6);
        }
        quipT -= dt;
        if (quipT <= 0) {
          quipT = rand(6, 10);
          if (st === 'away' && speed > 8) sayB(SNEAK, 1.6);
        }
      }
    },

    draw(c) {
      c.save();
      if (shake) c.translate(rand(-1, 1) * shake * 14, rand(-1, 1) * shake * 14);
      const warn = st === 'warn' || st === 'turn';
      const staring = f >= REACT;

      hall(c, dist);
      c.drawImage(fog(), 0, 0, W, H);
      milestone(c, dist);

      // speed lines streaming out of the vanishing point
      if (speed > 6) {
        const k = speed / 26;
        c.lineCap = 'round';
        c.strokeStyle = `rgba(255,255,255,${0.18 * k})`;
        c.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 + 0.3;
          const r = 150 + (((t * 280 * k + i * 71) % 330) | 0);
          const ca = Math.cos(a);
          const sa = Math.sin(a);
          c.beginPath();
          c.moveTo(CX + ca * r, 240 + sa * r * 1.2);
          c.lineTo(CX + ca * (r + 26 * k), 240 + sa * (r + 26 * k) * 1.2);
          c.stroke();
        }
      }

      // the cursor: green glow when it is safe, red when it sees you
      const col = staring ? '#ff2d2d' : warn ? '#ffb020' : '#58e07a';
      const pulse = warn ? 0.7 + 0.3 * Math.sin(t * 30) : 0.45;
      glow(c, CX, CY, 190 + lunge * 80, col, staring ? 0.8 : pulse);
      shadow(c, CX, 446, 70 + lunge * 20, 0.5, 14);
      cursor(c, f, t, warn, lunge);
      if (warn && !g.over) {
        // the '!' pops over its shoulder
        const bob = Math.abs(Math.sin(t * 18)) * 8;
        c.fillStyle = '#e8262d';
        c.beginPath();
        c.arc(CX + 96, CY - 70 - bob, 26, 0, Math.PI * 2);
        c.fill();
        c.lineWidth = 3;
        c.strokeStyle = '#fff';
        c.stroke();
        text(c, '!', CX + 96, CY - 68 - bob, { size: 38, color: '#fff' });
      }

      // the button
      const sp = clamp(speed / 26, 0, 1);
      const run = sp > 0.1;
      const bob = run ? Math.abs(Math.sin(t * 13)) * 9 * sp : 0;
      const sq = run ? Math.sin(t * 26) * 0.05 * sp : kick * 0.18 * Math.sin(kick * 18);
      shadow(c, BX, BY + 46, 44 - bob, 0.45, 11);
      const mood = g.over ? 'shout' : run ? 'smug' : staring || warn ? 'worried' : 'calm';
      c.save();
      c.globalAlpha = blinkAlpha(safe, t);
      drawBobby(c, BX, BY - bob, SIZE, {
        look,
        t,
        mood,
        squash: g.over ? 0.12 : sq,
        moving: run,
        angle: run ? Math.sin(t * 13) * 0.07 * sp : g.over ? 0.2 : 0,
        facing: 0,
        tears: g.over,
        flash: flash > 0.28,
      });
      c.restore();

      fx.draw(c);
      sparks.draw(c);
      c.restore();

      vignette(c, 0.4, '#05060c');
      if (staring) vignette(c, g.over ? 0.55 : 0.4, '#d01818');
      else if (warn) vignette(c, 0.15 + 0.15 * Math.abs(Math.sin(t * 24)), '#d08010');
      if (flash > 0) {
        c.globalAlpha = flash * 1.4;
        c.fillStyle = '#ff3030';
        c.fillRect(0, 0, W, H);
        c.globalAlpha = 1;
      }

      cm.draw(c, CX, 248);
      bm.draw(c, BX, BY - SIZE * 0.62);
      drawScore(c, g.score, 'meters');
      if (t < 4 && !g.over) text(c, 'Hold to run. Freeze when it turns!', W / 2, 170, { size: 16, color: 'rgba(255,255,255,0.92)' });

      // a hold button that doubles as the traffic light
      if (!g.over) {
        const hold = held();
        const bad = staring || warn;
        c.save();
        c.globalAlpha = 0.9;
        c.fillStyle = bad ? '#d92d34' : hold ? '#2fae5a' : '#3a4a66';
        rr(c, W / 2 - 120, 720, 240, 54, 27);
        c.fill();
        c.lineWidth = 3;
        c.strokeStyle = 'rgba(255,255,255,0.65)';
        c.stroke();
        c.restore();
        text(c, staring ? "DON'T MOVE" : warn ? 'FREEZE!' : hold ? 'RUNNING' : 'HOLD TO RUN', W / 2, 747, { size: 22, color: '#fff' });
      }
    },
  };
  return g;
}

/* ---------- art ---------- */

const HOR = 230; // horizon line
const A = 570; // how far the floor drops below the horizon at depth 0
const HW = 600;
const CEIL = 0.8;
const FAR = 14;

// A point on the hallway: side -1..1 across, depth d ahead, h 0 (floor) .. 1 (ceiling).
const P = (side, d, h) => {
  const s = 1 / (d + 1);
  const yf = HOR + A * s;
  return [CX + side * HW * s, yf + (HOR - A * s * CEIL - yf) * h];
};
function poly(c, col, ...pts) {
  c.fillStyle = col;
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}
// a rectangle laid on a wall (or the floor/ceiling) between two depths
const wall = (c, col, side, d1, d2, h1, h2) => poly(c, col, P(side, d1, h1), P(side, d2, h1), P(side, d2, h2), P(side, d1, h2));

// walls, ceiling, far door: the part of the hallway that never moves
function hallBase() {
  return layer('redlight:hall', (c) => {
    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#10131f');
    bg.addColorStop(1, '#1a1f30');
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);
    poly(c, '#171c2a', P(-1, 0, 1), P(1, 0, 1), P(1, FAR, 1), P(-1, FAR, 1));
    wall(c, '#35566e', -1, 0, FAR, 0, 1);
    wall(c, '#2d4a60', 1, 0, FAR, 0, 1);
    wall(c, '#223548', -1, 0, FAR, 0, 0.26);
    wall(c, '#1b2b3b', 1, 0, FAR, 0, 0.26);
    // the glowing exit at the far end
    const [x1, y1] = P(-1, FAR, 0);
    const [x2, y2] = P(1, FAR, 1);
    const ex = c.createRadialGradient(CX, 245, 2, CX, 245, 60);
    ex.addColorStop(0, '#f6fbff');
    ex.addColorStop(0.5, '#a5d4ff');
    ex.addColorStop(1, '#3b5a82');
    c.fillStyle = ex;
    c.fillRect(x1, y2, x2 - x1, y1 - y2);
  });
}

// the soft murk that swallows the far end of the hall
function fog() {
  return sprite('redlight:fog', W, H, (c) => {
    const g = c.createRadialGradient(CX, 252, 10, CX, 252, 260);
    g.addColorStop(0, 'rgba(18,22,36,0.9)');
    g.addColorStop(0.5, 'rgba(18,22,36,0.5)');
    g.addColorStop(1, 'rgba(18,22,36,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  });
}

function hall(c, dist) {
  c.drawImage(hallBase(), 0, 0, W, H);
  const u = dist * S;
  const base = Math.floor(u);
  const frac = u - base;
  for (let j = FAR; j >= 0; j--) {
    const idx = base + j;
    const d1 = Math.max(0, j - frac);
    const d2 = j + 1 - frac;
    if (d2 <= 0) continue;
    const odd = idx % 2 !== 0;
    // floor boards with a red carpet runner down the middle
    poly(c, odd ? '#3b3350' : '#342d49', P(-1, d1, 0), P(1, d1, 0), P(1, d2, 0), P(-1, d2, 0));
    poly(c, odd ? '#8a2b3d' : '#7a2535', P(-0.42, d1, 0), P(0.42, d1, 0), P(0.42, d2, 0), P(-0.42, d2, 0));
    poly(c, '#d8b45a', P(-0.44, d1, 0), P(-0.42, d1, 0), P(-0.42, d2, 0), P(-0.44, d2, 0));
    poly(c, '#d8b45a', P(0.42, d1, 0), P(0.44, d1, 0), P(0.44, d2, 0), P(0.42, d2, 0));
    if (odd) {
      wall(c, 'rgba(255,255,255,0.05)', -1, d1, d2, 0.26, 1);
      wall(c, 'rgba(255,255,255,0.03)', 1, d1, d2, 0.26, 1);
    }
    // doors on the left, posters on the right
    const m3 = ((idx % 3) + 3) % 3;
    const m4 = ((idx % 4) + 4) % 4;
    if (m3 === 0) {
      wall(c, '#5b3f26', -1, d1 + 0.12, d2 - 0.12, 0, 0.74);
      wall(c, '#7c5733', -1, d1 + 0.2, d2 - 0.2, 0.05, 0.69);
      const [hx, hy] = P(-1, d2 - 0.28, 0.36);
      c.fillStyle = '#f2c14e';
      c.beginPath();
      c.arc(hx, hy, 2 + 6 / (d1 + 1), 0, Math.PI * 2);
      c.fill();
    }
    if (m4 === 1) {
      wall(c, '#f3e7b8', 1, d1 + 0.2, d2 - 0.2, 0.42, 0.78);
      wall(c, '#c0392b', 1, d1 + 0.34, d2 - 0.34, 0.52, 0.68);
    }
    // ceiling lamps
    if (!odd) {
      poly(c, '#fff3c4', P(-0.2, d1 + 0.2, 1), P(0.2, d1 + 0.2, 1), P(0.2, d2 - 0.2, 1), P(-0.2, d2 - 0.2, 1));
      const [lx, ly] = P(0, (d1 + d2) / 2, 1);
      glow(c, lx, ly + 18 / (d1 + 1), 150 / (d1 + 1.6), '#ffe9a0', 0.4);
    }
  }
}

// a "100 m" banner hanging over the next hundred-meter mark
function milestone(c, dist) {
  const m = (Math.floor(dist / 100) + 1) * 100;
  const d = (m - dist) * S;
  if (d < 0.05 || d > FAR) return;
  const [lx, ly] = P(-1, d, 0.94);
  const [rx, ry] = P(1, d, 0.94);
  const [, by] = P(0, d, 0.7);
  const s = 1 / (d + 1);
  c.globalAlpha = clamp((FAR - d) / 5, 0, 1);
  c.fillStyle = '#ffd84d';
  c.fillRect(lx, ly, rx - lx, by - ly);
  c.fillStyle = '#1c1a26';
  c.fillRect(lx, by - 3 * s - 1, rx - lx, 3 * s + 1);
  text(c, `${m} m`, CX, (ly + by) / 2 - 1, { size: Math.max(8, Math.round(120 * s)), color: '#1c1a26' });
  c.globalAlpha = 1;
}

// One cursor arrow, cached facing away (f=0) or facing you (f=1).
function cursorImg(front) {
  const K = 2;
  return sprite(`redlight:cursor:${front ? 'f' : 'b'}`, 170 * K, 230 * K, (c) => {
    c.scale(K, K);
    c.translate(22, 22);
    c.scale(6, 6);
    const path = () => {
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, 26);
      c.lineTo(7, 20);
      c.lineTo(12, 31);
      c.lineTo(17, 28.5);
      c.lineTo(12, 18);
      c.lineTo(21, 18);
      c.closePath();
    };
    const gr = c.createLinearGradient(0, 0, 21, 31);
    if (front) {
      gr.addColorStop(0, '#ffffff');
      gr.addColorStop(1, '#d4d9e6');
    } else {
      gr.addColorStop(0, '#aab2c8');
      gr.addColorStop(1, '#6e7690');
    }
    c.lineJoin = 'round';
    path();
    c.fillStyle = gr;
    c.fill();
    c.lineWidth = 0.9;
    c.strokeStyle = '#14121c';
    c.stroke();
    if (!front) {
      // a fold line down the back
      c.strokeStyle = 'rgba(20,20,40,0.3)';
      c.lineWidth = 0.4;
      c.beginPath();
      c.moveTo(2.2, 3);
      c.lineTo(2.2, 22);
      c.moveTo(4.5, 19.5);
      c.lineTo(10, 28);
      c.stroke();
      return;
    }
    // furious face
    c.fillStyle = '#fff';
    c.strokeStyle = '#14121c';
    c.lineWidth = 0.4;
    for (const ex of [5, 10.8]) {
      c.beginPath();
      c.ellipse(ex, 14.5, 2.1, 2.6, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }
    c.fillStyle = '#d4141c';
    for (const ex of [5.3, 10.5]) {
      c.beginPath();
      c.arc(ex, 15, 1, 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = '#14121c';
    c.lineWidth = 0.8;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(2.2, 11.2);
    c.lineTo(6.6, 13);
    c.moveTo(12.6, 11.4);
    c.lineTo(9, 13);
    c.moveTo(3, 19);
    c.lineTo(4.4, 18.2);
    c.lineTo(5.8, 19.2);
    c.lineTo(7.2, 18.2);
    c.lineTo(8.6, 19.2);
    c.lineTo(10, 18.4);
    c.stroke();
  });
}

// The cursor at f: turning round is a squeeze through its edge-on moment.
function cursor(c, f, t, warn, lunge) {
  const front = f > 0.5;
  const sx = Math.max(0.06, Math.abs(Math.cos(f * Math.PI)));
  const sc = 1 + lunge * 0.35 + (warn ? Math.sin(t * 30) * 0.015 : 0);
  const sway = warn ? Math.sin(t * 34) * 0.07 : Math.sin(t * 1.6) * 0.03;
  c.save();
  c.translate(CX, CY + Math.sin(t * 2) * 3 - lunge * 20);
  c.rotate(sway);
  c.scale(sx * sc, sc);
  c.drawImage(cursorImg(front), -85, -115, 170, 230);
  c.restore();
}
