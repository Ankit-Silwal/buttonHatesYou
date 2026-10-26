import { ground, plat, block, edges } from '../build';
import { Drone, Thing, bark, vanishingPlatform, movingPlatform } from '../actors';
import { sfx } from '../audio';
import { cx, rand } from '../engine';
import { rr, text, adminFace } from '../draw';
import { checkpointPost, heartAt } from './common';

// Episode 7 — The False Choice. Up the Admin's tower alone, and the
// decision that was never really a decision.

const CLIMB_H = 1900;
const FLOOR = CLIMB_H - 60;
const CLIMB = {
  w: 960,
  h: CLIMB_H,
  theme: 'tower',
  coins: false,
  solids: [
    ground(0, 960, 'metal', FLOOR),
    plat(560, FLOOR - 100, 160, 'metal'),
    plat(760, FLOOR - 200, 140, 'metal'),
    plat(480, FLOOR - 290, 150, 'metal'),
    plat(220, FLOOR - 380, 150, 'metal'),
    plat(40, FLOOR - 480, 140, 'metal'),
    plat(260, FLOOR - 580, 120, 'metal'),
    plat(620, FLOOR - 760, 120, 'metal'),
    plat(820, FLOOR - 860, 120, 'metal'),
    plat(560, FLOOR - 1040, 130, 'metal'),
    plat(80, FLOOR - 1230, 130, 'metal'),
    plat(360, FLOOR - 1420, 240, 'metal'),
    plat(700, FLOOR - 1520, 260, 'metal'),
    ...edges(960),
  ],
  deco: [],
  spawn: { x: 100, y: FLOOR - 60 },
};

const CHAMBER = {
  w: 960,
  theme: 'chamber',
  coins: false,
  solids: [ground(0, 960, 'red'), ...edges(960)],
  deco: [],
  spawn: { x: 80, y: 400 },
};

export default async function play(g, p) {
  const f = g.flags;
  f.slam = false;
  g.fx.fade = 1;
  g.load(CLIMB, p);
  g.music('quiet');
  p.mood = 'sad';
  g.lock();
  await g.card('Episode 7', 'The False Choice', 3);
  await g.fade(0, 1.2);
  await g.say('bobby', 'He’s at the top. He wants the fragments.', { style: 'whisper' });
  await g.say('bobby', 'Fine. Let’s go and tell him no.', { style: 'whisper' });
  p.mood = 'angry';
  g.lock(false);
  g.objective('Climb the Admin’s tower.');

  // the climb
  g.addSolid(vanishingPlatform(440, FLOOR - 670, 110, 3, 0));
  g.addSolid(vanishingPlatform(300, FLOOR - 1140, 110, 3, 0.4));
  g.addSolid(movingPlatform(120, FLOOR - 950, 110, 300, 0.9));
  g.addSolid(movingPlatform(200, FLOOR - 1330, 100, 160, 1.2, { axis: 'x', phase: 1 }));
  g.add(new Drone({ x: 700, y: FLOOR - 420, range: 160, rate: 2.4 }));
  g.add(new Drone({ x: 300, y: FLOOR - 900, range: 160, rate: 2.4 }));
  g.add(new Drone({ x: 600, y: FLOOR - 1300, range: 200, rate: 2.2 }));
  heartAt(g, 290, FLOOR - 620);
  heartAt(g, 860, FLOOR - 900);
  const lines = [
    [FLOOR - 400, 'Tabby would have made a joke about stairs by now.'],
    [FLOOR - 800, 'He said he was saving them. He said "everyone you see."'],
    [FLOOR - 1200, 'Nearly there. Bella, I’m nearly there.'],
  ];
  for (const [y, line] of lines) {
    await g.until(() => p.y < y && p.ground);
    bark(g, p, line, 3.2);
    g.checkpoint(p.x, p.y - 4);
  }
  await g.until(() => p.y < FLOOR - 1500 && p.ground);
  g.objective('');
  g.lock();
  await g.fade(1, 1);

  /* ---------- the control chamber ---------- */
  g.load(CHAMBER, p);
  g.music(null);
  p.mood = 'angry';
  const screen = g.add(bigScreen());
  g.cam.fixed = { x: 480, y: 270 };
  await g.fade(0, 1.2);
  await g.walk(p, 300, 110);
  p.facing = 1;
  await g.wait(0.6);
  screen.face = true;
  sfx.beat();
  await g.talk([
    ['admin', 'Bobby. You came all this way. Alone, I see.'],
    ['bobby', 'You don’t get to talk about him.'],
    ['admin', 'I don’t need to. Let’s talk about the fragments.'],
    ['bobby', 'You’re not getting them.'],
    ['admin', 'I already have them.'],
  ]);
  // the fragments are pulled out of him
  for (let i = 0; i < 3; i++) {
    const shard = g.add(new Thing({ x: cx(p) - 8, y: p.y + 10, w: 16, h: 20, z: 9, t: 0,
      tick(g, dt) {
        this.t += dt;
        this.x += (465 + (i - 1) * 30 - this.x) * dt * 2;
        this.y += (150 - this.y) * dt * 2;
        if (this.t > 1.8) this.dead = true;
      },
      look(c) {
        c.fillStyle = '#7dffe0';
        c.beginPath();
        c.moveTo(this.x + 8, this.y);
        c.lineTo(this.x + 16, this.y + 10);
        c.lineTo(this.x + 8, this.y + 20);
        c.lineTo(this.x, this.y + 10);
        c.fill();
      },
    }));
    sfx.glitch();
    await g.wait(0.35);
  }
  await g.wait(1.6);
  sfx.boom();
  g.shake(10);
  g.fx.flash = 0.5;
  screen.face = false;
  screen.lines = ['FIREWALL KEY: ASSEMBLED', 'STATUS: LOCKED', 'REQUIRES OUTSIDE AUTHORIZATION'];
  await g.wait(1.5);
  await g.talk([
    ['bobby', '"Locked." Ha. You can’t use them. You need someone else to—'],
    ['bobby', '…to press the button.'],
  ]);
  screen.lines = [];
  screen.face = true;
  g.music('danger');
  g.fx.redSky = 0.25;
  await g.talk([
    ['admin', 'Player. Listen to me carefully. The kingdom’s firewall is failing.'],
    ['admin', 'You saw the red sky. You felt the ground shake. It’s happening everywhere, and it’s happening now.'],
    ['admin', 'Only one emergency command can stop it.'],
  ]);
  screen.face = false;
  screen.integrity = 31;
  screen.lines = ['EMERGENCY SYSTEM DECISION', '', 'Kingdom integrity: CRITICAL', 'Select one stabilization protocol.'];
  sfx.error();
  await g.wait(1);
  p.facing = 1;
  p.mood = 'worried';
  await g.say('bobby', 'Player… I don’t trust him.');
  if (f.trust === 'trust') await g.say('bobby', 'You told me to trust you. So I’m trusting you. Not him. YOU.');
  else if (f.trust === 'unsure') await g.say('bobby', 'You said you didn’t know if we were doing the right thing. Neither do I. So think.');
  await g.say('admin', 'Every second you hesitate, more inhabitants are at risk.');
  await g.say('bobby', 'I already lost Tabby.');
  await g.say('bobby', 'Please. Don’t make me lose anyone else.');
  const choice = await g.choose('EMERGENCY SYSTEM DECISION · Kingdom integrity: critical', [
    'A — Activate Emergency Override (Admin: “protects the kingdom immediately”)',
    'B — Attempt Manual Restoration (Admin: “slower, and it may fail”)',
  ]);
  f.choice7 = choice === 0 ? 'override' : 'manual';
  screen.integrity = null;
  g.music(null, 0.1);

  if (choice === 0) {
    screen.lines = ['EMERGENCY OVERRIDE', 'AUTHORIZED BY: PLAYER', '…', 'override → purge.exe'];
    sfx.confirm();
    await g.wait(2.4);
  } else {
    for (const pct of [12, 31, 47, 63]) {
      screen.lines = ['MANUAL RESTORATION', `${pct}%`, '', ''];
      sfx.blip(0.8);
      await g.wait(0.7);
    }
    screen.lines = ['MANUAL RESTORATION', '63%', 'REROUTING AUTHORIZATION…', 'restore → purge.exe'];
    sfx.glitch();
    g.fx.glitch = 0.8;
    await g.wait(2);
  }
  screen.lines = ['PLAYER COMMAND ACCEPTED', '', 'PURGE INITIATED', ''];
  screen.red = true;
  sfx.error();
  sfx.boom();
  g.shake(18);
  for (let i = 0; i <= 20; i++) {
    g.fx.redSky = 0.25 + (i / 20) * 0.75;
    g.fx.tint = '#ff0018';
    g.fx.tintA = (i / 20) * 0.28;
    await g.wait(0.05);
  }
  await g.wait(1);
  p.mood = 'shout';
  p.faceLock = 0;
  await g.say('bobby', 'What… did you just do?');
  screen.lines = [];
  screen.red = false;
  screen.face = true;
  await g.wait(0.6);
  laugh();
  await g.say('admin', 'Thank you, Player.');
  await g.say('admin', 'You have been most useful.');
  laugh();
  await g.wait(1.4);
  g.fx.fade = 1;
  g.fx.fadeTo = 1;
  g.fx.tintA = 0;
  sfx.boom();
  await g.wait(2.5);
  g.lock(false);
}

function laugh() {
  [0, 0.22, 0.44, 0.66, 0.88].forEach((d, i) => setTimeout(() => sfx.blip(0.5 - i * 0.05), d * 1000));
}

// The giant screen in the control chamber.
function bigScreen() {
  return new Thing({ x: 230, y: 50, w: 500, h: 260, z: 0, face: false, lines: [], integrity: null, red: false,
    tick(g, dt) {
      if (this.integrity != null) {
        this.tickT = (this.tickT ?? 0) + dt;
        if (this.tickT > 0.9 && this.integrity > 3) {
          this.tickT = 0;
          this.integrity--;
          sfx.blip(0.4);
        }
      }
    },
    look(c, g) {
      const { x, y, w, h } = this;
      c.fillStyle = '#16141c';
      rr(c, x - 14, y - 14, w + 28, h + 28, 12);
      c.fill();
      c.fillStyle = this.red ? '#2a0306' : '#050b08';
      c.fillRect(x, y, w, h);
      // cables
      c.strokeStyle = '#1d1a24';
      c.lineWidth = 8;
      for (const cx0 of [x + 60, x + w - 60]) {
        c.beginPath();
        c.moveTo(cx0, y + h + 14);
        c.quadraticCurveTo(cx0 + 20, y + h + 90, cx0 - 30, 460);
        c.stroke();
      }
      if (this.face) adminFace(c, x + w / 2, y + h / 2 + 10, 100, g);
      this.lines.forEach((l, i) =>
        text(c, l, x + w / 2, y + 60 + i * 44, { size: i === 0 ? 26 : 22, color: this.red ? '#ff4a4a' : i === 0 ? '#ffcf3d' : '#8dffc8' })
      );
      if (this.integrity != null) text(c, `Kingdom integrity: ${this.integrity}%`, x + w / 2, y + h - 26, { size: 18, color: Math.sin(g.time * 8) > 0 ? '#ff4a4a' : '#ffcf3d' });
      c.fillStyle = 'rgba(255,255,255,0.04)';
      for (let yy = y + ((g.time * 30) % 4); yy < y + h; yy += 4) c.fillRect(x, yy, w, 1);
    },
  });
}
