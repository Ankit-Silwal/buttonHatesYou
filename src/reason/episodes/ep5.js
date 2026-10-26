import { GROUND, ground, plat, block, edges } from '../build';
import { Drone, Slime, Thing, Pickup, Shot, makeTabby, bark } from '../actors';
import { sfx } from '../audio';
import { cx, overlap, rand } from '../engine';
import { rr, text } from '../draw';
import { adminMonitor, checkpointPost, coins, coreFragment, heartAt } from './common';

// Episode 5 — The Truth Beneath the Code. The protectors' lab under the
// Server Tower: the fragments aren't weapons, they're the firewall.

const W = 4500;
const DOOR_X = 1520;
const LEVEL = {
  w: W,
  theme: 'lab',
  coins: true,
  solids: [
    ground(0, 2520, 'metal'),
    ground(2820, 1680, 'metal'),
    plat(1180, 360, 140, 'metal'),
    plat(1340, 290, 100, 'metal'),
    block(0, 0, W, 40, 'dark'),
    plat(2050, 360, 120, 'metal'),
    ...edges(W),
  ],
  deco: [
    { t: 'rack', x: 200, y: GROUND, h: 200 },
    { t: 'rack', x: 290, y: GROUND, h: 160 },
    { t: 'pipe', x: 700, y: 40, h: 300, color: '#2a354d' },
    { t: 'rack', x: 900, y: GROUND, h: 220 },
    { t: 'rack', x: 1700, y: GROUND, h: 200 },
    { t: 'pipe', x: 2400, y: 40, h: 260, color: '#2a354d' },
    { t: 'rack', x: 3100, y: GROUND, h: 210 },
    { t: 'rack', x: 3190, y: GROUND, h: 170 },
    { t: 'pipe', x: 3600, y: 40, h: 320, color: '#2a354d' },
    { t: 'rack', x: 4300, y: GROUND, h: 220 },
  ],
  spawn: { x: 80, y: GROUND - 60 },
};

export default async function play(g, p) {
  const f = g.flags;
  f.slam = true;
  f.doubleJump = true;
  f.dash = false;
  g.fx.fade = 1;
  g.load(LEVEL, p);
  g.music('lab');
  const tabby = makeTabby(g, p, 30, GROUND - 40);
  g.lock();
  await g.card('Episode 5', 'The Truth Beneath the Code', 3);
  await g.fade(0, 1.2);
  await g.talk([
    ['bobby', 'Under the Server Tower. The map says the last fragment is down here.'],
    ['tabby', 'It’s so quiet. Like a library. A library that wants to kill us.'],
  ]);
  g.lock(false);

  // the first recording
  await terminal(g, 480, [
    ['recorder', 'Log 1. This is Ada, of the original Protectors. If this is playing, the lab is still standing. Good.'],
    ['recorder', 'We are building a firewall around Clicktopia. Something that keeps anyone from deleting the people who live here.'],
    ['recorder', 'Anyone. Including us.'],
    ['tabby', 'Protectors? I thought the Admin protected everything.'],
    ['bobby', 'Maybe they worked together.'],
  ]);

  // drones and the locked door
  g.objective('Find a way past the security door.');
  const door = g.addSolid({ x: DOOR_X, y: 40, w: 40, h: GROUND - 40, kind: 'metal' });
  [820, 1100, 1380].forEach((x, i) => g.add(new Drone({ x, y: 230 + (i % 2) * 40, range: 200 })));
  coins(g, 1200, 320, 4);
  heartAt(g, 1370, 250);
  const sw = g.add(new Thing({ x: 1380, y: 220, w: 28, h: 28, team: 'enemy', z: 2, lit: false,
    hurt(g) {
      if (this.lit) return false;
      this.lit = true;
      sfx.confirm();
      return true;
    },
    look(c, g) {
      c.fillStyle = '#1d2433';
      rr(c, this.x - 3, this.y - 3, this.w + 6, this.h + 6, 6);
      c.fill();
      c.fillStyle = this.lit ? '#3df59a' : Math.sin(g.time * 5) > 0 ? '#ffcf3d' : '#8a6d1d';
      rr(c, this.x, this.y, this.w, this.h, 5);
      c.fill();
      text(c, this.lit ? 'OPEN' : 'DOOR', this.x + 14, this.y - 10, { size: 10, color: '#ffcf3d' });
    },
  }));
  await g.until(() => sw.lit);
  sfx.door();
  g.shake(4);
  for (let i = 0; i < 30; i++) {
    door.y -= 14;
    door.h = Math.max(0, door.h - 14);
    await g.wait(1 / 30);
  }
  door.off = true;
  sw.team = null;
  g.objective('');
  checkpointPost(g, DOOR_X + 80);

  // Dash
  [1800, 2000].forEach((x) => g.add(new Drone({ x, y: 240 })));
  g.add(new Slime({ x: 1950, y: GROUND - 24 }));
  const dash = g.add(new Pickup({ kind: 'dash', x: 2280, y: GROUND - 60, w: 28, h: 28,
    look(c, g, x, y) {
      c.fillStyle = '#ffcf3d';
      rr(c, x, y, 28, 28, 6);
      c.fill();
      text(c, '≫', x + 14, y + 14, { size: 18, color: '#3a2a00' });
    },
  }));
  await g.until(() => dash.dead);
  f.dash = true;
  g.lock();
  await g.card('Dash', 'K or Shift · a quick burst you can’t be hit during. Works once in the air, too.', 3, 'item');
  await g.say('tabby', 'A Dash Module! Bobby, you’re like… 30% faster now.');
  await g.say('bobby', 'I’m going to use it to get away from my problems.');
  g.lock(false);
  g.objective('Dash through the laser grid. You can’t be hurt while dashing.');

  // the laser grid
  const laser = laserGrid(g, 2420);
  await g.reach(2460);
  g.objective('Jump, double jump, then dash across the gap.');
  await g.reach(2840);
  laser.dead = true;
  g.objective('');
  checkpointPost(g, 2960);

  // the truth
  await terminal(g, 3080, [
    ['recorder', 'Log 7. We split the firewall into three pieces. We called them Core Fragments, and we hid them across the kingdom.'],
    ['recorder', 'Apart, they protect. Together, in the tower, they become a key.'],
    ['recorder', 'Whoever brings that key to the tower can switch every protection off. All at once.'],
    ['recorder', 'If the Admin ever asks someone to bring him the fragments—'],
  ], true);
  g.lock();
  tabby.follow = null;
  tabby.faceTo = p;
  await g.talk([
    ['tabby', 'Bobby. We need to stop.'],
    ['bobby', 'What?'],
    ['tabby', 'We’re not collecting a weapon.'],
    ['tabby', 'We’re handing him the keys to the entire kingdom.'],
  ]);
  const mon = adminMonitor(g, 3200, 220, 130, 90);
  sfx.glitch();
  g.fx.glitch = 0.6;
  mon.on = true;
  g.music(null, 0.2);
  await g.talk([
    ['admin', 'Careful, Player. Corrupted recordings are designed to mislead you.'],
    ['bobby', 'That’s convenient.'],
    ['admin', 'The final fragment is waiting. Retrieve it.'],
  ]);
  mon.on = false;
  await g.wait(0.6);
  mon.dead = true;
  await g.talk([
    ['tabby', 'I don’t trust him.'],
    ['bobby', 'Neither do I.'],
  ]);
  g.music('lab');
  tabby.faceTo = null;
  tabby.follow = p;
  g.lock(false);

  // the facility shakes
  g.objective('Reach the fragment chamber.');
  const quake = g.add(new Thing({ w: 0, h: 0, hidden: true, t: 0, tick(g, dt) {
    this.t -= dt;
    if (this.t > 0) return;
    this.t = rand(0.5, 1.1);
    g.shake(3);
    const x = cx(g.player) + rand(-200, 300);
    warnDrop(g, x);
  } }));
  [3500, 3750].forEach((x) => g.add(new Drone({ x, y: 220 })));
  g.add(new Slime({ x: 3650, y: GROUND - 24 }));
  coins(g, 3400, GROUND - 40, 5);
  await g.reach(3900);
  quake.dead = true;
  checkpointPost(g, 3920);

  // he won't take it
  const frag = coreFragment(g, 4250, GROUND - 70, 3);
  frag.locked = true;
  g.objective('Collect the final Core Fragment.');
  const refuse = [
    [['bobby', 'No.']],
    [['bobby', 'I SAID no. Those are my legs. I get a vote.']],
    [
      ['bobby', 'Player, stop. Please. If we take it to him, we’re the ones turning off the kingdom.'],
      ['tabby', 'Bobby… what if we take it, but we don’t give it to him?'],
      ['tabby', 'If we leave it here, he’ll just send somebody else. Somebody who listens to him.'],
      ['bobby', '…Fine. We carry it. But nobody hands that guy anything until we know what he really is.'],
      ['tabby', 'Deal.'],
    ],
  ];
  for (const lines of refuse) {
    await g.until(() => cx(p) > 4170);
    g.lock();
    p.mood = 'angry';
    p.faceLock = 1;
    await g.walk(p, 4060, 200);
    p.faceLock = 0;
    p.facing = 1;
    await g.talk(lines);
    p.mood = 'calm';
    g.lock(false);
  }
  frag.locked = false;
  g.objective('Take the fragment. Carefully.');
  await frag.done;
  g.objective('');
  g.lock();
  sfx.item();
  await g.card('Core Fragment 3 of 3', 'Bobby carries it. He doesn’t like how light it is.', 2.6, 'item');

  // Bella calls
  g.music('music_box');
  sfx.ring();
  await g.wait(0.6);
  sfx.ring();
  await g.say('tabby', 'Your pendant is… ringing?');
  p.pendantGlow = true;
  await g.talk([
    ['bella', 'Hey, idiot. I made your favorite soup.'],
    ['bobby', 'It’s not my favorite.'],
    ['bella', 'You eat it every day.'],
    ['bobby', 'Because you’re my favorite.'],
    ['bella', 'That was disgustingly sweet.'],
    ['bobby', 'Don’t tell Tabby.'],
    ['tabby', 'I’m standing RIGHT here.'],
    ['bella', 'The sky looks strange over here. Red, a little. Probably nothing.'],
    ['bella', 'I’ll wait up for you.'],
    ['bobby', 'I’ll be home soon.'],
  ]);
  p.pendantGlow = false;
  await g.wait(1.2);
  await g.fade(1, 1.6);
  g.lock(false);
}

// A protector's terminal. Plays its lines when used.
async function terminal(g, x, lines, cut = false) {
  let used = false;
  const t = g.add(new Thing({ x, y: GROUND - 70, w: 54, h: 70, actLabel: 'Play recording',
    look(c, g) {
      c.fillStyle = '#2a3346';
      rr(c, this.x, this.y + 20, this.w, this.h - 20, 6);
      c.fill();
      c.fillStyle = '#0b1a12';
      rr(c, this.x + 4, this.y, this.w - 8, 34, 4);
      c.fill();
      text(c, used ? '■' : '▶', this.x + this.w / 2, this.y + 17, { size: 14, color: Math.sin(g.time * 4) > 0 || used ? '#3df59a' : '#1f6a3b' });
    },
    act() {
      used = true;
      this.actOff = true;
    },
  }));
  g.objective('A recording terminal. (E)');
  await g.until(() => used);
  g.objective('');
  g.lock();
  if (g.player.tabby) g.player.tabby.follow = null;
  for (const [who, text] of lines) await g.say(who, text);
  if (cut) {
    sfx.glitch();
    g.fx.glitch = 0.5;
    await g.card('', '[RECORDING DELETED]', 1.6, 'error');
  }
  if (g.player.tabby) g.player.tabby.follow = g.player;
  g.lock(false);
  return t;
}

// Red bars you can only get through while dashing.
function laserGrid(g, x) {
  return g.add(new Thing({ x, y: 40, w: 24, h: GROUND - 40, z: 6,
    tick(g) {
      const p = g.player;
      if (p && overlap(p, this) && p.dashT <= 0) {
        if (p.hurt(g, 1, -1)) {
          p.x = this.x - p.w - 30;
          p.vx = -200;
        } else if (p.iframes > 0 && !g.locked) {
          p.x = this.x - p.w - 2;
          p.vx = Math.min(p.vx, 0);
        }
      }
    },
    look(c, g) {
      for (let i = 0; i < 4; i++) {
        c.fillStyle = `rgba(255, 40, 60, ${0.5 + 0.4 * Math.sin(g.time * 20 + i)})`;
        c.fillRect(this.x + i * 7, this.y, 3, this.h);
      }
      c.fillStyle = 'rgba(255,40,60,0.12)';
      c.fillRect(this.x - 10, this.y, this.w + 20, this.h);
    },
  }));
}

// Ceiling debris, with a shadow on the floor first.
function warnDrop(g, x) {
  const mark = g.add(new Thing({ x: x - 16, y: GROUND - 4, w: 32, h: 4, z: 0, life: 0.7,
    tick(g, dt) {
      this.life -= dt;
      if (this.life <= 0) {
        this.dead = true;
        g.add(new Shot({ x: x - 12, y: 40, w: 24, h: 24, vx: 0, vy: 200, grav: 1400, color: '#6c7fa3', cuttable: false, life: 2 }));
      }
    },
    look(c) {
      c.fillStyle = 'rgba(0,0,0,0.4)';
      c.beginPath();
      c.ellipse(this.x + 16, this.y + 2, 18 * (1.4 - this.life), 4, 0, 0, Math.PI * 2);
      c.fill();
    },
  }));
  return mark;
}
