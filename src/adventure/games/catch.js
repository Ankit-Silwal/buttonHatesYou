import { W, H, rand, pick, clamp, rr, heart, text, drawBobby, drawScore, backdrop, Mouth, Sparks } from '../kit';

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

    update(dt) {
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
      squash = Math.max(0, squash - dt);
      chomp = Math.max(0, chomp - dt);
      hurt = Math.max(0, hurt - dt);
      shake = Math.max(0, shake - dt);

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
      backdrop(c, '#ffc98f', '#fff1dc');

      // a sun and some lazy clouds over the picnic
      c.fillStyle = '#ffe28a';
      c.beginPath();
      c.arc(390, 220, 46, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 4; i++) {
        const x = ((i * 150 + t * 12) % (W + 160)) - 80;
        cloud(c, x, 200 + (i % 2) * 110);
      }
      c.fillStyle = '#9fd38a';
      c.beginPath();
      c.arc(90, GROUND + 40, 200, Math.PI, 0);
      c.arc(400, GROUND + 50, 170, Math.PI, 0);
      c.fill();

      // the checked picnic blanket is the ground
      c.fillStyle = '#fff';
      c.fillRect(0, GROUND, W, H - GROUND);
      c.fillStyle = '#e65a4f';
      for (let y = 0; y < 3; y++) for (let x = 0; x < 16; x++) if ((x + y) % 2) c.fillRect(x * 32, GROUND + y * 24, 32, 24);

      for (const it of items) item(c, it, t);

      // the mouth opens when something is about to land on it
      const incoming = items.some((it) => it.y > me.y - 190 && it.y < me.y - SIZE * 0.2 && Math.abs(it.x - me.x) < SIZE * 0.8);
      c.fillStyle = 'rgba(0,0,0,0.15)';
      c.beginPath();
      c.ellipse(me.x, GROUND + 4, SIZE * 0.42, 7, 0, 0, Math.PI * 2);
      c.fill();
      drawBobby(c, me.x, me.y, SIZE, {
        look,
        t,
        squash,
        facing: me.facing,
        moving: me.moving,
        flash: hurt > 0.45,
        mood: g.over ? 'sad' : hurt ? 'angry' : incoming && !chomp ? 'shout' : chomp ? 'happy' : 'smug',
        tears: g.over,
      });

      sparks.draw(c);
      mouth.draw(c, me.x, me.y - SIZE * 0.62);
      c.restore();

      drawScore(c, g.score);
      for (let i = 0; i < LIVES; i++) heart(c, W / 2 - 30 + i * 30, 130, 10, i < lives ? '#ff4f7b' : 'rgba(255,255,255,0.45)');
      if (t < 3 && !g.over) text(c, 'Drag, or use ← →', W / 2, 168, { size: 16, color: 'rgba(80,50,30,0.8)' });
    },
  };
  return g;
}

function item(c, it, t) {
  c.save();
  c.translate(it.x, it.y);
  c.rotate(it.kind === 'bomb' ? Math.sin(it.spin) * 0.3 : it.spin);
  const r = it.r;
  if (it.kind === 'donut') donut(c, r, '#ff8fb8');
  else if (it.kind === 'gold') {
    // a golden donut, worth three
    const glow = c.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.9);
    glow.addColorStop(0, 'rgba(255,226,90,0.7)');
    glow.addColorStop(1, 'rgba(255,226,90,0)');
    c.fillStyle = glow;
    c.beginPath();
    c.arc(0, 0, r * 1.9, 0, Math.PI * 2);
    c.fill();
    donut(c, r, '#ffd84d', '#e0a92a');
    c.fillStyle = '#fff';
    const tw = 2 + Math.abs(Math.sin(t * 6)) * 3;
    c.fillRect(r * 0.5 - tw / 2, -r * 0.9, tw, tw);
  } else if (it.kind === 'cookie') cookie(c, r);
  else if (it.kind === 'cake') cake(c, r);
  else if (it.kind === 'apple') apple(c, r);
  else bomb(c, r, t);
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

function bomb(c, r, t) {
  c.fillStyle = '#26232e';
  c.beginPath();
  c.arc(0, 2, r, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.25)';
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
  // the lit fuse flickers
  const f = 4 + Math.abs(Math.sin(t * 30)) * 4;
  c.fillStyle = '#ffd84d';
  c.beginPath();
  c.arc(14, -r - 10, f, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ff6a2a';
  c.beginPath();
  c.arc(14, -r - 10, f * 0.5, 0, Math.PI * 2);
  c.fill();
}

function cloud(c, x, y) {
  c.beginPath();
  c.arc(x, y, 22, 0, Math.PI * 2);
  c.arc(x + 24, y - 10, 26, 0, Math.PI * 2);
  c.arc(x + 50, y, 20, 0, Math.PI * 2);
  c.fill();
}
