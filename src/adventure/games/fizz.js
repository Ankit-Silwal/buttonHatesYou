import { W, H, rand, pick, clamp, rr, heart, text, drawBobby, drawScore, Mouth, Sparks, reviveFx, layer, vignette, sprite, glow, shadow, hash } from '../kit';
import { Fx, rays } from '../fx';

// Shaken Not Stirred: the button holds a soda. Drag it back and forth to build
// pressure, then let go while the meter is in the green. Too little is a sad
// fizzle, too much (past the red line) is a face full of soda. 3 lives.
const LIVES = 3;
const BTN = { x: 150, y: 590, size: 150 };
const BOT = { x: 322, y: 565 };
const NECK = -108; // neck top, relative to the bottle's centre
const GX = 432; // pressure gauge: a tube on the right edge
const GW = 34;
const GT = 190;
const GB = 700;
const GH = GB - GT;
const MAXTRAVEL = 3800; // px of shaking per second that count (caps the pace)
const K = 0.00018; // pressure per px of shaking
const GRAV = 920;

const LABELS = [
  { lines: ['Cola-ish'], c1: '#d8433a', c2: '#fff1d6', liq: ['#7a3a16', '#2c1006'], cap: '#d8433a' },
  { lines: ['Sparkling', 'Regret'], c1: '#7d4fd0', c2: '#ffe0ff', liq: ['#a23ec2', '#4a1366'], cap: '#ffd84d' },
  { lines: ['Mystery', 'Fizz'], c1: '#2e9e5b', c2: '#eaffd9', liq: ['#6fd05a', '#1f6b2b'], cap: '#2e9e5b' },
  { lines: ['Fizzy Lifting', 'Drink'], c1: '#ef8a1c', c2: '#fff3d0', liq: ['#ffb02e', '#b85a06'], cap: '#ef8a1c' },
  { lines: ['Burp', 'Cola'], c1: '#2d7fd0', c2: '#e6f4ff', liq: ['#5a2e18', '#220c04'], cap: '#2d7fd0' },
  { lines: ['Pop Star', 'Zero'], c1: '#e0457f', c2: '#ffe3ef', liq: ['#ff6d9c', '#a3144a'], cap: '#e0457f' },
];

// what each way of letting go does: seconds of spray, particles per second,
// spread (radians), lean (towards the button), speed range
const SHAPES = {
  good: { D: 1.05, rate: 780, spread: 0.15, lean: -0.14, sp: [520, 760] },
  perfect: { D: 1.55, rate: 1000, spread: 0.17, lean: -0.14, sp: [600, 900] },
  gush: { D: 0.8, rate: 480, spread: 0.6, lean: -0.1, sp: [250, 520] },
  fizzle: { D: 0.65, rate: 110, spread: 0.55, lean: 0, sp: [80, 220] },
  boom: { D: 0.55, rate: 420, spread: 1.0, lean: -2.2, sp: [220, 720] },
};

const NERVOUS = ['It is getting warm in here.', 'Easy on the shaking.', 'I do not like this bottle.', 'That sounded angry.'];
const PANIC = ['NO NO NO NO', 'LET GO LET GO', 'It is ALIVE.', 'Too much! TOO MUCH!'];
const GOOD = ['Whoa. Pretty.', 'Fizzy. Fabulous.', 'I regret nothing.', 'Okay, that was cool.', 'Sticky. Victorious.'];
const PERFECT = ['PERFECT. I hate that.', 'A masterpiece.', 'Chef kiss.'];
const FIZZLE = ['Pfft. Is that it?', 'A sad little hiss.', 'Flat. Like my hopes.'];
const GUSH = ['Too much. Not enough. Wrong.', 'Messy. So messy.', 'Overcooked.'];
const BOOM = ['My FACE.', 'Soda everywhere. Mostly on my face.', 'I am wearing it now.', 'Why. WHY.'];
const IDLE = ['Shake it. I dare you.', 'It is just a bottle. Right?', 'Go on. I will wait.'];
const END = ['Out of soda. Out of luck.', 'Sticky and defeated.', 'Never again.'];

const ease = (k) => 1 - (1 - clamp(k, 0, 1)) ** 3;
const edge = (c, str, x, y, size, color) => {
  text(c, str, x, y + 2, { size, color: 'rgba(30,14,40,0.5)' });
  text(c, str, x, y, { size, color });
};

export default function fizz({ look, sound }) {
  const mouth = new Mouth();
  const sparks = new Sparks();
  const fx = new Fx();
  const drops = [];
  const splats = [];
  const stains = []; // soda on the button's face, button-relative
  let t = 0;
  let lives = LIVES;
  let label = Math.floor(rand(0, LABELS.length));
  let phase = 'play'; // in (new bottle slides in) | play | pop | dead
  let pt = 0;
  let o = null; // how the last bottle ended
  let p = 0; // pressure, 0..1 (1 = boom)
  let zc = 0.7;
  let zw = 0.27;
  let leak = 0.07;
  let holding = false;
  let px = 0;
  let py = 0;
  let acc = 0; // shaking not yet turned into pressure
  let rate = 0; // smoothed shaking intensity 0..1
  let lastSide = 0;
  let lastLvl = 0;
  let said = 0;
  let ox = 0; // bottle slides in/out sideways
  let recoil = 0;
  let jx = 0;
  let jy = 0;
  let ja = 0;
  let cap = null;
  let emitAcc = 0;
  let shake = 0;
  let flash = 0;
  let squash = 0;
  let rayT = 0;
  let banner = null;
  let chat = 5;
  const talk = { x: BTN.x, y: 488 };
  const say = (lines, sec) => mouth.say(pick(lines), sec);

  const zlo = () => zc - zw / 2;
  const zhi = () => zc + zw / 2;
  const neck = () => {
    const b = bottlePos();
    return { x: b.x + Math.sin(b.a) * -NECK, y: b.y + Math.cos(b.a) * NECK };
  };
  const bottlePos = () => ({ x: BOT.x + ox + jx, y: BOT.y + jy + recoil * 14, a: ja + recoil * 0.12 });

  // a fresh bottle: the green zone shrinks and the pressure leaks faster as you score
  const newRound = (first) => {
    const n = g.score;
    zw = Math.max(0.07, 0.27 - 0.02 * n);
    zc = rand(0.32 + zw / 2, 0.88 - zw / 2);
    leak = Math.min(0.28, 0.07 + 0.014 * n);
    label = (label + 1) % LABELS.length;
    p = 0;
    holding = false;
    acc = 0;
    rate = 0;
    said = 0;
    lastLvl = 0;
    cap = null;
    o = null;
    recoil = 0;
    phase = first ? 'play' : 'in';
    pt = 0;
    ox = first ? 0 : 360;
    chat = rand(4, 6);
  };

  const spawn = (x, y, a, sp, kind) => {
    if (drops.length >= 520) return;
    const life = kind ? rand(0.5, 1.1) : 9;
    drops.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: kind ? rand(5, 9) : rand(1.6, 4.2), kind, life, max: life, floor: rand(690, 775) });
  };

  const addTravel = (d) => {
    if (g.over || phase !== 'play' || !(d > 0)) return;
    acc = Math.min(acc + d, 900);
  };

  // let go of the cap
  const pop = (pp) => {
    holding = false;
    acc = 0;
    const hit = pp >= zlo() && pp <= zhi();
    const kind = pp >= 1 ? 'boom' : hit ? (Math.abs(pp - zc) <= zw * 0.2 ? 'perfect' : 'good') : pp < zlo() ? 'fizzle' : 'gush';
    o = { ...SHAPES[kind], kind };
    phase = 'pop';
    pt = 0;
    emitAcc = 0;
    const n = neck();
    const scored = kind === 'good' || kind === 'perfect';
    cap = { x: n.x, y: n.y, vx: rand(-40, 140), vy: scored ? -620 : kind === 'boom' ? -900 : -240, rot: 0, vr: rand(-14, 14), col: LABELS[label].cap };
    if (scored) {
      g.score++;
      recoil = 1;
      sound.pop?.();
      fx.ring(n.x, n.y, '#fff3c4', 100, 0.45, 8);
      fx.burst(n.x, n.y, '#ffd9a0', 20, 460, { up: 260 });
      sparks.float(n.x, n.y - 70, '+1', kind === 'perfect' ? '#ffe27a' : '#fff');
      say(kind === 'perfect' ? PERFECT : GOOD, 1.8);
      if (kind === 'perfect') {
        sound.win?.();
        rayT = 1;
        banner = { str: 'PERFECT!', color: '#ffe27a', t: 0 };
        fx.burst(n.x, n.y - 30, '#fff7c2', 26, 560, { up: 300, size: 3.5 });
        fx.ring(n.x, n.y, '#ffe27a', 150, 0.6, 10);
        shake = 0.18;
      }
    } else {
      lives--;
      if (kind === 'fizzle') {
        sound.nope?.();
        say(FIZZLE, 1.8);
      } else if (kind === 'gush') {
        sound.bad?.();
        say(GUSH, 1.8);
        recoil = 0.5;
      } else {
        sound.boom?.();
        sound.crash?.();
        say(BOOM, 2.4);
        shake = 0.5;
        flash = 0.14;
        squash = 0.28;
        recoil = 1;
        banner = { str: 'KABLOOEY', color: '#ff6a4a', t: 0 };
        fx.ring(n.x, n.y, '#ffb347', 200, 0.5, 12);
        fx.burst(n.x, n.y, '#ffb347', 30, 560);
        for (let i = 0; i < 70; i++) spawn(n.x, n.y, -Math.PI + rand(0, 1.3), rand(250, 800), 0);
        for (let i = 0; i < 12; i++) spawn(n.x, n.y, rand(-Math.PI, 0), rand(100, 380), 1);
        for (let i = 0; i < 8; i++) stains.push({ dx: rand(-45, 45), dy: rand(-40, 45), r: rand(3, 8), life: 8 });
      }
    }
    talk.x = BTN.x;
    talk.y = 488;
  };

  const release = () => {
    if (phase !== 'play' || g.over) return;
    holding = false;
    if (p < 0.05) return; // a stray tap
    pop(p);
  };

  const emit = (dt) => {
    const k = pt / o.D;
    const n = neck();
    emitAcc += o.rate * (1 - k * 0.5) * dt;
    const base = o.kind === 'boom' ? o.lean : -Math.PI / 2 + o.lean * (0.4 + Math.random() * 0.9);
    while (emitAcc >= 1) {
      emitAcc--;
      const foam = Math.random() < (o.kind === 'fizzle' ? 0.5 : 0.12);
      const a = o.kind === 'boom' ? base + rand(-0.9, 0.9) : base + rand(-o.spread, o.spread);
      const sp = rand(o.sp[0], o.sp[1]) * (1 - k * 0.4) * (foam ? 0.5 : 1);
      spawn(n.x + rand(-4, 4), n.y, a, sp, foam ? 1 : 0);
    }
  };

  const particles = (dt) => {
    const bx = BTN.x;
    const by = BTN.y;
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.life -= dt;
      let dead = d.life <= 0;
      if (d.kind) {
        d.vy += 120 * dt;
        d.vx *= 1 - Math.min(1, dt * 2);
        d.r += dt * 8;
      } else {
        d.vy += GRAV * dt;
        // landing on the button's face leaves a stain
        const ex = (d.x - bx) / 64;
        const ey = (d.y - by) / 70;
        if (d.vy > 0 && ex * ex + ey * ey < 1) {
          if (stains.length < 44) stains.push({ dx: d.x - bx, dy: d.y - by, r: d.r * rand(1, 1.8), life: 7 });
          dead = true;
        } else if (d.y > d.floor) {
          if (splats.length < 60 && Math.random() < 0.3) splats.push({ x: d.x, y: d.y, r: d.r * rand(1.4, 2.6), life: 8 });
          dead = true;
        }
      }
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (dead || d.x < -40 || d.x > W + 40) {
        drops[i] = drops[drops.length - 1];
        drops.pop();
      }
    }
    for (const s of splats) s.life -= dt;
    for (const s of stains) s.life -= dt;
    for (let i = splats.length - 1; i >= 0; i--) if (splats[i].life <= 0) splats.splice(i, 1);
    for (let i = stains.length - 1; i >= 0; i--) if (stains[i].life <= 0) stains.splice(i, 1);
    if (cap) {
      cap.vy += 1400 * dt;
      cap.x += cap.vx * dt;
      cap.y += cap.vy * dt;
      cap.rot += cap.vr * dt;
      if (cap.y > 900) cap = null;
    }
  };

  const g = {
    score: 0,
    over: false,

    down(x, y) {
      if (g.over || phase !== 'play') return;
      holding = true;
      px = x;
      py = y;
    },
    move(x, y) {
      if (!holding) return;
      addTravel(Math.min(Math.hypot(x - px, y - py), 90));
      px = x;
      py = y;
    },
    up() {
      if (holding) release();
    },
    key(code) {
      if (g.over || phase !== 'play') return;
      if (code === 'Space' || code === 'Enter') return release();
      const side = code === 'ArrowLeft' || code === 'KeyA' || code === 'ArrowUp' ? 1 : code === 'ArrowRight' || code === 'KeyD' || code === 'ArrowDown' ? 2 : 0;
      if (!side) return;
      holding = true;
      addTravel(side !== lastSide ? 300 : 60);
      lastSide = side;
    },

    // a paid Continue: one more life and a fresh bottle, same score
    revive() {
      g.over = false;
      lives = 1;
      newRound(false);
      reviveFx({ fx, words: sparks, mouth, sound }, BTN.x, BTN.y - 40, look.color);
      talk.x = BTN.x;
      talk.y = 488;
    },

    update(dt) {
      dt = dt > 0 ? Math.min(dt, 0.05) : 0;
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
      fx.update(dt);
      particles(dt);
      shake = Math.max(0, shake - dt);
      flash = Math.max(0, flash - dt);
      rayT = Math.max(0, rayT - dt * 1.4);
      squash *= Math.exp(-dt * 6);
      recoil *= Math.exp(-dt * 5);
      if (banner) {
        banner.t += dt;
        if (banner.t > 1.3) banner = null;
      }
      if (g.over) return;

      if (phase === 'in') {
        pt += dt;
        ox = (1 - ease(pt / 0.5)) * 360;
        if (pt >= 0.5) {
          phase = 'play';
          ox = 0;
        }
      } else if (phase === 'play') {
        const take = Math.min(acc, MAXTRAVEL * dt);
        acc -= take;
        const prev = p;
        p += take * K - leak * dt;
        if (!(p > 0)) p = 0;
        rate += ((dt > 0 ? take / (MAXTRAVEL * dt) : 0) - rate) * Math.min(1, dt * 9);
        // ratchet ticks climb in pitch with the pressure
        const lvl = Math.floor(p * 24);
        if (lvl > lastLvl && p > prev) sound.click?.(lvl * 3);
        lastLvl = lvl;
        if (p >= 1) {
          p = 1;
          pop(1);
        } else {
          if (p > 0.55 && !(said & 1)) {
            said |= 1;
            say(NERVOUS, 1.6);
          }
          if (p > 0.88 && !(said & 2)) {
            said |= 2;
            say(PANIC, 1.4);
          }
          chat -= dt;
          if (chat <= 0) {
            chat = rand(6, 9);
            if (p < 0.05 && mouth.left <= 0) say(IDLE, 2);
          }
        }
        // the bottle trembles with the shaking and the pressure
        const amp = rate * 7 + p * p * 3.5;
        jx = Math.sin(t * 61) * amp;
        jy = Math.cos(t * 47) * amp * 0.5;
        ja = Math.sin(t * 53 + 1) * amp * 0.025;
      } else if (phase === 'pop') {
        pt += dt;
        jx = jy = ja = 0;
        if (pt < o.D) emit(dt);
        const out = (pt - o.D) / 0.35;
        if (out > 0) ox = clamp(out, 0, 1) ** 2 * 360;
        if (out >= 1) {
          if (lives <= 0) {
            phase = 'dead';
            g.over = true;
            say(END, 3);
            sound.bad?.();
          } else newRound(false);
        }
      }
    },

    draw(c) {
      c.save();
      if (shake) c.translate(rand(-2, 2) * shake * 14, rand(-2, 2) * shake * 14);
      c.drawImage(bg(), 0, 0, W, H);
      for (const s of splats) {
        c.globalAlpha = clamp(s.life / 2, 0, 1) * 0.5;
        c.fillStyle = '#6b3516';
        c.beginPath();
        c.ellipse(s.x, s.y, s.r * 1.5, s.r * 0.6, 0, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;

      // the button, nervous in step with the pressure
      const hot = phase === 'play' ? p : 0;
      const bobY = Math.sin(t * 2) * 1.5;
      const bx = BTN.x + Math.sin(t * 47) * rate * 3;
      const by = BTN.y + bobY;
      shadow(c, BTN.x, BTN.y + 76, 80, 0.3, 12);
      drawBobby(c, bx, by, BTN.size, {
        look,
        t,
        mood: mood(hot),
        squash: squash + Math.sin(t * 40) * rate * 0.03,
        flash: flash > 0,
        tears: g.over,
      });
      for (const s of stains) {
        c.globalAlpha = clamp(s.life / 2, 0, 1) * 0.8;
        c.fillStyle = '#7a3a16';
        c.beginPath();
        c.arc(bx + s.dx, by + s.dy, s.r, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = 'rgba(255,225,170,0.6)';
        c.beginPath();
        c.arc(bx + s.dx - s.r * 0.3, by + s.dy - s.r * 0.3, s.r * 0.3, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;

      if (ox < 359 && phase !== 'dead') bottle(c, hot);
      if (cap) cap2(c, cap.x, cap.y, cap.rot, cap.col);

      // the jet itself, under the droplets
      if (phase === 'pop' && o && pt < o.D && o.kind !== 'boom' && o.kind !== 'fizzle') {
        const k = pt / o.D;
        const n = neck();
        const s = o.kind === 'perfect' ? 1.2 : o.kind === 'gush' ? 0.5 : 0.85;
        const h = 300 * s * (1 - k * 0.6) * Math.min(1, pt * 8);
        const lean = o.kind === 'gush' ? 0 : -h * 0.12;
        c.lineCap = 'round';
        c.strokeStyle = 'rgba(176,97,44,0.8)';
        c.lineWidth = 20 * s * (1 - k * 0.7);
        c.beginPath();
        c.moveTo(n.x, n.y);
        c.lineTo(n.x + lean, n.y - h);
        c.stroke();
        c.strokeStyle = 'rgba(255,240,210,0.85)';
        c.lineWidth = 8 * s * (1 - k * 0.7);
        c.stroke();
        glow(c, n.x, n.y - 10, 70 * s, '#ffd9a0', 0.5 * (1 - k));
      }
      if (rayT > 0) rays(c, neck().x, neck().y, 460, '#fff2b0', 0.5 * rayT, t * 0.5);

      drawDrops(c);
      fx.draw(c);
      sparks.draw(c);
      c.restore();

      vignette(c, 0.28, '#3a1c08');
      if (phase === 'play' && p > 0.82) vignette(c, 0.1 + (p - 0.82) * 1.8 * Math.abs(Math.sin(t * 10)), '#c0182a');

      gauge(c);
      for (let i = 0; i < LIVES; i++) {
        const x = W / 2 + (i - 1) * 36;
        heart(c, x, 160, 11, i < lives ? '#ff4f7b' : 'rgba(60,40,70,0.55)', i < lives ? '#fff' : 'rgba(255,255,255,0.4)');
      }
      drawScore(c, g.score, 'bottles');
      mouth.draw(c, talk.x, talk.y);

      if (banner) {
        const k = banner.t;
        const sc = 1 + Math.max(0, 0.35 - k * 1.6);
        c.save();
        c.translate(W / 2, 300);
        c.rotate(-0.06);
        c.scale(sc, sc);
        c.globalAlpha = clamp((1.3 - k) / 0.3, 0, 1);
        edge(c, banner.str, 0, 0, 52, banner.color);
        c.restore();
        c.globalAlpha = 1;
      }
      if (!g.over && g.score < 2 && phase === 'play') {
        if (p < 0.05) edge(c, 'Drag the bottle back and forth!', W / 2, 218, 18, '#fff');
        edge(c, 'Let go in the green. Keys: ← → shake, Space pops', W / 2 - 20, 764, 13, 'rgba(255,255,255,0.92)');
      }
    },
  };

  // the button's face follows the pressure and the last result
  function mood(hot) {
    if (g.over) return 'sad';
    if (phase === 'pop' && o) return o.kind === 'good' || o.kind === 'perfect' ? 'happy' : o.kind === 'boom' ? 'shout' : o.kind === 'gush' ? 'worried' : 'sad';
    if (hot > 0.82) return 'shout';
    if (hot > 0.4) return 'worried';
    return holding ? 'smug' : 'calm';
  }

  // the bottle with its bubbles, rising foam, cap and the button's hand
  function bottle(c, hot) {
    const b = bottlePos();
    const L = LABELS[label];
    shadow(c, BOT.x + ox, 705, 58, 0.28, 10);
    // the arm reaches out from the button to the bottle
    const hx = b.x + -36 * Math.cos(b.a) - 38 * Math.sin(b.a);
    const hy = b.y + -36 * Math.sin(b.a) + 38 * Math.cos(b.a);
    c.lineCap = 'round';
    c.strokeStyle = look.dark;
    c.lineWidth = 9;
    c.beginPath();
    c.moveTo(BTN.x + 62, BTN.y + 28);
    c.quadraticCurveTo((BTN.x + 62 + hx) / 2, BTN.y + 60, hx, hy);
    c.stroke();

    c.save();
    c.translate(b.x, b.y);
    c.rotate(b.a);
    if (hot > 0.55) glow(c, 0, 0, 170, '#ff4f4f', (hot - 0.55) * 1.3);
    c.drawImage(bottleSprite(label), -45, -125, 90, 250);

    c.save();
    c.translate(-45, -125);
    bottlePath(c);
    c.clip();
    // foam climbs the neck as the pressure rises
    if (hot > 0.02) {
      const top = 100 - hot * 86;
      c.fillStyle = '#fff1d6';
      c.fillRect(0, top, 90, 104 - top);
      for (let x = 30; x <= 60; x += 5) {
        c.beginPath();
        c.arc(x, top + Math.sin(t * 9 + x) * 1.5, 5.5, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = 'rgba(214,170,120,0.5)';
      for (let i = 0; i < 6; i++) {
        c.beginPath();
        c.arc(36 + hash(i) * 18, top + 6 + hash(i + 9) * (100 - top - 8), 2 + hash(i + 3) * 2, 0, Math.PI * 2);
        c.fill();
      }
    }
    // bubbles rise faster the harder it's shaken
    const spd = 18 + rate * 260 + hot * 100;
    c.strokeStyle = 'rgba(255,255,255,0.7)';
    c.lineWidth = 1;
    c.beginPath();
    for (let i = 0; i < 18; i++) {
      const x = 45 + (hash(i + 20) - 0.5) * 54 + Math.sin(t * 3 + i) * 3;
      const y = 244 - ((t * spd + hash(i) * 150) % 144);
      const r = 1.5 + hash(i + 40) * 2.2;
      c.moveTo(x + r, y);
      c.arc(x, y, r, 0, Math.PI * 2);
    }
    c.stroke();
    c.restore();

    if (!cap) cap2(c, 0, NECK - hot * 3, 0, L.cap);
    c.fillStyle = look.color;
    c.strokeStyle = look.dark;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(-36, 38, 13, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.restore();
  }

  function drawDrops(c) {
    c.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      c.strokeStyle = pass ? 'rgba(255,226,180,0.85)' : '#b0612c';
      for (const d of drops) {
        if (d.kind) continue;
        const w = pass ? d.r * 0.8 : d.r * 2;
        const o2 = pass ? -d.r * 0.3 : 0;
        c.lineWidth = w;
        c.beginPath();
        c.moveTo(d.x - d.vx * 0.018 + o2, d.y - d.vy * 0.018 + o2);
        c.lineTo(d.x + o2, d.y + o2);
        c.stroke();
      }
    }
    for (const d of drops) {
      if (!d.kind) continue;
      c.globalAlpha = clamp(d.life / d.max, 0, 1) * 0.85;
      c.fillStyle = '#fff4de';
      c.beginPath();
      c.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  }

  // the pressure tube: green sweet spot, bright centre, red line at the top
  function gauge(c) {
    const yOf = (v) => GB - clamp(v, 0, 1) * GH;
    const x0 = GX - GW / 2;
    const dim = g.over || phase === 'pop' ? 0.6 : 1;
    c.globalAlpha = dim;
    rr(c, x0, GT - 6, GW, GH + 12, 17);
    c.fillStyle = 'rgba(24,14,36,0.62)';
    c.fill();
    c.save();
    rr(c, x0 + 3, GT - 3, GW - 6, GH + 6, 14);
    c.clip();
    const lo = zlo();
    const hi = zhi();
    c.fillStyle = 'rgba(255,200,60,0.35)';
    c.fillRect(x0, yOf(0.93), GW, yOf(hi) - yOf(0.93));
    c.fillStyle = '#ff4f4f';
    c.fillRect(x0, yOf(1), GW, yOf(0.93) - yOf(1));
    c.fillStyle = '#4be37a';
    c.fillRect(x0, yOf(hi), GW, yOf(lo) - yOf(hi));
    c.fillStyle = '#c8ffd6';
    c.fillRect(x0, yOf(zc + zw * 0.2), GW, zw * 0.4 * GH);
    // the level
    const inZone = p >= lo && p <= hi;
    c.fillStyle = p >= 0.93 ? '#ff5a4a' : p > hi ? '#ffb347' : inZone ? '#2fbf5e' : '#7cc7ff';
    c.fillRect(x0 + 8, yOf(p), GW - 16, GB - yOf(p) + 4);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.fillRect(x0 + 8, yOf(p), GW - 16, 3);
    c.restore();
    rr(c, x0, GT - 6, GW, GH + 12, 17);
    c.strokeStyle = 'rgba(255,255,255,0.6)';
    c.lineWidth = 2;
    c.stroke();
    if (inZone && phase === 'play') glow(c, GX, yOf(zc), 50, '#5cff8a', 0.4 + Math.sin(t * 14) * 0.2);
    // red line, level pointer, labels
    c.fillStyle = '#ff2d2d';
    c.fillRect(x0 - 6, yOf(1) - 1.5, GW + 12, 3);
    const ay = yOf(p);
    c.beginPath();
    c.moveTo(x0 - 4, ay);
    c.lineTo(x0 - 18, ay - 9);
    c.lineTo(x0 - 18, ay + 9);
    c.closePath();
    c.fillStyle = '#fff';
    c.fill();
    c.strokeStyle = 'rgba(30,14,40,0.5)';
    c.lineWidth = 1.5;
    c.stroke();
    edge(c, 'BOOM', GX, GT - 22, 14, '#ff6a5a');
    edge(c, 'GOOD', x0 - 36, yOf(zc), 12, '#9cffb4');
    c.globalAlpha = 1;
  }

  newRound(true);
  return g;
}

/* ---------- art ---------- */

// The bottle's outline in a 90x250 box (neck top at y 20, body 10..80 wide).
function bottlePath(c) {
  c.beginPath();
  c.moveTo(34, 20);
  c.lineTo(56, 20);
  c.lineTo(56, 78);
  c.bezierCurveTo(56, 98, 80, 100, 80, 132);
  c.lineTo(80, 232);
  c.quadraticCurveTo(80, 246, 66, 246);
  c.lineTo(24, 246);
  c.quadraticCurveTo(10, 246, 10, 232);
  c.lineTo(10, 132);
  c.bezierCurveTo(10, 100, 34, 98, 34, 78);
  c.closePath();
}

function cap2(c, x, y, rot, col) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  rr(c, -14, -8, 28, 15, 4);
  c.fillStyle = col;
  c.fill();
  c.fillStyle = 'rgba(0,0,0,0.2)';
  for (let i = -10; i <= 10; i += 5) c.fillRect(i, -5, 1.5, 10);
  c.fillStyle = 'rgba(255,255,255,0.45)';
  c.fillRect(-11, -6, 22, 2.5);
  c.restore();
}

// glass, soda, a funny label and a glassy streak, painted once per flavour
function bottleSprite(i) {
  const L = LABELS[i % LABELS.length];
  return sprite(`fizz:bottle:${i % LABELS.length}`, 180, 500, (c) => {
    c.scale(2, 2);
    bottlePath(c);
    c.fillStyle = 'rgba(214,240,255,0.3)';
    c.fill();
    c.save();
    bottlePath(c);
    c.clip();
    const lq = c.createLinearGradient(0, 100, 0, 246);
    lq.addColorStop(0, L.liq[0]);
    lq.addColorStop(1, L.liq[1]);
    c.fillStyle = lq;
    c.fillRect(0, 100, 90, 150);
    c.fillStyle = 'rgba(255,255,255,0.4)';
    c.fillRect(0, 100, 90, 2);
    // label
    c.fillStyle = L.c1;
    c.fillRect(0, 150, 90, 62);
    c.fillStyle = L.c2;
    c.fillRect(0, 150, 90, 4);
    c.fillRect(0, 208, 90, 4);
    const n = L.lines.length;
    L.lines.forEach((ln, k) => text(c, ln, 45, 181 + (k - (n - 1) / 2) * 13, { size: 10.5, color: L.c2 }));
    // shading across the glass
    const sh = c.createLinearGradient(10, 0, 80, 0);
    sh.addColorStop(0, 'rgba(255,255,255,0.28)');
    sh.addColorStop(0.3, 'rgba(255,255,255,0)');
    sh.addColorStop(0.75, 'rgba(0,0,0,0)');
    sh.addColorStop(1, 'rgba(0,0,0,0.3)');
    c.fillStyle = sh;
    c.fillRect(0, 0, 90, 250);
    c.restore();
    c.fillStyle = 'rgba(255,255,255,0.5)';
    rr(c, 17, 124, 5, 90, 2.5);
    c.fill();
    rr(c, 38, 28, 3, 40, 1.5);
    c.fill();
    bottlePath(c);
    c.lineWidth = 2;
    c.strokeStyle = 'rgba(255,255,255,0.7)';
    c.stroke();
    c.lineWidth = 1;
    c.strokeStyle = 'rgba(30,14,40,0.35)';
    c.stroke();
    // the ring under the cap
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.fillRect(32, 26, 26, 3);
  });
}

// A backyard picnic: sky, hills, fence and sunflowers, a gingham blanket with
// a basket, cups and a watermelon slice. Painted once.
function bg() {
  return layer('fizz:bg', (c) => {
    const sk = c.createLinearGradient(0, 0, 0, 460);
    sk.addColorStop(0, '#6fc3f4');
    sk.addColorStop(1, '#eaf8ff');
    c.fillStyle = sk;
    c.fillRect(0, 0, W, 470);
    const sun = c.createRadialGradient(410, 120, 0, 410, 120, 190);
    sun.addColorStop(0, 'rgba(255,248,210,1)');
    sun.addColorStop(0.15, 'rgba(255,236,160,0.8)');
    sun.addColorStop(1, 'rgba(255,236,160,0)');
    c.fillStyle = sun;
    c.fillRect(0, 0, W, 470);
    // clouds
    c.fillStyle = 'rgba(255,255,255,0.92)';
    for (const [x, y, s] of [[90, 250, 1], [300, 300, 0.8], [190, 60, 0.7]]) {
      c.beginPath();
      for (const [dx, dy, r] of [[0, 0, 26], [32, -12, 32], [66, 0, 26], [34, 8, 24]]) {
        c.moveTo(x + (dx + r) * s, y + dy * s);
        c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
      }
      c.fill();
    }
    // hills
    [['#a7d68a', 400, 0.012, 26, 1.2], ['#7fc46a', 432, 0.019, 18, 3.4]].forEach(([col, base, f, amp, ph]) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(0, 520);
      for (let x = 0; x <= W; x += 8) c.lineTo(x, base - Math.sin(x * f + ph) * amp);
      c.lineTo(W, 520);
      c.fill();
    });
    // a round tree on the left
    c.fillStyle = '#7a5230';
    c.fillRect(30, 330, 14, 110);
    const tg = c.createRadialGradient(30, 290, 6, 36, 310, 80);
    tg.addColorStop(0, '#9fdc7a');
    tg.addColorStop(1, '#4f9a4a');
    c.fillStyle = tg;
    c.beginPath();
    c.arc(38, 300, 58, 0, Math.PI * 2);
    c.arc(0, 330, 44, 0, Math.PI * 2);
    c.arc(76, 332, 40, 0, Math.PI * 2);
    c.fill();
    // lawn
    const lawn = c.createLinearGradient(0, 440, 0, H);
    lawn.addColorStop(0, '#93d65c');
    lawn.addColorStop(1, '#3d8f37');
    c.fillStyle = lawn;
    c.fillRect(0, 440, W, H - 440);
    c.lineCap = 'round';
    for (let i = 0; i < 260; i++) {
      const x = hash(i) * W;
      const y = 450 + hash(i + 70) * (H - 450);
      c.strokeStyle = hash(i + 5) > 0.5 ? 'rgba(30,90,30,0.3)' : 'rgba(210,245,150,0.3)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + (hash(i + 2) - 0.5) * 5, y - 5 - hash(i + 9) * 6);
      c.stroke();
    }
    // picket fence
    c.fillStyle = '#e9dcc4';
    c.fillRect(0, 418, W, 6);
    c.fillRect(0, 446, W, 6);
    for (let x = 6; x < W; x += 30) {
      c.fillStyle = '#fffaf0';
      c.beginPath();
      c.moveTo(x, 470);
      c.lineTo(x, 405);
      c.lineTo(x + 11, 394);
      c.lineTo(x + 22, 405);
      c.lineTo(x + 22, 470);
      c.fill();
      c.fillStyle = 'rgba(120,90,50,0.18)';
      c.fillRect(x + 16, 405, 6, 65);
    }
    // sunflowers in front of the fence
    for (const x of [24, 128, 262, 392, 458]) {
      c.strokeStyle = '#4c9a3c';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(x, 476);
      c.lineTo(x, 438);
      c.stroke();
      c.fillStyle = '#ffd23f';
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        c.beginPath();
        c.ellipse(x + Math.cos(a) * 12, 432 + Math.sin(a) * 12, 7, 3.4, a, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = '#6b3d1a';
      c.beginPath();
      c.arc(x, 432, 7.5, 0, Math.PI * 2);
      c.fill();
    }
    blanket(c);
    // basket (the button stands in front of it)
    c.fillStyle = '#b9854d';
    rr(c, 22, 528, 82, 50, 8);
    c.fill();
    c.strokeStyle = 'rgba(90,50,20,0.4)';
    c.lineWidth = 2;
    for (let k = 0; k < 4; k++) {
      c.beginPath();
      c.moveTo(24, 540 + k * 11);
      c.lineTo(102, 540 + k * 11);
      c.stroke();
    }
    c.strokeStyle = '#8a5a2c';
    c.lineWidth = 5;
    c.beginPath();
    c.arc(63, 530, 30, Math.PI, 0);
    c.stroke();
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(30, 530);
    c.lineTo(70, 522);
    c.lineTo(96, 534);
    c.lineTo(40, 540);
    c.fill();
    // cups
    [[140, 770, '#e0453a'], [172, 776, '#ef8a1c'], [204, 770, '#2d7fd0']].forEach(([x, y, col]) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(x - 14, y - 26);
      c.lineTo(x + 14, y - 26);
      c.lineTo(x + 10, y + 12);
      c.lineTo(x - 10, y + 12);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.4)';
      c.fillRect(x - 11, y - 22, 4, 28);
    });
    // watermelon slice
    c.fillStyle = '#3f9a3d';
    c.beginPath();
    c.arc(380, 750, 34, 0, Math.PI);
    c.fill();
    c.fillStyle = '#ff5a6e';
    c.beginPath();
    c.arc(380, 750, 28, 0, Math.PI);
    c.fill();
    c.fillStyle = '#1b1210';
    for (const [dx, dy] of [[-14, 8], [0, 14], [14, 8], [-6, 22], [8, 24]]) {
      c.beginPath();
      c.ellipse(380 + dx, 750 + dy, 2, 3.4, 0.3, 0, Math.PI * 2);
      c.fill();
    }
    c.fillRect(320, 746, 120, 4);
    c.fillStyle = '#ff5a6e';
    c.fillRect(352, 746, 56, 4);
  });
}

// A red gingham blanket in perspective.
function blanket(c) {
  const top = 498;
  const half = (y) => 170 + ((y - top) / (H - top)) * 190;
  c.save();
  c.beginPath();
  c.moveTo(240 - half(top), top);
  c.lineTo(240 + half(top), top);
  c.lineTo(240 + half(H), H);
  c.lineTo(240 - half(H), H);
  c.closePath();
  c.shadowColor = 'rgba(20,50,10,0.5)';
  c.shadowBlur = 16;
  c.fillStyle = '#fff4ea';
  c.fill();
  c.shadowBlur = 0;
  c.clip();
  c.fillStyle = 'rgba(225,60,60,0.5)';
  for (let i = -4; i < 4; i += 2) {
    c.beginPath();
    c.moveTo(240 + (i * half(top)) / 4, top);
    c.lineTo(240 + ((i + 1) * half(top)) / 4, top);
    c.lineTo(240 + ((i + 1) * half(H)) / 4, H);
    c.lineTo(240 + (i * half(H)) / 4, H);
    c.fill();
  }
  for (let k = 0; k < 12; k += 2) {
    const y0 = top + (H - top) * (k / 12) ** 1.4;
    const y1 = top + (H - top) * ((k + 1) / 12) ** 1.4;
    c.fillRect(0, y0, W, y1 - y0);
  }
  c.restore();
}
