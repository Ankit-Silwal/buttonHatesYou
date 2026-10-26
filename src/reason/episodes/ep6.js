import { GROUND, ground, plat, block, edges } from '../build';
import { Npc, Drone, Slime, Crab, Thing, Pickup, makeTabby, bark, fallingPlatform } from '../actors';
import { GarbageCollector } from '../bosses';
import { sfx } from '../audio';
import { cx, rand } from '../engine';
import { rr, text, sword } from '../draw';
import { adminMonitor, checkpointPost, coins, heartAt } from './common';

// Episode 6 — The Last Laugh. The tower turns on them, a garbage truck
// with opinions, and a gate that only holds from the inside.

const W = 5400;
const ARENA = [1640, 2440];
const GC = [2560, 3480];
const BRIDGE = [3520, 4740];
const GATE = 4740;

const LEVEL = {
  w: W,
  theme: 'tower',
  solids: [
    ground(0, 420, 'metal'),
    ground(1500, 2020, 'metal'),
    ground(4780, 620, 'metal'),
    ...edges(W),
  ],
  deco: [
    { t: 'pipe', x: 200, y: 0, h: 380, color: '#3a2244' },
    { t: 'rack', x: 1560, y: GROUND, h: 190 },
    { t: 'rack', x: 2460, y: GROUND, h: 210 },
    { t: 'pipe', x: 3000, y: 0, h: 200, color: '#3a2244' },
    { t: 'rack', x: 5100, y: GROUND, h: 200 },
  ],
  spawn: { x: 120, y: GROUND - 60 },
};

export default async function play(g, p) {
  const f = g.flags;
  f.slam = true;
  f.doubleJump = true;
  f.dash = true;
  g.fx.fade = 1;
  g.load(LEVEL, p);
  g.music(null);
  const tabby = makeTabby(g, p, 60, GROUND - 40);
  g.lock();
  await g.card('Episode 6', 'The Last Laugh', 3);
  await g.fade(0, 1);

  // he knew
  const mon = adminMonitor(g, 260, 150, 160, 100, { stand: false });
  sfx.glitch();
  mon.on = true;
  await g.talk([
    ['admin', 'Player. Bobby. Did you really think I couldn’t hear you down there?'],
    ['admin', 'You were going to keep my fragments from me.'],
    ['admin', 'How disappointing. Security: retrieve them.'],
  ]);
  mon.on = false;
  sfx.error();
  await g.talk([
    ['bobby', 'Run.'],
    ['tabby', 'RUNNING.'],
  ]);
  g.music('danger');
  const alarm = g.add(new Thing({ w: 0, h: 0, hidden: true, alwaysUpdate: true, tick(g) {
    g.fx.tint = '#ff1a2a';
    g.fx.tintA = 0.08 + 0.08 * Math.sin(g.time * 6);
  } }));
  g.lock(false);
  g.objective('Escape the tower! The bridges won’t hold for long.');

  // collapsing bridges
  for (let i = 0; i < 10; i++) g.addSolid(fallingPlatform(440 + i * 106, 430 - (i % 3) * 30, 92, { kind: 'metal', delay: 0.35 }));
  [700, 1100].forEach((x) => g.add(new Drone({ x, y: 200 })));
  coins(g, 600, 370, 3);
  coins(g, 980, 340, 3);
  await g.reach(1520);
  checkpointPost(g, 1540);

  // the security wave
  await g.reach(ARENA[0] + 80);
  g.objective('Locked in! Survive the security wave. Q for Tabby’s stun, K to dash.');
  const walls = [
    g.addSolid({ x: ARENA[0] - 20, y: -400, w: 20, h: 860, kind: 'metal' }),
    g.addSolid({ x: ARENA[1], y: -400, w: 20, h: 860, kind: 'metal' }),
  ];
  sfx.door();
  // respawn inside the locked arena, never behind its doors
  g.checkpoint(ARENA[0] + 80, GROUND - 60);
  g.cam.fixed = { x: (ARENA[0] + ARENA[1]) / 2, y: 270 };
  // arena drones stay between the walls and low enough to hit with a double jump
  const guard = (x, y) => g.add(new Drone({ x, y, x0: ARENA[0] + 10, x1: ARENA[1] - 10, minY: 215 }));
  const remaining = (list) => {
    const n = list.filter((e) => !e.dead).length;
    g.objective(`Security wave: ${n} left. Double jump to reach the drones, or Q for Tabby’s stun.`);
    return n === 0;
  };
  const wave1 = [guard(1800, 215), guard(2250, 225), g.add(new Slime({ x: 2100, y: GROUND - 24 }))];
  await g.until(() => remaining(wave1));
  bark(g, tabby, 'More coming!', 1.6);
  heartAt(g, 2040, 380);
  const wave2 = [guard(1750, 215), guard(2050, 220), guard(2320, 215), g.add(new Crab({ x: 1900, y: 300 })), g.add(new Crab({ x: 2200, y: 300 }))];
  await g.until(() => remaining(wave2));
  sfx.door();
  walls.forEach((w) => (w.off = true));
  g.cam.fixed = null;
  g.objective('');
  checkpointPost(g, ARENA[1] + 40);

  // THE GARBAGE COLLECTOR
  await g.reach(GC[0] + 120);
  g.lock();
  g.checkpoint(GC[0] + 60, GROUND - 60);
  const gwalls = [
    g.addSolid({ x: GC[0] - 20, y: -400, w: 20, h: 860, kind: 'metal' }),
    g.addSolid({ x: GC[1], y: -400, w: 20, h: 860, kind: 'metal' }),
  ];
  g.cam.fixed = { x: (GC[0] + GC[1]) / 2, y: 270 };
  const gc = g.add(new GarbageCollector({ x: GC[1] - 200, x0: GC[0], x1: GC[1] }));
  g.boss = gc;
  sfx.crash();
  g.shake(12);
  await g.talk([
    ['sys', 'GARBAGE COLLECTOR ONLINE. LOCATING: UNREFERENCED OBJECTS.'],
    ['tabby', 'Is it calling us garbage?'],
    ['bobby', 'It’s calling us UNREFERENCED. That’s worse.'],
    ['tabby', 'It’s armoured. Make it ram the wall, or let me slam it. Then hit it while it’s dizzy!'],
  ]);
  g.lock(false);
  g.objective('Make it crash into a wall (or Q to stun it), then attack.');
  g.onRespawn = () => {
    gc.state = 'idle';
    gc.timer = 1.5;
    gc.x = GC[1] - 200;
    for (const e of g.ents) if (e.constructor.name === 'Shot') e.dead = true;
  };
  await g.until(() => gc.dead);
  g.boss = null;
  g.objective('');
  await g.wait(0.8);
  bark(g, tabby, 'TAKE OUT THE TRASH, BABY!', 2);
  gwalls.forEach((w) => (w.off = true));
  g.cam.fixed = null;
  g.onRespawn = null;

  // the purge
  await g.reach(GC[1] - 40);
  g.checkpoint(GC[1] - 60, GROUND - 60);
  const segs = [];
  for (let x = BRIDGE[0]; x < BRIDGE[1]; x += 100) segs.push(g.addSolid({ x, y: GROUND, w: 100, h: 18, kind: 'metal', home: GROUND, vy: 0, fall: true }));
  [3900, 4300].forEach((x) => g.add(new Drone({ x, y: 230, rate: 2.6 })));
  coins(g, 3700, GROUND - 40, 4);
  await g.reach(BRIDGE[0] + 20);
  g.lock();
  g.music(null, 0.2);
  sfx.error();
  g.fx.glitch = 0.8;
  await g.say('admin', 'Enough. Initiating full system purge.');
  g.music('danger');
  g.lock(false);
  g.objective('RUN.');
  let edge = BRIDGE[0] - 140;
  const resetBridge = () => {
    edge = BRIDGE[0] - 140;
    segs.forEach((s) => {
      s.y = s.home;
      s.vy = 0;
      s.off = false;
      s.update = null;
    });
  };
  g.onRespawn = resetBridge;
  const chase = g.add(new Thing({ w: 0, h: 0, hidden: true, tick(g, dt) {
    edge += 165 * dt;
    g.shake(2);
    for (const s of segs) {
      if (!s.update && s.x + s.w < edge) {
        s.update = (g, dt) => {
          s.vy += 1500 * dt;
          s.y += s.vy * dt;
          if (s.y > g.level.h + 100) s.off = true;
        };
        sfx.crack();
      }
    }
  } }));
  await g.reach(BRIDGE[1] - 200);
  chase.dead = true;
  g.onRespawn = null;
  g.objective('');

  // the gate
  g.lock();
  g.fx.letterbox = 1;
  alarm.dead = true;
  g.fx.tintA = 0;
  const gate = g.add(new Thing({ x: GATE, y: 200, w: 30, h: GROUND - 200, z: 7, open: 1,
    look(c) {
      c.fillStyle = '#2a1d33';
      c.fillRect(this.x - 10, this.y - 30, this.w + 20, 30);
      const h = (this.h) * (1 - this.open);
      c.fillStyle = '#4a3355';
      c.fillRect(this.x, this.y, this.w, h);
      c.fillStyle = '#ff5a5a';
      for (let y = this.y + 10; y < this.y + h; y += 30) c.fillRect(this.x + 4, y, this.w - 8, 4);
    },
  }));
  const lever = g.add(new Thing({ x: GATE - 60, y: GROUND - 50, w: 20, h: 50, z: 1, down: true,
    look(c) {
      c.fillStyle = '#555';
      c.fillRect(this.x, this.y + 30, 20, 20);
      c.strokeStyle = '#999';
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(this.x + 10, this.y + 34);
      c.lineTo(this.x + (this.down ? 26 : -6), this.y + 4);
      c.stroke();
    },
  }));
  p.vx = 0;
  tabby.follow = null;
  await g.walk(p, GATE - 140, 160);
  p.facing = 1;
  sfx.rumble();
  g.shake(8);
  segs.forEach((s) => {
    if (s.x < GATE - 260) s.warn = true;
  });
  await g.say('sys', 'GATE LOCK FAILING. MANUAL HOLD REQUIRED (INSIDE).');
  await g.walk(tabby, GATE - 50, 220);
  tabby.facing = -1;
  await g.say('bobby', 'Tabby, what are you doing?');
  await g.say('tabby', 'Someone’s gotta hold the gate.');
  await g.say('bobby', 'Then hurry up!');
  await g.wait(1);
  tabby.mood = 'sad';
  await g.say('tabby', 'Bobby…');
  p.mood = 'worried';
  await g.say('bobby', 'Don’t.');
  if (f.marshmallow === 'tabby') await g.say('tabby', 'Thanks for the marshmallow, by the way. Best one of my life.');
  else await g.talk([['tabby', 'You still owe me a marshmallow, by the way.'], ['bobby', 'I’ll buy you a hundred. Just MOVE.']]);
  // he pushes Bobby through, and something small goes with him
  await g.walk(tabby, cx(p) - 30, 260);
  tabby.facing = 1;
  sfx.hit();
  p.vx = 0;
  p.goal = null;
  for (let i = 0; i < 24; i++) {
    p.x += 9;
    p.y = Math.min(p.y, GROUND - p.h);
    await g.wait(1 / 60);
  }
  f.chip = true;
  sfx.blip(2);
  g.burst(cx(p), p.y + 26, '#7dffe0', 3, 40, 2);
  await g.walk(p, GATE + 120, 220);
  p.facing = -1;
  await g.walk(tabby, GATE - 46, 200);
  tabby.facing = 1;
  await g.say('tabby', 'Take care of Bella.');
  p.mood = 'shout';
  await g.say('bobby', 'I SAID DON’T.');
  tabby.mood = 'happy';
  await g.say('tabby', 'And tell her I was the cooler one.');
  p.mood = 'sad';
  await g.say('bobby', 'You weren’t.');
  await g.say('tabby', 'Liar.');
  await g.wait(0.8);
  // he lets go
  lever.down = false;
  sfx.door();
  for (let i = 0; i < 20; i++) {
    gate.open = Math.max(0, 1 - i / 14);
    await g.wait(1 / 30);
  }
  g.addSolid({ x: GATE, y: 0, w: 30, h: GROUND, kind: 'none' });
  sfx.boom();
  g.shake(20);
  g.fx.flash = 0.6;
  sfx.crash();
  segs.forEach((s) => {
    s.update = (g, dt) => {
      s.vy = (s.vy ?? 0) + 1200 * dt;
      s.y += s.vy * dt;
    };
  });
  tabby.dead = true;
  lever.dead = true;
  p.tabby = null;
  await g.wait(1.6);
  sfx.rumble();
  g.shake(14);
  await g.wait(1.6);

  // silence
  g.music(null, 0.05);
  const dust = g.add(new Thing({ w: 0, h: 0, hidden: true, alwaysUpdate: true, tick(g) {
    if (Math.random() < 0.3) g.parts.push({ x: g.cam.x + rand(-480, 480), y: g.cam.y - 280, vx: rand(-10, 10), vy: rand(20, 60), grav: 20, life: 6, max: 6, color: 'rgba(160,150,170,0.7)', size: rand(2, 5) });
  } }));
  g.cam.target = p;
  p.mood = 'sad';
  await g.wait(4);
  await g.say('bobby', '…Tabby?', { style: 'whisper' });
  await g.wait(2);
  await g.say('bobby', 'Come on, man.', { style: 'whisper' });
  await g.wait(1.5);
  await g.say('bobby', 'This isn’t funny.', { style: 'whisper' });
  await g.wait(3.5);
  await g.card('', 'No response.', 2.5, 'soft');
  await g.wait(1);
  await g.fade(1, 2.5);
  dust.dead = true;
  g.fx.letterbox = 0;

  /* ---------- the quiet forest ---------- */
  await walkAlone(g, p);
  g.lock(false);
}

const QUIET = {
  w: 2600,
  theme: 'night',
  coins: false,
  solids: [ground(0, 2600), ...edges(2600)],
  deco: [
    { t: 'tree', x: 200, y: GROUND, s: 1.2, color: '#2c4a3a' },
    { t: 'tree', x: 520, y: GROUND, s: 1, color: '#2c4a3a' },
    { t: 'bush', x: 760, y: GROUND, color: '#2f4f3e' },
    { t: 'tree', x: 1000, y: GROUND, s: 1.3, color: '#2c4a3a' },
    { t: 'log', x: 1300, y: GROUND, w: 80 },
    { t: 'tree', x: 1600, y: GROUND, s: 1.1, color: '#2c4a3a' },
    { t: 'bush', x: 1900, y: GROUND, color: '#2f4f3e' },
    { t: 'tree', x: 2400, y: GROUND, s: 1.2, color: '#2c4a3a' },
  ],
  spawn: { x: 80, y: GROUND - 60 },
};

async function walkAlone(g, p) {
  const f = g.flags;
  g.load(QUIET, p);
  p.mood = 'sad';
  p.walkSpeed = 140;
  await g.fade(0, 2.5);
  g.lock(false);
  g.objective('');
  await g.wait(3);
  g.music('quiet', 3);
  // the habit of turning to say something
  await g.reach(900);
  g.lock();
  p.facing = -1;
  await g.wait(0.6);
  bark(g, p, 'Tabby, look at th—', 1.6);
  await g.wait(2.2);
  p.facing = 1;
  g.lock(false);
  await g.reach(2050);
  g.lock();
  const s = g.add(new Thing({ x: 2240, y: GROUND - 40, w: 20, h: 40, look(c) {
    c.save();
    c.translate(this.x + 10, this.y + 40);
    c.rotate(0.15);
    sword(c, 'tabby', 0, 0, 1.1);
    c.restore();
  } }));
  await g.walk(p, 2190, 100);
  p.facing = 1;
  await g.wait(1.5);
  await g.say('bobby', 'I used to hate how much he talked.', { style: 'whisper' });
  await g.wait(1.5);
  await g.say('bobby', 'It’s too quiet now.', { style: 'whisper' });
  await g.wait(1.2);
  s.dead = true;
  f.tabbySword = true;
  f.swordKind = 'tabby';
  sfx.item();
  await g.card('Tabby’s Wooden Sword', 'Chipped, and too light. It’s yours now.', 3.4, 'item');
  await g.wait(1);
  await g.fade(1, 2.5);
}
