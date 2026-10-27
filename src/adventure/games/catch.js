import { W, H, rand, pick, clamp, rr, heart, text, drawBobby, drawScore, Mouth, Sparks, reviveFx, blinkAlpha, sprite, layer, vignette, glow, softLight, shadow, hash } from '../kit';

// Snack Attack: slide the button left and right to catch falling snacks and
// dodge the bombs. Three lives; a missed snack costs nothing.
const GROUND = H - 64;
const SIZE = 78;
const SPEED = 560; // px/s with the keys held
const LIVES = 3;
const SNACKS = ['donut', 'cookie', 'cake', 'apple'];
const CRUMBS = { donut: '#e0a35a', cookie: '#c98a4b', cake: '#ffb3c9', apple: '#e8473d', gold: '#ffd84d' };

const IDLE = ['Feed me. Not those.', 'I only eat out of spite.', 'Do NOT drop the cake.', 'Faster, servant.', 'This is beneath me.'];
const YUM = ['Mine.', 'Adequate.', 'More.', 'Barely edible.', 'I hate that I liked that.'];
const GOLD = ['GOLD. Finally.', 'Now we are talking.', 'Fancy.'];
const MISS = ['That was MY snack.', 'Wasteful.', 'Pick it up. No, don’t.', 'Floor food. Great.'];
const BOMBED = ['That was not a snack!', 'OW. Spicy.', 'You moved me INTO it.', 'Rude.'];
const DEAD = ['I’m full. Of bombs.', 'Never cooking again.', 'Worst picnic ever.'];

export default function catchGame({ look, sound, keys }) {
  const me = { x: W / 2, y: GROUND - SIZE * 0.53, facing: 1, moving: false };
  const items = [];
  const mouth = new Mouth();
  const sparks = new Sparks();
  let lives = LIVES;
  let t = 0;
  let next = 1; // seconds until the next drop
  let chat = 3;
  let held = false;
  let target = me.x;
  let squash = 0;
  let chomp = 0;
  let hurt = 0;
  let shake = 0;
  let safe = 0; // bombs pass through for a moment after a Continue

  // the longer you last, the faster and thicker things fall
  const interval = () => clamp(0.95 - t * 0.01, 0.38, 0.95);
  const fall = () => Math.min(190 + t * 4.5, 470) * rand(0.9, 1.15);

  const drop = () => {
    const bomb = Math.random() < clamp(0.18 + t * 0.003, 0.18, 0.34);
    const kind = bomb ? 'bomb' : Math.random() < 0.06 ? 'gold' : pick(SNACKS);
    items.push({ x: rand(36, W - 36), y: -30, vy: fall(), kind, r: 22, spin: rand(0, 6), turn: rand(-2, 2) });
  };

  const eat = (it) => {
    const gold = it.kind === 'gold';
    g.score += gold ? 3 : 1;
    squash = 0.2;
    chomp = 0.25;
    sparks.burst(me.x, me.y - SIZE * 0.2, CRUMBS[it.kind], gold ? 14 : 6, 140);
    sparks.float(me.x, me.y - SIZE * 0.8, gold ? '+3' : '+1', gold ? '#ffd84d' : '#fff');
    if (gold) {
      sound.ring();
      mouth.say(pick(GOLD));
    } else {
      sound.pop();
      mouth.maybe(YUM, 0.12);
    }
  };

  const boom = (it) => {
    lives--;
    hurt = 0.6;
    shake = 0.35;
    sound.boom();
    sparks.burst(it.x, it.y, '#ff9a3c', 18, 300);
    sparks.burst(it.x, it.y, '#555', 10, 200);
    if (lives > 0) return mouth.say(pick(BOMBED));
    g.over = true;
    sound.crash();
    mouth.say(pick(DEAD), 3);
  };

  const g = {
    score: 0,
    over: false,
    // while the pointer is held, the button chases it
    down(x) {
      held = true;
      target = x;
    },
    move(x) {
      if (held) target = x;
    },
    up() {
      held = false;
    },

    // a paid Continue: one life back, the bombs in the air gone, a moment of safety
    revive() {
      g.over = false;
      lives = Math.max(lives, 1);
      hurt = 0;
      safe = 2;
      next = 0.8;
      for (const it of items) {
        if (it.kind !== 'bomb') continue;
        it.done = true;
        sparks.burst(it.x, it.y, '#cfd6e2', 6, 140);
      }
      for (let i = items.length - 1; i >= 0; i--) if (items[i].done) items.splice(i, 1);
      reviveFx({ fx: sparks, mouth, sound }, me.x, me.y, look.color);
    },

    update(dt) {
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
      squash = Math.max(0, squash - dt);
      chomp = Math.max(0, chomp - dt);
      hurt = Math.max(0, hurt - dt);
      shake = Math.max(0, shake - dt);
      safe -= dt;

      const was = me.x;
      if (!g.over) {
        const dir = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
        if (dir) {
          me.x += dir * SPEED * dt;
          target = me.x;
        } else if (held) me.x += (target - me.x) * Math.min(1, dt * 14);
        me.x = clamp(me.x, SIZE / 2, W - SIZE / 2);
      }
      me.moving = Math.abs(me.x - was) > 30 * dt;
      if (me.moving) me.facing = me.x > was ? 1 : -1;

      if (!g.over) {
        next -= dt;
        if (next <= 0) {
          drop();
          next = interval();
        }
        chat -= dt;
        if (chat <= 0) {
          mouth.maybe(IDLE, 0.5);
          chat = rand(5, 9);
        }
      }

      for (const it of items) {
        it.vy += 60 * dt;
        it.y += it.vy * dt;
        it.spin += it.turn * dt;
        // the catch zone is the top half of the button, around its mouth
        const caught =
          !g.over &&
          it.y + it.r > me.y - SIZE * 0.45 &&
          it.y < me.y + SIZE * 0.25 &&
          Math.abs(it.x - me.x) < SIZE * 0.5 + it.r * 0.4;
        if (caught && it.kind === 'bomb' && safe > 0) continue;
        if (caught) {
          it.done = true;
          if (it.kind === 'bomb') boom(it);
          else eat(it);
        } else if (it.y - it.r * 0.5 > GROUND) {
          it.done = true;
          if (it.kind === 'bomb') {
            sound.thud();
            sparks.burst(it.x, GROUND, '#777', 8, 160);
          } else {
            sparks.burst(it.x, GROUND, CRUMBS[it.kind], 6, 120);
            if (!g.over) mouth.maybe(MISS, 0.25);
          }
        }
      }
      for (let i = items.length - 1; i >= 0; i--) if (items[i].done) items.splice(i, 1);
    },

    draw(c) {
      c.save();
      if (shake) c.translate(rand(-6, 6) * shake * 3, rand(-6, 6) * shake * 3);
      // a golden-hour picnic: warm sky, slow sun rays, hazy hills
      c.drawImage(skyArt(), -10, -10, W + 20, H + 20);
      c.save();
      c.translate(SUN.x, SUN.y);
      c.rotate(t * 0.04);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.16;
      c.drawImage(raysArt(), -380, -380, 760, 760);
      c.restore();
      glow(c, SUN.x, SUN.y, 140, '#ffb347', 0.28);
      for (let i = 0; i < 4; i++) {
        const x = ((i * 150 + t * 12) % (W + 160)) - 80;
        c.drawImage(cloudArt(i % 2), x - 30, 200 + (i % 2) * 110 - 46);
      }
      c.drawImage(hillsArt(), -10, GROUND - 230);
      c.drawImage(blanketArt(), -10, GROUND - 6);

      // falling things cast a shadow that sharpens as they get close
      for (const it of items) {
        const near = clamp(1 - (GROUND - it.y) / 600, 0, 1);
        shadow(c, it.x, GROUND + 6, it.r * (0.5 + near * 0.6), 0.08 + near * 0.25, 6);
      }
      for (const it of items) item(c, it, t, me);

      // the mouth opens when something is about to land on it
      const incoming = items.some((it) => it.y > me.y - 190 && it.y < me.y - SIZE * 0.2 && Math.abs(it.x - me.x) < SIZE * 0.8);
      shadow(c, me.x, GROUND + 4, SIZE * 0.5, 0.4, 9);
      drawBobby(c, me.x, me.y, SIZE, {
        look,
        t,
        squash,
        facing: me.facing,
        moving: me.moving,
        flash: hurt > 0.45,
        mood: g.over ? 'sad' : hurt ? 'angry' : incoming && !chomp ? 'shout' : chomp ? 'happy' : 'smug',
        tears: g.over,
        alpha: blinkAlpha(safe, t),
      });

      sparks.draw(c);
      // a bomb hit flashes the whole frame hot orange for a moment
      if (hurt > 0.3) {
        c.globalAlpha = (hurt - 0.3) / 0.3;
        vignette(c, 0.95, '#ff5a1a');
        c.globalAlpha = 1;
      }
      vignette(c, 0.3, '#4a1a08');
      mouth.draw(c, me.x, me.y - SIZE * 0.62);
      c.restore();

      drawScore(c, g.score);
      for (let i = 0; i < LIVES; i++) {
        const hx = W / 2 - 30 + i * 30;
        if (i < lives) softLight(c, hx, 130, 22, '#ff4f7b', 0.45);
        heart(c, hx, 130, 10, i < lives ? '#ff4f7b' : 'rgba(255,255,255,0.45)');
      }
      if (t < 3 && !g.over) text(c, 'Drag, or use ← →', W / 2, 168, { size: 16, color: 'rgba(80,50,30,0.8)' });
    },
  };
  return g;
}

/* ---------- cached art ---------- */
const SUN = { x: 370, y: 250 };

function skyArt() {
  return layer('catch:sky', (c) => {
    const g = c.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, '#f08a6a');
    g.addColorStop(0.35, '#ffb27a');
    g.addColorStop(0.7, '#ffd79a');
    g.addColorStop(1, '#fff0cf');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    const s = c.createRadialGradient(SUN.x, SUN.y, 0, SUN.x, SUN.y, 340);
    s.addColorStop(0, 'rgba(255,250,215,0.6)');
    s.addColorStop(0.25, 'rgba(255,225,160,0.4)');
    s.addColorStop(1, 'rgba(255,225,160,0)');
    c.fillStyle = s;
    c.fillRect(0, 0, W, H);
    const d = c.createRadialGradient(SUN.x, SUN.y, 0, SUN.x, SUN.y, 48);
    d.addColorStop(0, '#fffef2');
    d.addColorStop(0.7, '#fff2bf');
    d.addColorStop(1, '#ffe08a');
    c.fillStyle = d;
    c.beginPath();
    c.arc(SUN.x, SUN.y, 46, 0, Math.PI * 2);
    c.fill();
  });
}

function raysArt() {
  return sprite('catch:rays', 256, 256, (c) => {
    c.translate(128, 128);
    for (let i = 0; i < 12; i++) {
      c.rotate((Math.PI * 2) / 12 + (hash(i) - 0.5) * 0.25);
      const g = c.createLinearGradient(0, 0, 128, 0);
      g.addColorStop(0, 'rgba(255,240,200,0.9)');
      g.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(128, -6 - hash(i + 3) * 10);
      c.lineTo(128, 6 + hash(i + 3) * 10);
      c.fill();
    }
  });
}

// Clouds lit warm on top with a rosy belly.
function cloudArt(v) {
  return sprite(`catch:cloud:${v}`, 140, 90, (c) => {
    c.translate(30, 46);
    c.beginPath();
    const parts = v ? [[0, 0, 22], [24, -10, 26], [50, 0, 20], [74, 6, 14]] : [[0, 0, 22], [24, -10, 26], [50, 0, 20]];
    for (const [x, y, r] of parts) {
      c.moveTo(x + r, y);
      c.arc(x, y, r, 0, Math.PI * 2);
    }
    const g = c.createLinearGradient(0, -36, 0, 22);
    g.addColorStop(0, '#fffaf0');
    g.addColorStop(0.6, '#ffe6cf');
    g.addColorStop(1, '#f6b7a2');
    c.fillStyle = g;
    c.globalAlpha = 0.92;
    c.fill();
  });
}

// Two hazy hill layers with a few round trees, and a meadow at the front.
function hillsArt() {
  return sprite('catch:hills', W + 20, 240, (c) => {
    c.translate(10, 0);
    const hill = (cx, cy, r, top, bottom) => {
      const g = c.createLinearGradient(0, cy - r, 0, 240);
      g.addColorStop(0, top);
      g.addColorStop(1, bottom);
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(cx, cy, r, r * 0.55, 0, Math.PI, 0);
      c.lineTo(cx + r, 240);
      c.lineTo(cx - r, 240);
      c.fill();
    };
    // far, hazy
    hill(380, 160, 260, '#d9c79a', '#c9b98e');
    hill(40, 175, 220, '#cfc293', '#c2b688');
    // trees on the far hills
    for (let i = 0; i < 9; i++) {
      const x = 20 + hash(i + 11) * W;
      const y = 120 + hash(i + 2) * 40;
      c.fillStyle = 'rgba(120,130,80,0.55)';
      c.beginPath();
      c.arc(x, y, 8 + hash(i) * 6, 0, Math.PI * 2);
      c.fill();
    }
    // near meadow hills, with a sunlit rim
    hill(90, 240, 220, '#a8d47e', '#6fae5a');
    hill(410, 250, 190, '#b2da84', '#78b55e');
    c.globalCompositeOperation = 'source-atop';
    const rim = c.createLinearGradient(0, 120, 0, 240);
    rim.addColorStop(0, 'rgba(255,240,180,0.5)');
    rim.addColorStop(0.4, 'rgba(255,240,180,0)');
    c.fillStyle = rim;
    c.fillRect(-10, 0, W + 20, 240);
    // haze over everything far away
    c.globalCompositeOperation = 'source-over';
    const hz = c.createLinearGradient(0, 100, 0, 240);
    hz.addColorStop(0, 'rgba(255,230,190,0.0)');
    hz.addColorStop(1, 'rgba(255,230,190,0.15)');
    c.fillStyle = hz;
    c.fillRect(-10, 0, W + 20, 240);
  });
}

// The checked picnic blanket, with soft folds and shading towards the front.
function blanketArt() {
  const h = H - GROUND + 16;
  return sprite('catch:blanket', W + 20, h, (c) => {
    c.translate(10, 6);
    c.fillStyle = '#fff8ee';
    c.fillRect(-10, 0, W + 20, h);
    c.fillStyle = '#e04f45';
    for (let y = 0; y < 3; y++) for (let x = -1; x < 16; x++) if ((x + y) % 2) c.fillRect(x * 32, y * 24, 32, 24);
    // the thread lines of a gingham weave
    c.fillStyle = 'rgba(200,40,40,0.25)';
    for (let y = 0; y < 72; y += 24) for (let x = -32; x < W + 10; x += 32) c.fillRect(x + 15, y, 2, 24), c.fillRect(x, y + 11, 32, 2);
    // folds: soft light and dark bands
    const f = c.createLinearGradient(0, 0, W, 0);
    for (let i = 0; i <= 6; i++) f.addColorStop(i / 6, i % 2 ? 'rgba(80,20,10,0.10)' : 'rgba(255,255,255,0.08)');
    c.fillStyle = f;
    c.fillRect(-10, 0, W + 20, h);
    // shaded towards the front, lit along the back edge
    const s = c.createLinearGradient(0, 0, 0, h);
    s.addColorStop(0, 'rgba(255,240,200,0.35)');
    s.addColorStop(0.15, 'rgba(255,240,200,0)');
    s.addColorStop(1, 'rgba(70,20,10,0.35)');
    c.fillStyle = s;
    c.fillRect(-10, 0, W + 20, h);
    c.fillStyle = 'rgba(90,40,10,0.25)';
    c.fillRect(-10, -6, W + 20, 6);
  });
}

// Every snack is painted once at 2x with shading on top, then just rotated.
const ART_R = 22;
function itemArt(kind) {
  return sprite(`catch:item:${kind}`, 160, 160, (c) => {
    c.translate(80, 80);
    c.scale(2, 2);
    const r = ART_R;
    if (kind === 'donut') donut(c, r, '#ff8fb8');
    else if (kind === 'gold') donut(c, r, '#ffd84d', '#e0a92a');
    else if (kind === 'cookie') cookie(c, r);
    else if (kind === 'cake') cake(c, r);
    else if (kind === 'apple') apple(c, r);
    else bomb(c, r);
    // round shading over whatever was drawn: lit top left, shadowed bottom right
    c.globalCompositeOperation = 'source-atop';
    const g = c.createRadialGradient(-r * 0.45, -r * 0.5, 2, 0, 0, r * 1.5);
    g.addColorStop(0, 'rgba(255,255,255,0.35)');
    g.addColorStop(0.45, 'rgba(255,255,255,0)');
    g.addColorStop(0.8, 'rgba(40,10,20,0.12)');
    g.addColorStop(1, 'rgba(40,10,20,0.3)');
    c.fillStyle = g;
    c.fillRect(-40, -40, 80, 80);
  });
}

function item(c, it, t, me) {
  c.save();
  c.translate(it.x, it.y);
  if (it.kind === 'gold') glow(c, 0, 0, it.r * 2.6, '#ffd84d', 0.75 + Math.sin(t * 6) * 0.15);
  // a bomb close to the button pulses red, so it reads at a glance
  if (it.kind === 'bomb') {
    const danger = clamp(1 - Math.hypot(it.x - me.x, it.y - me.y) / 300, 0, 1);
    if (danger) softLight(c, 0, 0, it.r * 2.4, '#ff2a2a', danger * (0.5 + Math.sin(t * 18) * 0.3));
  }
  c.rotate(it.kind === 'bomb' ? Math.sin(it.spin) * 0.3 : it.spin);
  const s = (it.r / ART_R) * 40;
  c.drawImage(itemArt(it.kind), -s, -s, s * 2, s * 2);
  const r = it.r;
  if (it.kind === 'bomb') {
    // the lit fuse flickers and spits light
    const f = 4 + Math.abs(Math.sin(t * 30)) * 4;
    glow(c, 14, -r - 10, f * 3.2, '#ffb02a', 0.9);
    c.fillStyle = '#fff3b0';
    c.beginPath();
    c.arc(14, -r - 10, f * 0.45, 0, Math.PI * 2);
    c.fill();
  } else if (it.kind === 'gold') {
    c.fillStyle = '#fff';
    const tw = 2 + Math.abs(Math.sin(t * 6)) * 3;
    c.fillRect(r * 0.5 - tw / 2, -r * 0.9, tw, tw);
  }
  c.restore();
}

function donut(c, r, icing, dough = '#e0a35a') {
  c.fillStyle = dough;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.arc(0, 0, r * 0.32, 0, Math.PI * 2, true);
  c.fill();
  // wavy icing
  c.fillStyle = icing;
  c.beginPath();
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rad = r * (0.8 + Math.sin(i * 2.3) * 0.06);
    c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  c.closePath();
  c.moveTo(r * 0.42, 0);
  c.arc(0, 0, r * 0.42, 0, Math.PI * 2, true);
  c.fill();
  const colors = ['#fff', '#5bc0eb', '#ffe066', '#7bd389'];
  c.lineWidth = 2.5;
  c.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const a = i * 0.8 + 0.3;
    const rad = r * 0.6;
    c.strokeStyle = colors[i % 4];
    c.beginPath();
    c.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    c.lineTo(Math.cos(a) * rad + Math.cos(a * 3) * 4, Math.sin(a) * rad + Math.sin(a * 3) * 4);
    c.stroke();
  }
}

function cookie(c, r) {
  c.fillStyle = '#d9a066';
  c.strokeStyle = '#b07a3f';
  c.lineWidth = 3;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = '#4a2c1a';
  for (const [x, y] of [[-8, -7], [6, -10], [9, 4], [-4, 8], [-11, 3], [1, -1]]) {
    c.beginPath();
    c.arc(x * (r / 22), y * (r / 22), 3, 0, Math.PI * 2);
    c.fill();
  }
}

function cake(c, r) {
  // a tiny round cake: sponge, frosting with drips, and a cherry
  c.fillStyle = '#f6d7a7';
  rr(c, -r, -r * 0.35, r * 2, r * 1.2, 5);
  c.fill();
  c.fillStyle = '#fff4e6';
  c.fillRect(-r, r * 0.25, r * 2, 4);
  c.fillStyle = '#ff8fb8';
  rr(c, -r, -r * 0.5, r * 2, r * 0.45, 6);
  c.fill();
  for (const x of [-0.6, -0.1, 0.45]) {
    c.beginPath();
    c.arc(x * r, -r * 0.05, 4, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = '#d8233a';
  c.beginPath();
  c.arc(0, -r * 0.68, 6, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#3c7a2a';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, -r * 0.68 - 5);
  c.quadraticCurveTo(3, -r - 4, 7, -r - 6);
  c.stroke();
}

function apple(c, r) {
  c.fillStyle = '#e8473d';
  c.beginPath();
  c.arc(-r * 0.32, 0, r * 0.72, 0, Math.PI * 2);
  c.arc(r * 0.32, 0, r * 0.72, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.4)';
  c.beginPath();
  c.ellipse(-r * 0.45, -r * 0.3, 4, 7, -0.4, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#5a3a1e';
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, -r * 0.55);
  c.lineTo(2, -r * 0.95);
  c.stroke();
  c.fillStyle = '#5cb85c';
  c.beginPath();
  c.ellipse(9, -r * 0.85, 8, 4, -0.5, 0, Math.PI * 2);
  c.fill();
}

function bomb(c, r) {
  const g = c.createRadialGradient(-r * 0.4, -r * 0.3, 1, 0, 2, r);
  g.addColorStop(0, '#5a5668');
  g.addColorStop(0.5, '#2a2734');
  g.addColorStop(1, '#16141c');
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 2, r, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.beginPath();
  c.ellipse(-r * 0.4, -r * 0.25, 5, 8, 0.6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#4a4655';
  c.fillRect(-6, -r - 4, 12, 8);
  c.strokeStyle = '#b08a5a';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(0, -r - 4);
  c.quadraticCurveTo(8, -r - 14, 14, -r - 10);
  c.stroke();
}
