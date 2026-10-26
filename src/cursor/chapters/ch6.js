import { GROUND, ground, plat, block, edges } from '@/reason/build';
import { Npc, Thing, Shot, makeTabby, bark } from '@/reason/actors';
import { sfx } from '@/reason/audio';
import { cx, cy, overlap, rand, pick } from '@/reason/engine';
import { rr, text, heart, popupWindow, sword } from '@/reason/draw';
import { CakeAnt, Error500 } from '../foes';
import { begin, bellaAt, hearts, petals, flowerShot } from '../common';
import { BEDROOM } from '@/reason/episodes/ep1';

// Chapter 6 — The Wedding Disaster. Ants, the wrong guests, a boss through
// the roof, a checkbox priest, and one promise.

const W = 3200;
const STREET = {
  w: W,
  theme: 'village',
  coins: false,
  solids: [ground(0, 1400), ground(1520, W - 1520), plat(1410, 400, 110), plat(900, 340, 120), plat(2200, 330, 140), block(2600, 400, 60, 60, 'stone'), ...edges(W)],
  deco: [
    { t: 'house', x: 80, y: GROUND, w: 230, h: 150, color: '#f4e1c8', roof: '#c9523e', label: 'Bobby & Bella' },
    { t: 'flower', x: 340, y: GROUND, c: '#ff8fb1' },
    { t: 'stall', x: 600, y: GROUND, color: '#ff8fb1', sign: 'CAKE (stolen)' },
    { t: 'tree', x: 1200, y: GROUND, s: 1.1 },
    { t: 'fence', x: 1700, y: GROUND, w: 120 },
    { t: 'tree', x: 2400, y: GROUND, s: 1 },
    { t: 'house', x: 2850, y: GROUND, w: 260, h: 170, color: '#fff5f8', roof: '#ff8fb1', label: 'WEDDING HALL' },
  ],
  spawn: { x: 380, y: GROUND - 60 },
};

const HALL = {
  w: 960,
  theme: 'bedroom',
  coins: false,
  solids: [ground(0, 960, 'floor'), plat(80, 320, 140, 'wood'), plat(740, 320, 140, 'wood'), ...edges(960)],
  deco: [
    { t: 'wall', x: 0, y: 0, w: 960, h: GROUND, color: '#fff3f6', stripe: 'rgba(255,143,177,0.12)', trim: '#e8a0b8' },
    { t: 'textD', x: 480, y: 70, text: '♥ BOBBY & BELLA ♥', size: 26, color: '#ff4f7b' },
    { t: 'window', x: 140, y: 110, w: 100, h: 90 },
    { t: 'window', x: 720, y: 110, w: 100, h: 90 },
  ],
  spawn: { x: 430, y: GROUND - 60 },
};

const SEATS = [
  { x: 180, label: 'by the GIFTS', ok: 'karen' },
  { x: 480, label: 'by the SPEAKERS', ok: 'tax' },
  { x: 780, label: 'by the EXIT', ok: 'lord' },
];

export default async function play(g, p) {
  const f = g.flags;
  f.sword = true;
  f.slam = true;
  f.doubleJump = true;
  const cur = await begin(g, p, STREET, 6, 'The Wedding Disaster', 'wedding');
  p.acc = ['bowtie'];
  const tabby = makeTabby(g, p, 300, GROUND - 40);
  await g.talk([
    ['note', 'The wedding day. Bobby wears a black bow tie. Cursor is the best man. Tabby organised the ceremony.'],
    ['note', 'This was a terrible decision.'],
    ['tabby', 'Okay! Everything is under control. Totally. One hundred percent.'],
    ['bobby', 'Where’s the cake?'],
    ['tabby', '…Ninety percent.'],
  ]);

  /* ---------- Disaster 1: the missing cake ---------- */
  const ants = [700, 1000, 1300, 1700].map((x) => g.add(new CakeAnt({ x, y: GROUND - 20 })));
  g.cam.target = ants[0];
  await g.wait(1.2);
  g.cam.target = null;
  await g.talk([
    ['bobby', 'WHY DO ANTS WANT CAKE?'],
    ['tabby', 'THEY’RE ANTS.'],
    ['bobby', 'THEY HAVE NO RESPECT FOR MARRIAGE.'],
  ]);
  g.music('adventure');
  g.lock(false);
  let slices = 0;
  ants.forEach((a) => (a.onKill = (g) => {
    slices++;
    sfx.item();
    g.floatText(cx(a), a.y - 20, `cake ${slices}/4`, '#ffd0e0', 15);
  }));
  const tick = () => g.objective(`Get the cake back from the ants (${slices}/4).`);
  tick();
  await g.until(() => {
    tick();
    return slices >= 4;
  });
  g.objective('');
  bark(g, p, 'Cake: rescued. Slightly ant-flavoured.', 2.4);
  g.objective('Head to the wedding hall.');
  await g.reach(2900);
  g.lock();
  await g.fade(1, 0.8);

  /* ---------- Disaster 2: the wrong guests ---------- */
  g.load(HALL, p);
  g.add(cur);
  cur.home = null;
  g.add(tabby);
  g.music('village');
  const bella = bellaAt(g, 640, { facing: -1, acc: ['veil'] });
  const guests = [
    guest(g, 'tax', 'Tax Collector', 300),
    guest(g, 'lord', 'Lord 404', 380),
    guest(g, 'karen', 'Karen Popup', 560),
  ];
  const seats = SEATS.map((s) => seat(g, s));
  await g.fade(0, 0.8);
  await g.talk([
    ['tabby', 'So… I might have invited the entire kingdom.'],
    ['bobby', 'Tabby. Is that the TAX COLLECTOR?'],
    ['tax', 'MARRIAGE REGISTRATION FEE. TWELVE COINS. ALSO A KISS TAX.'],
    ['lord404', '*sobbing* I love weddings. I hate weddings. I love weddings.'],
    ['karen', 'WHO DID THIS SEATING CHART? I WANT TO SPEAK TO THE ORGANISER.'],
    ['tabby', 'That’s me. Hi.'],
    ['cursor', 'Okay. Seating. The Tax Collector can’t sit by the gifts. Karen can’t sit by the speakers. Lord 404 has to be by the exit, for crying reasons.'],
  ]);
  g.lock(false);
  g.objective('Seat the guests: drag them with the mouse, or E to pick one up and E at a seat.');
  let solved = false;
  while (!solved) {
    await g.until(() => guests.every((x) => x.seat));
    const wrong = guests.filter((x) => SEATS[x.seat - 1].ok !== x.id);
    if (!wrong.length) {
      solved = true;
      break;
    }
    g.lock();
    const w0 = wrong[0];
    await g.say(w0.id === 'lord' ? 'lord404' : w0.id, w0.id === 'tax' ? 'I SEE GIFTS. GIFTS ARE TAXABLE.' : w0.id === 'karen' ? 'THE MUSIC IS TOO LOUD. I WANT TO MOVE.' : '*sob* I need to be near the exit… for… emotional exits.');
    guests.forEach((x, i) => {
      x.seat = 0;
      x.x = 280 + i * 120;
      x.y = GROUND - x.h;
    });
    g.lock(false);
  }
  g.objective('');
  sfx.win();
  bark(g, cur, 'Seating chart: approved. By me.', 2.4);
  guests.forEach((x) => {
    x.draggable = false;
    x.actOff = true;
  });
  seats.forEach((s) => (s.actOff = true));
  await g.wait(1.4);

  /* ---------- Disaster 3: the wedding crasher ---------- */
  g.lock();
  g.music(null, 0.2);
  sfx.boom();
  g.shake(20);
  g.fx.flash = 0.8;
  guests.forEach((x) => (x.hidden = true));
  await g.wait(0.6);
  const boss = g.add(new Error500({ x: 600, x0: 0, x1: 960 }));
  boss.y = -200;
  g.boss = boss;
  await g.until(() => boss.ground);
  g.shake(14);
  await g.talk([
    ['e500', 'INTERNAL SERVER ERROR.'],
    ['bobby', 'BRO. NOT TODAY.'],
    ['e500', 'SERVICE UNAVAILABLE.'],
    ['bobby', 'MY WEDDING IS VERY MUCH AVAILABLE.'],
    ['cursor', 'Click it and I’ll scan for weak spots. Hit it while they glow!'],
  ]);
  g.music('danger');
  g.checkpoint(200, GROUND - 60);
  bella.follow = p;
  bella.followSpeed = 200;
  g.lock(false);
  g.objective('Click the monster (or R) to reveal weak spots, then hit it! Tabby and Bella are helping.');
  g.onRespawn = () => {
    for (const e of g.ents) if (e instanceof Shot) e.dead = true;
  };
  const helpers = g.add(new Thing({ w: 0, h: 0, hidden: true, tf: 1.2, tg: 6, tick(g, dt) {
    if (boss.dead || g.locked) return;
    this.tf -= dt;
    this.tg -= dt;
    if (this.tf <= 0) {
      this.tf = 1.7;
      g.add(flowerShot(bella, boss));
    }
    if (this.tg <= 0) {
      this.tg = 9;
      boss.stunned = 2.2;
      sfx.stun();
      g.burst(cx(boss), boss.y + 40, '#5b9bd5', 16, 240, 6);
      bark(g, tabby, pick(['WEDDING GIFT! It’s a toaster!', 'Have a blender!', 'Gravy boat, incoming!']), 2);
    }
  } }));
  await g.until(() => boss.dead);
  helpers.dead = true;
  g.boss = null;
  g.onRespawn = null;
  g.objective('');
  bella.follow = null;
  g.music(null, 0.5);
  await g.wait(1.2);

  /* ---------- the wedding ---------- */
  guests.forEach((x) => (x.hidden = false));
  g.cam.fixed = { x: 480, y: 270 };
  const priest = g.add(new Thing({ x: 462, y: GROUND - 34, w: 36, h: 34, z: 3, look(c, g) {
    c.fillStyle = '#fff';
    rr(c, this.x, this.y, 36, 30, 5);
    c.fill();
    c.strokeStyle = '#333';
    c.lineWidth = 2;
    rr(c, this.x, this.y, 36, 30, 5);
    c.stroke();
    c.strokeStyle = '#2bb24c';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(this.x + 8, this.y + 15);
    c.lineTo(this.x + 15, this.y + 22);
    c.lineTo(this.x + 28, this.y + 8);
    c.stroke();
  } }));
  p.x = 400;
  p.y = GROUND - p.h;
  p.facing = 1;
  bella.x = 540;
  bella.y = GROUND - 40;
  bella.facing = -1;
  bella.faceTo = null;
  tabby.follow = null;
  tabby.x = 200;
  cur.home = { x: 330, y: GROUND - 100 };
  g.lock();
  g.music('wedding');
  for (let i = 0; i <= 30; i++) {
    g.cam.zoom = 1.6 - (i / 30) * 0.4;
    await g.wait(1 / 30);
  }
  await g.talk([
    ['priest', 'Do you, Bobby, take Bella to be your lawfully wedded wife?'],
    ['bobby', 'YES.'],
    ['priest', 'And do you, Bella, take Bobby as your husband?'],
    ['bella', 'Unfortunately, yes.'],
    ['bobby', 'HEY.'],
    ['priest', 'You may now kiss the bride.'],
  ]);
  await g.say('tax', 'KISS TAX. TWO COINS. …FINE. THIS ONE’S ON THE HOUSE.');
  await g.wait(0.8);
  p.facing = -1;
  await g.talk([
    ['bobby', 'Bro.'],
    ['cursor', 'Yeah?'],
    ['bobby', 'We actually did it.'],
    ['cursor', 'We did.'],
    ['bobby', 'Thanks for helping me.'],
    ['cursor', 'Anytime.'],
    ['bobby', 'You’re my best friend.'],
    ['tabby', '*gasps* EXCUSE ME?!'],
    ['bobby', 'ONE OF MY BEST FRIENDS.'],
    ['tabby', 'BETTER.'],
  ]);
  p.facing = 1;
  await g.wait(0.6);
  hearts(g, p, 10);
  hearts(g, bella, 10);
  sfx.win();
  const confetti = g.add(new Thing({ w: 0, h: 0, hidden: true, alwaysUpdate: true, tick(g) {
    for (let i = 0; i < 3; i++) g.parts.push({ x: rand(0, 960), y: -10, vx: rand(-40, 40), vy: rand(60, 160), grav: 40, life: 5, max: 5, color: pick(['#ff8fb1', '#f2c14e', '#7fdcff', '#a58bd6', '#ffffff']), size: rand(3, 6) });
  } }));
  await g.card('', 'Bobby kisses Bella. Everyone cheers.', 3, 'soft');
  bark(g, guests[1], '*sobbing happily*', 3);
  for (let i = 0; i <= 60; i++) {
    g.cam.zoom = 1.2 - (i / 60) * 0.2;
    g.fx.tint = '#ff9a6b';
    g.fx.tintA = (i / 60) * 0.25;
    await g.wait(1 / 30);
  }
  await g.wait(1.5);
  await g.fade(1, 2);
  confetti.dead = true;
  g.fx.tintA = 0;
  g.cam.zoom = 1;
  g.cam.fixed = null;

  /* ---------- epilogue: one last gift ---------- */
  await epilogue(g, p);
}

async function epilogue(g, p) {
  const f = g.flags;
  g.load(BEDROOM, p); // the same room The Reason opens in, wedding photo and Forever Bloom included
  p.acc = [];
  p.x = 380;
  p.facing = 1;
  const bella = g.add(new Npc({ kind: 'bella', x: 610, y: GROUND - 40, facing: -1 }));
  const cur = p.buddy;
  g.add(cur);
  cur.home = { x: 820, y: GROUND - 120 };
  let broken = false;
  const table = g.add(new Thing({ x: 440, y: GROUND - 30, w: 70, h: 30, z: 2, look(c) {
    c.fillStyle = '#c58d58';
    if (broken) {
      c.fillRect(this.x, this.y + 24, 30, 6);
      c.fillRect(this.x + 38, this.y + 20, 28, 6);
      c.fillRect(this.x + 20, this.y + 26, 4, 4);
    } else {
      c.fillRect(this.x, this.y, 70, 8);
      c.fillRect(this.x + 4, this.y + 8, 6, 22);
      c.fillRect(this.x + 60, this.y + 8, 6, 22);
    }
  } }));
  g.music('music_box');
  await g.fade(0, 1.6);
  await g.say('note', 'A few days later. Their new house.');
  for (let i = 0; i < 2; i++) {
    sfx.hammer();
    p.atk = { kind: 'slash', t: 0, dur: 0.24, hit: new Set() };
    g.shake(3);
    await g.wait(0.5);
  }
  await g.talk([
    ['bella', 'Bobby, you’re supposed to use a screwdriver.'],
    ['bobby', 'MY SWORD IS MULTIPURPOSE.'],
  ]);
  sfx.hammer();
  p.atk = { kind: 'finisher', t: 0, dur: 0.32, hit: new Set() };
  await g.say('bella', 'YOU’RE BREAKING THE TABLE.');
  broken = true;
  sfx.crash();
  g.burst(475, GROUND - 20, '#c58d58', 14, 200, 5);
  await g.say('bobby', 'THE TABLE IS WEAK.');
  bella.mood = 'happy';
  await g.say('bella', '*laughs*');
  await g.wait(1);
  await g.walk(bella, cx(p) + 50, 80);
  bella.faceTo = p;
  await g.card('', 'Bella gives Bobby a little silver pendant shaped like a heart.', 3, 'soft');
  await g.talk([
    ['bella', 'Here. I got you something.'],
    ['bobby', 'What is it?'],
    ['bella', 'A reminder.'],
    ['bobby', 'Of what?'],
    ['bella', 'That no matter where you go, there’s always someone waiting for you at home.'],
  ]);
  f.pendant = true;
  p.pendantGlow = true;
  sfx.item();
  await g.wait(2.2);
  p.pendantGlow = false;
  await g.say('bobby', 'I love you.');
  await g.say('bella', 'I love you too.');
  await g.wait(1.2);
  // Cursor heads out
  cur.home = { x: 905, y: GROUND - 60 };
  await g.wait(1.2);
  p.facing = 1;
  await g.say('bobby', 'HEY, CURSOR!');
  await g.say('cursor', 'Yeah?');
  await g.say('bobby', 'Promise me something.');
  await g.say('cursor', 'What?');
  await g.say('bobby', 'If anything ever happens… you’ll look after her, right?');
  await g.choose('', ['“I promise.”']);
  f.promised = true;
  p.mood = 'happy';
  await g.say('bobby', 'Thanks, bro.');
  await g.wait(1.4);
  await g.fade(1, 2.4);
  g.fx.noHud = true;
  sfx.win();
  await g.card('FRIENDSHIP SAVED SUCCESSFULLY', '', 3.4, 'ending');
  await g.wait(0.5);
  sfx.glitch();
  await g.card('UNKNOWN PROCESS CONNECTED', '', 0.7, 'error');
  await g.card('ADMIN.EXE', '', 0.6, 'error');
  await g.wait(0.8);
  await g.card('END.', 'Continue the story in The Reason.', 3.4, 'ending');
  g.lock(false);
}

// A wedding guest you can drag (mouse) or carry (E).
function guest(g, id, name, x) {
  const t = g.add(new Thing({ id, name, x, y: GROUND - 44, w: 40, h: 44, z: 5, draggable: true, seat: 0, actLabel: `Pick up ${name}`,
    onPick() {
      this.seat = 0;
    },
    onDrop(g) {
      const s = SEATS.findIndex((st) => Math.abs(st.x - cx(this)) < 70);
      if (s >= 0 && !guestsAt(g, s + 1, this)) sitAt(this, s + 1);
      else {
        this.y = GROUND - this.h;
        this.seat = 0;
      }
    },
    act(g) {
      const p = g.player;
      if (p.carrying) return;
      p.carrying = this;
      this.seat = 0;
      this.carried = true;
    },
    tick(g) {
      const p = g.player;
      if (this.carried) {
        this.x = cx(p) - this.w / 2;
        this.y = p.y - this.h - 4;
        this.actOff = true;
      } else if (!this.done) this.actOff = false;
      if (!this.carried && !this.seat && g.dragging?.e !== this) this.y = Math.min(this.y + 6, GROUND - this.h);
    },
    look(c, g) {
      drawGuest(c, g, this);
      text(c, this.name, cx(this), this.y - 10, { size: 10, color: '#7a4a5a' });
    },
  }));
  return t;
}

function guestsAt(g, n, except) {
  return g.ents.some((e) => e.id && e !== except && e.seat === n);
}

function sitAt(t, n) {
  t.seat = n;
  t.x = SEATS[n - 1].x - t.w / 2;
  t.y = GROUND - 30 - t.h;
}

// A chair with a label. E here drops the guest Bobby is carrying.
function seat(g, s) {
  return g.add(new Thing({ x: s.x - 26, y: GROUND - 30, w: 52, h: 30, z: 1, actLabel: 'Seat them here', actOff: true,
    tick(g) {
      const p = g.player;
      this.actOff = !p.carrying;
    },
    act(g) {
      const p = g.player;
      const t = p.carrying;
      if (!t) return;
      const n = SEATS.indexOf(s) + 1;
      if (guestsAt(g, n, t)) return bark(g, p, 'Seat’s taken.', 1.4);
      p.carrying = null;
      t.carried = false;
      sitAt(t, n);
      sfx.select();
    },
    look(c) {
      c.fillStyle = '#e8a0b8';
      rr(c, this.x, this.y, this.w, 10, 3);
      c.fill();
      c.fillRect(this.x + 4, this.y + 10, 6, 20);
      c.fillRect(this.x + this.w - 10, this.y + 10, 6, 20);
      c.fillRect(this.x + 4, this.y - 30, 6, 30);
      text(c, s.label, this.x + this.w / 2, this.y + 44, { size: 11, color: '#a05a6a' });
    },
  }));
}

function drawGuest(c, g, t) {
  const { x, y, w, h } = t;
  if (t.id === 'tax') {
    c.fillStyle = '#f4a6b8';
    c.beginPath();
    c.ellipse(x + w / 2, y + h / 2 + 6, w / 2, h / 2 - 6, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#111';
    c.fillRect(x + 12, y + 20, 4, 4);
    c.fillRect(x + 24, y + 20, 4, 4);
    c.strokeStyle = '#f2c14e';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(x + 26, y + 22, 4, 0, Math.PI * 2);
    c.stroke();
  } else if (t.id === 'lord') {
    c.fillStyle = '#7a3fc4';
    c.beginPath();
    c.moveTo(x + w / 2, y);
    c.lineTo(x + w, y + h);
    c.lineTo(x, y + h);
    c.fill();
    text(c, '404', x + w / 2, y + 28, { size: 10, color: '#e6c8ff' });
    c.fillStyle = '#7fc8ff';
    c.fillRect(x + 12, y + 32 + ((g.time * 30) % 8), 2, 4);
  } else {
    popupWindow(c, x, y + 8, w, h - 8, '>:(', '#ff7a59');
    c.fillStyle = '#e6c06a';
    c.beginPath();
    c.ellipse(x + 10, y + 10, 14, 8, -0.3, Math.PI, 0);
    c.fill();
  }
}
