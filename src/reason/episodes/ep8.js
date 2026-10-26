import { GROUND } from '../build';
import { Npc, Thing, bark } from '../actors';
import { sfx } from '../audio';
import { cx } from '../engine';
import { rr, sword } from '../draw';
import { BEDROOM, VILLAGE } from './ep1';

// Episode 8 — The Day Everything Died. The walk home from Episode 1,
// backwards, with everything in the same place and nothing left.

// Episode 1's village, after the purge.
const RUINED = {
  ...VILLAGE,
  theme: 'wreck',
  coins: false,
  solids: VILLAGE.solids.map((s) => (s.kind === 'grass' ? { ...s, kind: 'dirt' } : s.kind === 'wood' ? { ...s, kind: 'ruin' } : s)),
  deco: [
    ...VILLAGE.deco.map((d) => {
      if (d.t === 'house') return { ...d, empty: true, label: d.label?.startsWith('Tabby') ? '' : d.label, roof: '#6a4a44', color: '#a89a8e' };
      if (d.t === 'stall') return { ...d, broken: true };
      if (d.t === 'tree' || d.t === 'flower' || d.t === 'fence') return { ...d, dead: true };
      if (d.t === 'lamppost') return { ...d, off: true };
      if (d.t === 'bush') return { ...d, color: '#4a4a3a' };
      return d;
    }),
    { t: 'dummy', x: 1418, y: GROUND, broken: true },
    { t: 'rubble', x: 700, y: GROUND, w: 90 },
    { t: 'rubble', x: 1180, y: GROUND, w: 70 },
    { t: 'rubble', x: 3150, y: GROUND, w: 110 },
    { t: 'fallenDoor', x: 330, y: GROUND },
  ],
  spawn: { x: 3560, y: GROUND - 60 },
};

const ROOM = {
  ...BEDROOM,
  coins: false,
  deco: [
    { t: 'wall', x: 0, y: 0, w: 960, h: GROUND, color: '#cdbba6', broken: true },
    { t: 'window', x: 560, y: 130, w: 120, h: 100, broken: true, night: true },
    { t: 'photo', x: 330, y: 170, dark: true },
    { t: 'rug', x: 360, y: GROUND, w: 200, color: '#8a6a5a' },
    { t: 'lamp', x: 720, y: GROUND, off: true },
    { t: 'table', x: 760, y: GROUND, soup: true },
    { t: 'bed', x: 110, y: GROUND },
    { t: 'rubble', x: 600, y: GROUND, w: 80 },
  ],
  spawn: { x: 880, y: GROUND - 60 },
};

export default async function play(g, p) {
  const f = g.flags;
  f.slam = false;
  g.fx.fade = 1;
  g.load(RUINED, p);
  g.music(null);
  p.mood = 'worried';
  p.facing = -1;
  p.walkSpeed = 120;
  g.lock();
  await g.card('Episode 8', 'The Day Everything Died', 3.4);
  await g.fade(0, 2.5);
  await g.wait(1.5);
  await g.say('bobby', 'No…', { style: 'whisper' });
  g.lock(false);
  g.objective('Go home.');
  await g.wait(2);
  g.objective('');

  // the walk home, backwards
  const stops = [
    [3330, async () => {
      p.facing = -1;
      await g.wait(1.2);
      bark(g, p, 'Tabby’s house.', 2.4);
      await g.wait(2.6);
      bark(g, p, '…It’s empty. Of course it’s empty.', 2.8);
      await g.wait(2.8);
    }],
    [2560, async () => {
      bark(g, p, 'Her flowers.', 2.6);
      await g.wait(3);
    }],
    [1460, async () => {
      bark(g, p, '…Gerald.', 2.2);
      await g.wait(2.6);
    }],
    [880, async () => {
      bark(g, p, 'Mrs. Enter? Anyone?', 2.4);
      await g.wait(3);
      bark(g, p, 'Anyone?', 1.8);
      await g.wait(2.2);
    }],
  ];
  for (const [x, scene] of stops) {
    await g.reach(-Infinity, x);
    g.lock();
    p.vx = 0;
    await scene();
    g.lock(false);
  }
  // the door in the garden
  let inside = false;
  g.add(new Thing({ x: 160, y: GROUND - 90, w: 60, h: 90, actLabel: 'Go inside', act() {
    inside = true;
  } }));
  await g.reach(-Infinity, 420);
  g.lock();
  await g.say('bobby', 'The door’s in the garden.', { style: 'whisper' });
  await g.say('bobby', 'Bella? BELLA?', {});
  g.lock(false);
  g.objective('Go inside.');
  await g.until(() => inside);
  g.objective('');
  g.lock();
  await g.fade(1, 0.6);

  /* ---------- inside ---------- */
  g.load(ROOM, p);
  p.facing = -1;
  const shelf = g.add(new Thing({ x: 400, y: GROUND - 30, w: 140, h: 30, z: 6, look(c) {
    c.save();
    c.translate(this.x + 70, this.y + 18);
    c.rotate(-0.12);
    c.fillStyle = '#9b6a42';
    c.fillRect(-70, -6, 140, 12);
    c.restore();
  } }));
  const bella = g.add(new Npc({ kind: 'bella', x: 455, y: GROUND - 40, sit: true, mood: 'closed', facing: 1, h: 32, fixed: true }));
  bella.y = GROUND - 32;
  const scarf = g.add(new Thing({ x: 680, y: GROUND - 8, w: 40, h: 8, look(c) {
    c.fillStyle = '#ff8fb1';
    rr(c, this.x, this.y, this.w, this.h, 4);
    c.fill();
  } }));
  await g.fade(0, 1.4);
  await g.wait(1);
  await g.walk(p, 740, 80);
  await g.wait(0.8);
  await g.say('note', 'Bella’s scarf is on the floor.');
  scarf.dead = true;
  await g.wait(0.8);
  await g.walk(p, 600, 100);
  await g.wait(0.6);
  p.mood = 'shout';
  await g.say('bobby', 'BELLA!');
  await g.walk(p, 520, 260);
  shelf.dead = true;
  sfx.hit();
  g.burst(470, GROUND - 10, '#9b6a42', 10, 160, 4);
  await g.wait(1);
  bella.mood = 'sad';
  await g.wait(1.4);
  await g.say('bella', '…You’re late.', { style: 'whisper' });
  p.mood = 'sad';
  await g.talk([
    ['bobby', 'No. No, no, no.'],
    ['bella', 'I made soup.'],
    ['bobby', 'Don’t talk. I’m getting help.'],
    ['bella', 'Bobby…'],
    ['bobby', 'I’M GOING TO FIX THIS.'],
    ['bella', 'You always say that.'],
    ['bobby', 'Because I always do.'],
    ['bella', 'Then sit with me for a minute.'],
  ]);
  p.facing = -1;
  p.sit = true;
  p.y = GROUND - p.h;
  await g.wait(2);
  await g.talk([
    ['bella', 'Did you save the world?'],
    ['bobby', 'I don’t know.'],
    ['bella', 'That’s okay.'],
    ['bobby', 'Nothing about this is okay.'],
    2,
    ['bella', 'You’re home.'],
    ['bobby', 'Yeah.'],
    ['bella', 'That’s enough for me.'],
    2,
  ]);
  p.pendantGlow = true;
  await g.talk([
    ['bella', 'You kept it.'],
    ['bobby', 'Of course I did.'],
    ['bella', 'Good.'],
  ]);
  p.pendantGlow = false;
  await g.wait(1.5);

  // her light goes out
  bella.mood = 'closed';
  for (let i = 0; i <= 40; i++) {
    const k = i / 40;
    bella.color = mix('#f39ac0', '#8a8288', k);
    bella.dark = mix('#cc6f97', '#5e585c', k);
    bella.bow = k < 0.8;
    await g.wait(0.08);
  }
  f.pendantCracked = true;
  sfx.crack();
  g.burst(cx(p), p.y + 28, '#dfe6ee', 6, 60, 2);
  await g.wait(5);
  sfx.error();
  await g.say('sys', 'BELLA.BUTTON IS NO LONGER RESPONDING', { noSkip: true, auto: 2.5 });

  // retry
  g.ui.button = { label: '↻ Retry' };
  g.dirty = true;
  const tries = ['Please.', 'Just this once.', 'Work.'];
  for (const line of tries) {
    await g.wait(1.6);
    sfx.select();
    g.fx.flash = 0.15;
    await g.wait(0.3);
    sfx.error();
    await g.say('bobby', line, { style: 'whisper' });
  }
  await g.wait(1.2);
  g.ui.button = null;
  g.dirty = true;
  await g.wait(2.5);

  // you
  p.sit = false;
  p.y = GROUND - p.h;
  p.facing = 1;
  p.mood = 'angry';
  g.cam.fixed = { x: cx(p), y: p.y + 10 };
  for (let i = 0; i <= 60; i++) {
    g.cam.zoom = 1 + (i / 60) * 1.6;
    await g.wait(1 / 30);
  }
  await g.say('bobby', 'You.');
  await g.say('bobby', 'I trusted you.');
  await g.say('bobby', 'Tabby trusted you.');
  p.mood = 'shout';
  g.cam.zoom = 2.9;
  g.shake(6);
  await g.say('bobby', 'SHE TRUSTED YOU.');
  p.red = true;
  sfx.glitch();
  g.fx.glitch = 0.6;
  g.cam.zoom = 3.3;
  await g.say('bobby', 'AND YOU PRESSED IT.');
  g.music(null);
  p.mood = 'angry';
  await g.wait(1);
  // the sword, pointed at you
  const blade = g.add(new Thing({ x: cx(p), y: p.y, w: 0, h: 0, z: 20, s: 0.6, alwaysUpdate: true,
    tick(g, dt) {
      this.s = Math.min(3.2, this.s + dt * 1.2);
    },
    look(c) {
      c.save();
      c.translate(cx(p) + 14, p.y + 26);
      c.scale(this.s, this.s);
      c.rotate(-0.15);
      sword(c, 'tabby', 0, 0, 1);
      c.restore();
    },
  }));
  g.fx.glitchHold = true;
  sfx.glitch();
  g.shake(10);
  await g.card('I HATE YOU.', '', 2.8, 'big');
  g.fx.glitchHold = false;
  g.fx.fade = 1;
  g.fx.fadeTo = 1;
  blade.dead = true;
  sfx.boom();
  await g.wait(2);
  g.fx.noHud = true;
  await g.card('WHY BUTTON HATES YOU', 'THE FINAL EPISODE', 4, 'ending');
  await g.wait(0.6);
  await g.card('Player control disconnected.', '', 3, 'error');
  g.lock(false);
}

function mix(a, b, k) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
}
