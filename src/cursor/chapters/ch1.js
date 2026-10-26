import { GROUND, ground, plat, block, edges } from '@/reason/build';
import { Npc, Crab, Thing, Pickup, makeTabby, bark } from '@/reason/actors';
import { sfx } from '@/reason/audio';
import { cx } from '@/reason/engine';
import { rr, text } from '@/reason/draw';
import { clickSwitch } from '../companion';
import { begin, petals, trashCan, bellaAt, floatingText, hearts } from '../common';

// Chapter 1 — A Button, A Cursor, and Zero Brain Cells.

const W = 3600;
const WALL_X = 1180;
const LEVEL = {
  w: W,
  theme: 'village',
  solids: [
    ground(0, W),
    block(560, GROUND - 10, 10, 10, 'stone'), // obstacle 1: a pebble
    block(760, GROUND - 46, 30, 46, 'wood'), // obstacle 2: a sign that says OBSTACLE
    block(960, GROUND - 96, 40, 96, 'stone'), // obstacle 3: a very tall pebble
    block(WALL_X, GROUND - 200, 60, 200, 'stone'), // the wall Cursor helps with
    plat(2140, 300, 140, 'wood'), // where Tabby drops from
    ...edges(W),
  ],
  deco: [
    { t: 'tree', x: 130, y: GROUND, s: 1.1 },
    { t: 'bush', x: 300, y: GROUND },
    { t: 'textD', x: 775, y: GROUND - 60, text: 'OBSTACLE', size: 11, color: '#5a3a24' },
    { t: 'tree', x: 1500, y: GROUND, s: 1 },
    { t: 'flower', x: 1700, y: GROUND, c: '#ff8fb1' },
    { t: 'flower', x: 1730, y: GROUND, c: '#f2c14e' },
    { t: 'fence', x: 1900, y: GROUND, w: 120 },
    { t: 'tree', x: 2500, y: GROUND, s: 1.2 },
    { t: 'stall', x: 2780, y: GROUND, color: '#e2674f', sign: 'TOMATOES' },
    { t: 'stall', x: 3080, y: GROUND, color: '#ff8fb1', sign: 'FLOWERS ✿' },
    { t: 'flower', x: 3100, y: GROUND - 44, c: '#ff4f7b' },
    { t: 'flower', x: 3130, y: GROUND - 44, c: '#ffd0e0' },
    { t: 'flower', x: 3160, y: GROUND - 44, c: '#ff8fb1' },
    { t: 'lamppost', x: 3400, y: GROUND },
  ],
  spawn: { x: 260, y: GROUND - 40 },
};

export default async function play(g, p) {
  const f = g.flags;
  f.sword = true;
  f.swordKind = 'wood';
  f.slam = false;
  const cur = await begin(g, p, LEVEL, 1, 'A Button, A Cursor, and Zero Brain Cells', null);

  // PRESS TO START
  p.sit = true;
  p.mood = 'closed';
  p.y = GROUND - p.h;
  cur.home = { x: 620, y: 120 };
  cur.x = 640;
  cur.y = 80;
  const start = floatingText(g, cx(p), p.y - 60, 'PRESS TO START', { size: 24 });
  g.music('music_box');
  await g.wait(1.6);
  cur.home = { x: cx(p) + 40, y: p.y - 20 };
  await g.wait(1.6);
  await g.say('cursor', 'Hello?');
  await g.say('bobby', '…');
  // the poke
  cur.home = { x: cx(p) - 6, y: p.y + 4 };
  await g.wait(0.5);
  sfx.select();
  start.dead = true;
  p.sit = false;
  p.mood = 'shout';
  p.vy = -560;
  g.shake(6);
  await g.wait(0.4);
  cur.home = { x: cx(p) + 70, y: p.y - 30 };
  await g.talk([
    ['bobby', 'AAAAAAAAAH!'],
    ['cursor', 'BRO WHAT?'],
    ['bobby', 'YOU JUST PRESSED MY FACE.'],
    ['cursor', 'You’re literally a button.'],
    ['bobby', 'THAT DOESN’T MEAN YOU CAN TOUCH ME WITHOUT ASKING.'],
  ]);
  cur.home = { x: cx(p) + 120, y: p.y - 30 };
  p.mood = 'worried';
  p.facing = 1;
  await g.talk([
    ['bobby', 'What even are you?'],
    ['cursor', 'I’m a cursor.'],
    ['bobby', 'So… you point at things?'],
    ['cursor', 'Yes.'],
    ['bobby', 'That’s your entire personality?'],
    ['cursor', 'Pretty much.'],
    2,
    ['bobby', 'We’re going to be friends.'],
  ]);
  p.mood = 'happy';
  cur.home = null;
  g.music('village');
  g.lock(false);

  // three increasingly stupid obstacles
  g.objective('Move with ← →. Jump with Space. Three obstacles. They get dumber.');
  await g.reach(500);
  bark(g, cur, 'Obstacle one: a pebble. Be brave.', 2.4);
  await g.reach(700);
  bark(g, p, 'It literally says OBSTACLE on it.', 2.4);
  await g.reach(900);
  bark(g, cur, 'Obstacle three: a taller pebble. Hold jump.', 2.4);
  await g.reach(1060);

  // Cursor grabs a platform
  g.objective('That wall is too tall. Click the glowing plank (or press R) and Cursor will move it.');
  let placed = false;
  const plank = g.add(new Thing({ x: 1060, y: GROUND - 14, w: 100, h: 14, z: 4, clickable: true, label: 'plank',
    onPress(g) {
      if (placed) return;
      placed = true;
      this.clickable = false;
      sfx.confirm();
    },
    tick(g, dt) {
      if (!placed) return;
      this.x += (WALL_X - 110 - this.x) * Math.min(1, dt * 4);
      this.y += (GROUND - 110 - this.y) * Math.min(1, dt * 4);
    },
    look(c, g) {
      c.fillStyle = '#c58d58';
      rr(c, this.x, this.y, this.w, this.h, 3);
      c.fill();
      if (!placed) {
        c.strokeStyle = `rgba(127,220,255,${0.5 + 0.5 * Math.sin(g.time * 6)})`;
        c.lineWidth = 3;
        rr(c, this.x - 3, this.y - 3, this.w + 6, this.h + 6, 5);
        c.stroke();
        text(c, 'click', this.x + 50, this.y - 12, { size: 11, color: '#fff' });
      }
    },
  }));
  await g.until(() => placed);
  await g.wait(0.8);
  g.addSolid({ x: WALL_X - 110, y: GROUND - 110, w: 100, h: 14, kind: 'wood', oneWay: true });
  plank.dead = true;
  bark(g, cur, 'I can move stuff. It’s kind of my thing.', 2.4);
  g.objective('Climb over the wall.');
  await g.reach(WALL_X + 80);

  // two angry checkboxes
  g.objective('Two Angry Checkboxes! J (or X) swings your tiny wooden sword.');
  const boxes = [1520, 1650].map((x) => g.add(new Crab({ x, y: GROUND - 26 })));
  bark(g, p, 'Behold. My legendary sword.', 2.2);
  setTimeout(() => bark(g, cur, 'It’s cracked down the middle.', 2.2), 2400);
  await g.cleared(boxes);
  bark(g, p, 'Legendary. Told you.', 2);

  // the treasure chest needs both of them
  g.objective('A locked chest. Cursor clicks the lock, Bobby opens it (E).');
  let unlocked = false;
  let opened = false;
  const chest = g.add(new Thing({ x: 1900, y: GROUND - 34, w: 48, h: 34, actLabel: 'Open', z: 2,
    act(g) {
      if (!unlocked) return bark(g, p, 'Locked. Cursor? Little help?', 2);
      opened = true;
      this.actOff = true;
    },
    look(c) {
      c.fillStyle = opened ? '#6b4528' : '#b07a3a';
      rr(c, this.x, this.y + 8, 48, 26, 4);
      c.fill();
      c.fillStyle = '#8a5a2a';
      rr(c, this.x, this.y + (opened ? -6 : 0), 48, 12, 4);
      c.fill();
    },
  }));
  clickSwitch(g, 1924, GROUND - 60, () => {
    unlocked = true;
    bark(g, cur, '*click*', 1.2);
  }, { label: 'lock' });
  await g.until(() => opened);
  g.objective('');
  sfx.win();
  g.add(new Pickup({ kind: 'coin', x: 1916, y: GROUND - 70, pop: true }));
  g.lock();
  await g.wait(0.8);
  await g.talk([
    ['bobby', 'WE RISKED OUR LIVES FOR ONE COIN?'],
    ['cursor', 'It’s still a coin.'],
    ['bobby', 'I’M BUYING A HOUSE.'],
  ]);
  g.lock(false);

  // Tabby drops in
  await g.reach(2060);
  g.lock();
  const tab = g.add(new Npc({ kind: 'tabby', x: 2190, y: 220, weapon: 'tabby', facing: -1 }));
  await g.wait(0.3);
  tab.x = 2150;
  tab.y = 230;
  tab.vy = 300;
  await g.until(() => tab.ground);
  sfx.land();
  g.shake(4);
  tab.faceTo = p;
  p.facing = 1;
  await g.talk([
    ['tabby', 'BOBBY! WHO’S THE TRIANGLE?'],
    ['bobby', 'My new friend.'],
    ['tabby', 'What’s his name?'],
    ['bobby', 'Cursor.'],
    ['tabby', 'That’s a terrible name.'],
    ['cursor', 'Your name is Tab.'],
    2,
    ['tabby', '…'],
    ['tabby', 'Welcome to the gang.'],
  ]);
  tab.dead = true;
  makeTabby(g, p, tab.x, tab.y);
  g.lock(false);
  g.objective('Walk through the market.');

  // the first sight of Bella
  const bella = bellaAt(g, 3110, { facing: -1 });
  const bin = trashCan(g, 2960);
  await g.reach(2650);
  g.lock();
  g.objective('');
  g.music('love');
  p.tabby.follow = null;
  cur.home = { x: 2600, y: GROUND - 120 };
  g.cam.target = bella;
  petals(g, 9);
  p.facing = 1;
  await g.wait(1.6);
  g.cam.target = null;
  p.mood = 'happy';
  hearts(g, p);
  await g.talk([
    ['bobby', 'Who’s that?'],
    ['tabby', 'Bella. She sells flowers.'],
    ['bobby', 'I think I’m in love.'],
    ['cursor', 'You haven’t spoken to her.'],
    ['bobby', 'I HAVE EYES.'],
  ]);
  // the walk, the pixel, the bin
  await g.walk(p, 2930, 120);
  g.music(null, 0.1);
  sfx.select();
  g.floatText(2944, GROUND - 6, '·', '#000', 16);
  p.vx = 260;
  p.vy = -420;
  await g.wait(0.35);
  p.hidden = true;
  bin.wob = 0.8;
  sfx.crash();
  g.shake(8);
  await g.wait(1);
  bella.faceTo = bin;
  await g.say('bella', 'Are you okay?');
  bin.wob = 0.4;
  await g.say('bobby', 'YES. I LIVE HERE.');
  await g.wait(0.6);
  bella.mood = 'happy';
  await g.say('bella', '…Okay! Nice bin.');
  bella.faceTo = null;
  bella.facing = 1;
  await g.wait(0.8);
  p.hidden = false;
  p.x = 2900;
  p.y = GROUND - p.h;
  p.mood = 'sad';
  g.music('village');
  await g.talk([
    ['tabby', 'Smooth.'],
    ['bobby', 'I want to go back in the bin.'],
    ['cursor', 'Hey. We’ll help you talk to her.'],
    ['tabby', 'Yeah. We’ll make you so smooth you’ll slide right out of that bin.'],
    ['bobby', '…You’d do that?'],
    ['cursor', 'Bro, I literally just met you and you screamed at me. Of course I would.'],
  ]);
  p.mood = 'happy';
  await g.card('MAIN QUEST: FIND BOBBY A GIRLFRIEND', 'DIFFICULTY: IMPOSSIBLE', 3.6, 'item');
  await g.fade(1, 1.2);
  g.lock(false);
}
