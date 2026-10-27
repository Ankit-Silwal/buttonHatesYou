import { GROUND, ground, plat, edges } from '@/reason/build';
import { Npc, Thing, Pickup, Shot, makeTabby, bark } from '@/reason/actors';
import { sfx } from '@/reason/audio';
import { cx, cy, overlap, rand, pick } from '@/reason/engine';
import { rr, text, heart } from '@/reason/draw';
import { PopupGoblin, KarenPopup } from '../foes';
import { begin, confidence, bellaAt, hearts, flowerShot as flower, mixHex } from '../common';
import { lit, ball, gloss, shine, shadow } from '../look';

// Chapter 3 — The Worst First Date Ever. A bow tie bigger than his body,
// an earpiece, soup, a bill, and a popup who wants the manager.

const W = 2900;
export const ROOM = {
  w: W,
  theme: 'bedroom',
  coins: true,
  solids: [ground(0, W, 'floor'), plat(1950, 330, 120, 'wood'), plat(2380, 300, 120, 'wood'), ...edges(W)],
  deco: [
    { t: 'wall', x: 0, y: 0, w: W, h: GROUND, color: '#f6dccb', stripe: 'rgba(200,120,110,0.12)', trim: '#a05a4a' },
    { t: 'textD', x: 160, y: 120, text: '🍽 LE CLICK · fine dining', size: 18, color: '#a05a4a' },
    { t: 'door', x: 60, y: GROUND, dark: true },
    { t: 'window', x: 700, y: 110, w: 120, h: 100, night: true },
    { t: 'window', x: 1300, y: 110, w: 120, h: 100, night: true },
    { t: 'lamp', x: 1000, y: GROUND },
    { t: 'table', x: 1560, y: GROUND },
    { t: 'table', x: 2200, y: GROUND },
    { t: 'window', x: 2500, y: 110, w: 120, h: 100, night: true },
  ],
  spawn: { x: 140, y: GROUND - 60 },
};

export const FOUNTAIN = {
  w: 960,
  theme: 'night',
  coins: false,
  solids: [ground(0, 960, 'stone'), ...edges(960)],
  deco: [
    { t: 'tree', x: 90, y: GROUND, s: 1.2, color: '#2c4a3a' },
    { t: 'lamppost', x: 250, y: GROUND },
    { t: 'lamppost', x: 720, y: GROUND },
    { t: 'tree', x: 870, y: GROUND, s: 1.1, color: '#2c4a3a' },
  ],
  spawn: { x: 380, y: GROUND - 60 },
};

export default async function play(g, p) {
  const f = g.flags;
  f.sword = true;
  const cur = await begin(g, p, ROOM, 3, 'The Worst First Date Ever', 'love');
  p.acc = ['bigbow'];
  cur.passive = true;
  // the boys are "hiding" (behind a potted plant, by the door)
  const tabby = g.add(new Npc({ kind: 'tabby', x: 20, y: GROUND - 40, facing: 1, weapon: 'tabby' }));
  g.deco = [...g.deco, { t: 'bush', x: 0, y: GROUND, front: true, color: '#5aa652' }];
  await g.talk([
    ['bobby', '*tapping earpiece* Okay. How do I look?'],
    ['tabby', 'Like a gentleman.'],
    ['cursor', 'Like a button attending a funeral.'],
    ['bobby', 'I HATE BOTH OF YOU.'],
    ['tabby', 'Bella’s at the table by the window. You’re going to bring her soup. Romantically.'],
  ]);
  g.lock(false);

  /* ---------- Challenge 1: don't spill the soup ---------- */
  g.objective('Carry the soup to Bella’s table without bumping a waiter.');
  const bella = bellaAt(g, 1610, { facing: -1 });
  const waiters = [[420, 640, 150], [820, 1080, 210], [1180, 1420, 260]].map(([a, b, sp], i) => {
    const w = g.add(new Npc({ kind: 'villager', x: a, y: GROUND - 36, color: '#f4f4f4', dark: '#c9c9c9', acc: ['bowtie'], walkSpeed: sp }));
    w.extra = function () {
      if (this.goal == null) this.goal = Math.abs(cx(this) - a) < 10 ? b : a;
    };
    w.goal = b;
    return w;
  });
  const soup = g.add(new Thing({ w: 22, h: 10, z: 7, spilled: false,
    tick(g) {
      this.x = cx(p) - 11 + p.facing * 4;
      this.y = p.y - 12 + Math.sin(g.time * 8) * 1.5;
    },
    look(c) {
      c.fillStyle = '#fff';
      c.beginPath();
      c.ellipse(this.x + 11, this.y + 6, 12, 5, 0, 0, Math.PI);
      c.fill();
      c.fillStyle = '#e8a33a';
      c.beginPath();
      c.ellipse(this.x + 11, this.y + 5, 10, 2.5, 0, 0, Math.PI * 2);
      c.fill();
    },
  }));
  let spills = 0;
  while (cx(p) < 1520) {
    const bumped = waiters.find((w) => overlap(w, p));
    if (bumped || p.y > GROUND) {
      spills++;
      sfx.crash();
      g.burst(cx(p), p.y - 6, '#e8a33a', 18, 220, 5);
      g.lock();
      await g.say('waiter', pick(['WATCH IT, SIR.', 'That was a twelve-coin soup.', 'Sir, this is a fine dining establishment.']));
      if (spills === 1) await g.say('cursor', 'New soup, back to the kitchen. Jump over them, genius.');
      p.x = 160;
      p.vx = 0;
      g.lock(false);
    }
    await g.wait(1 / 60);
  }
  g.lock();
  soup.dead = true;
  g.objective('');
  await g.walk(p, 1560, 120);
  p.facing = 1;
  bella.mood = 'happy';
  await g.say('bella', 'Soup! You carried it all yourself?');
  await g.say('bobby', 'Spilled it only ' + (spills === 0 ? 'zero times. Like a legend.' : `${spills} time${spills > 1 ? 's' : ''}.`));
  waiters.forEach((w) => (w.dead = true));

  /* ---------- Challenge 2: say something romantic ---------- */
  p.sit = true;
  bella.sit = true;
  g.meter = { label: 'Nervousness', value: 40, color: '#ffb347' };
  const ROUNDS = [
    ['Bella: “So… what do you do for fun?”', [
      ['“I fight bugs. With a sword. It’s legendary.”', -10, 'bella', 'Bugs? That’s… actually kind of cute.'],
      ['“I sleep. Professionally.”', 15, 'bella', 'Honest. I respect that.'],
      ['(Tabby, in your ear) “Say you’re a millionaire.”', 30, 'bella', 'You paid for soup with a coin you found in a field.'],
    ]],
    ['Bella: “Why did you fall in that bin the other day?”', [
      ['“I tripped on a pixel.”', 10, 'bella', 'A single pixel?'],
      ['“I was investigating. For science.”', 20, 'bella', 'Science bin. Sure.'],
      ['“Because I saw you, and my legs forgot how to legs.”', -25, 'bella', '…Oh.'],
    ]],
    ['Bella: “Do you like the restaurant?”', [
      ['“Not as much as I like you.”', -20, 'bella', 'Smooth! Where did that come from?'],
      ['(Cursor, in your ear) “Ask her about her flowers.”', -10, 'bella', 'You remembered I sell flowers? That’s sweet.'],
      ['“I SWEAT WHEN I’M NERVOUS. I AM SO NERVOUS RIGHT NOW.”', 40, 'bella', '…Do you need a napkin?'],
    ]],
  ];
  for (const [q, opts] of ROUNDS) {
    const k = await g.choose(q, opts.map((o) => o[0]));
    const [, d, who, reply] = opts[k];
    g.meter.value = Math.max(0, g.meter.value + d);
    sfx.blip(d > 0 ? 0.6 : 1.6);
    await g.say(who, reply);
    if (g.meter.value > 100) {
      await g.say('bobby', 'I’M SWEATING THROUGH MY BOW TIE.');
      g.meter.value = 80;
    }
  }
  g.meter = null;

  /* ---------- Challenge 3: pay for dinner ---------- */
  await g.say('waiter', 'Your bill, sir. Soup: 2 coins. Ambience: 3 coins. Breathing fee: 3 coins. Total: 8 coins.');
  await g.say('bobby', 'BREATHING FEE?');
  f.coins = 0;
  await g.say('cursor', 'You spent all 50 coins on ONE flower for her yesterday, didn’t you.');
  await g.say('bobby', 'It was a really nice flower.');
  p.sit = false;
  g.lock(false);
  g.objective('Find 8 coins around the dining room. Cursor can check suspicious things (click them, or R).');
  const spots = [[1880, GROUND - 60, 'plant'], [1320, 190, 'painting'], [2650, GROUND - 70, 'coat rack']];
  spots.forEach(([x, y, label]) =>
    g.add(new Thing({ x: x - 18, y: y - 20, w: 36, h: 40, z: 3, clickable: true, label,
      onPress(g) {
        this.clickable = false;
        for (let i = 0; i < 2; i++) g.add(new Pickup({ kind: 'coin', x: cx(this) - 8, y: this.y, pop: true }));
        sfx.coin();
        bark(g, cur, pick(['Found some!', 'Under the plant. Classic.', 'Behind the painting? Who does that?']), 1.8);
      },
      look(c, g) {
        if (label === 'plant') {
          c.fillStyle = '#a8744a';
          c.fillRect(this.x + 6, this.y + 22, 24, 18);
          c.fillStyle = '#5aa652';
          c.beginPath();
          c.arc(this.x + 18, this.y + 14, 16, 0, Math.PI * 2);
          c.fill();
        } else if (label === 'painting') {
          c.fillStyle = '#8a6040';
          c.fillRect(this.x, this.y, 36, 40);
          c.fillStyle = '#9fd6ff';
          c.fillRect(this.x + 4, this.y + 4, 28, 32);
          heart(c, this.x + 18, this.y + 20, 6, '#ff8fb1');
        } else {
          c.fillStyle = '#6b4528';
          c.fillRect(this.x + 16, this.y, 4, 40);
          c.fillRect(this.x + 6, this.y + 4, 24, 3);
        }
        if (this.clickable) {
          c.strokeStyle = `rgba(127,220,255,${0.35 + 0.35 * Math.sin(g.time * 5)})`;
          c.lineWidth = 2;
          c.strokeRect(this.x - 3, this.y - 3, this.w + 6, this.h + 6);
        }
      },
    }))
  );
  [[1990, 290], [2420, 260], [2200, GROUND - 60]].forEach(([x, y]) => g.add(new Pickup({ kind: 'coin', x, y })));
  [[1000, 380], [2780, 380]].forEach(([x, y]) => g.add(new Pickup({ kind: 'coin', x, y })));
  await g.until(() => (f.coins ?? 0) >= 8);
  g.objective('');
  f.coins -= 8;
  sfx.win();
  bark(g, p, 'PAID. Including the breathing.', 2.2);
  await g.wait(1.2);

  /* ---------- Challenge 4: save the restaurant ---------- */
  g.lock();
  sfx.error();
  g.shake(8);
  const goblins = [2000, 2200, 2400].map((x) => g.add(new PopupGoblin({ x, y: GROUND - 60 })));
  await g.talk([
    ['bella', 'Bobby… why are there popups in the restaurant?'],
    ['bobby', 'I DIDN’T INVITE THEM.'],
  ]);
  g.lock(false);
  g.objective('Clear the Popup Goblins!');
  await g.cleared(goblins);
  const A0 = 1940;
  const A1 = 2900;
  g.lock();
  g.cam.fixed = { x: (A0 + A1) / 2, y: 270 };
  await g.walk(p, A0 + 160, 200);
  g.addSolid({ x: A0 - 20, y: -400, w: 20, h: 900, kind: 'none' });
  g.checkpoint(A0 + 60, GROUND - 60);
  const karen = g.add(new KarenPopup({ x0: A0, x1: A1 }));
  g.boss = karen;
  sfx.boom();
  await g.talk([
    ['karen', 'THIS SERVICE IS UNACCEPTABLE.'],
    ['bobby', 'MA’AM, I’M ON A DATE.'],
    ['karen', 'I WANT A REFUND.'],
    ['bobby', 'I WANT A GIRLFRIEND. WE CAN’T ALL GET WHAT WE WANT.'],
  ]);
  g.music('adventure');
  g.lock(false);
  g.objective('Hit her when she swoops down to complain!');
  g.onRespawn = () => {
    for (const e of g.ents) if (e instanceof Shot) e.dead = true;
  };
  // Bella joins in, throwing flowers
  await g.until(() => karen.hp <= 10 || karen.dead);
  g.lock();
  bella.sit = false;
  bella.x = A0 + 60;
  bella.y = GROUND - 40;
  await g.talk([
    ['bella', 'Hey! Leave him alone, he hasn’t paid the tip yet!'],
    ['bobby', 'YOU CAN FIGHT?'],
    ['bella', 'You thought I just sold flowers?'],
    ['bobby', 'YES.'],
    ['bella', 'That’s adorable.'],
  ]);
  g.lock(false);
  bella.follow = p;
  bella.followSpeed = 200;
  const flowers = g.add(new Thing({ w: 0, h: 0, hidden: true, t: 1, tick(g, dt) {
    this.t -= dt;
    if (this.t > 0 || karen.dead) return;
    this.t = 1.6;
    g.add(flower(bella, karen));
  } }));
  await g.until(() => karen.dead);
  flowers.dead = true;
  g.boss = null;
  g.onRespawn = null;
  g.objective('');
  g.lock();
  g.music(null, 0.5);
  await g.wait(1);
  await g.say('waiter', '…Dessert?');
  await g.fade(1, 1.2);

  /* ---------- the fountain ---------- */
  g.load(FOUNTAIN, p);
  g.cam.fixed = null;
  p.acc = ['bigbow'];
  p.x = 420;
  p.facing = 1;
  p.sit = true;
  const b2 = bellaAt(g, 480, { facing: -1, sit: true });
  const fountain = g.add(new Thing({ x: 380, y: GROUND - 90, w: 160, h: 90, z: 0, look(c, g) {
    const { x, y } = this;
    const t = g.time;
    // the stone: a lit basin, a column and a little top bowl
    shadow(c, x + 80, y + 90, 190, 0.35);
    c.fillStyle = lit(c, y + 50, 40, '#c4c9d6', '#6d7384');
    rr(c, x, y + 50, 160, 40, 8);
    c.fill();
    c.fillStyle = '#d9dde8';
    rr(c, x - 4, y + 46, 168, 8, 4);
    c.fill();
    c.fillStyle = lit(c, y + 8, 42, '#bfc5d2', '#7a8090');
    c.fillRect(x + 70, y + 8, 20, 42);
    c.fillStyle = '#d9dde8';
    c.beginPath();
    c.ellipse(x + 80, y + 8, 26, 6, 0, 0, Math.PI * 2);
    c.fill();
    // the pool, shimmering with moonlight
    c.fillStyle = lit(c, y + 50, 10, '#3a6ab0', '#1d3a6a');
    c.beginPath();
    c.ellipse(x + 80, y + 52, 74, 5, 0, 0, Math.PI * 2);
    c.fill();
    for (let i = 0; i < 6; i++) {
      const k = (t * 0.6 + i / 6) % 1;
      c.fillStyle = `rgba(200,230,255,${0.6 * Math.sin(k * Math.PI)})`;
      c.fillRect(x + 20 + i * 22 + Math.sin(t + i) * 4, y + 51, 10 + 6 * k, 1.5);
    }
    // water arcs: glowing droplets on parabolas
    shine(c, '127,200,255', x + 80, y + 20, 90, 0.22);
    c.fillStyle = 'rgba(200,236,255,0.9)';
    for (let i = 0; i < 16; i++) {
      const side = i % 2 ? 1 : -1;
      const k = (t * 0.9 + i / 16) % 1;
      const dx = side * k * (46 + (i % 4) * 6);
      const dy = -26 * Math.sin(k * Math.PI) + k * k * 44;
      c.globalAlpha = 1 - k * 0.6;
      c.beginPath();
      c.arc(x + 80 + dx, y + 4 + dy, 2.2 - k, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  } }));
  g.add(new Npc({ kind: 'tabby', x: 80, y: GROUND - 40, facing: 1 }));
  makeCursorHome(g, p);
  g.music('love');
  await g.fade(0, 1.4);
  await g.wait(1);
  await g.talk([
    ['bella', 'You’re kind of a disaster.'],
    ['bobby', 'I’ve been told.'],
    ['bella', 'But you tried really hard to make today special.'],
    ['bobby', 'Did it work?'],
    ['bella', 'A little.'],
  ]);
  await g.wait(1);
  sfx.pop();
  hearts(g, b2, 4);
  await g.card('', 'Bella kisses Bobby on the cheek.', 2.4, 'soft');
  p.mood = 'closed';
  for (let i = 0; i <= 20; i++) {
    p.color = mixHex('#e2674f', '#ff8fb1', i / 20);
    await g.wait(0.04);
  }
  sfx.error();
  await g.say('sys', 'BOBBY.EXE HAS STOPPED RESPONDING', { noSkip: true, auto: 2 });
  await g.talk([
    ['tabby', 'CURSOR! WE BROKE HIM!'],
    ['cursor', 'LET HIM COOK.'],
  ]);
  await g.wait(1);
  await g.card('', 'Bobby and Bella are officially dating.', 3, 'soft');
  await g.fade(1, 1.5);
  p.color = null;
  p.mood = 'calm';
  p.sit = false;
  g.lock(false);
}

// Cursor parked by the bush with Tabby during the fountain scene.
function makeCursorHome(g, p) {
  const c = p.buddy;
  if (!c) return;
  g.add(c);
  c.dead = false;
  c.home = { x: 130, y: GROUND - 90 };
  c.x = 130;
  c.y = GROUND - 90;
}
