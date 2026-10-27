import { GROUND, ground, plat, block, edges } from '../build';
import { Npc, Crab, Bat, Slime, makeTabby, bark } from '../actors';
import { sfx } from '../audio';
import { cx } from '../engine';
import { adminMonitor, checkpointPost, coins, heartAt } from './common';

// Episode 2 — The First Click. The Player connects, Bobby notices someone
// else is moving his legs, and THE ADMIN makes first contact.

const W = 4300;
export const LEVEL = {
  w: W,
  theme: 'forest',
  solids: [
    ground(0, 1350),
    ground(1450, 220),
    ground(1780, 160),
    ground(2060, 520),
    ground(2700, 1600),
    plat(1360, 400, 80),
    plat(1680, 380, 90),
    plat(1950, 360, 100),
    plat(2590, 390, 100),
    plat(800, 370, 120),
    plat(980, 300, 120),
    block(2250, 400, 60, 60, 'stone'),
    block(3050, 380, 90, 80, 'stone'),
    plat(3180, 330, 120),
    ...edges(W),
  ],
  deco: [
    { t: 'sign', x: 120, y: GROUND, text: '← Clicktopia' },
    { t: 'bush', x: 330, y: GROUND },
    { t: 'bush', x: 520, y: GROUND, color: '#5aa652' },
    { t: 'tree', x: 700, y: GROUND, s: 1.2 },
    { t: 'tree', x: 1200, y: GROUND, s: 0.9 },
    { t: 'rock', x: 1520, y: GROUND },
    { t: 'tree', x: 2140, y: GROUND, s: 1.1 },
    { t: 'bush', x: 2420, y: GROUND },
    { t: 'tree', x: 2850, y: GROUND, s: 1.3, color: '#4f9e58' },
    { t: 'rock', x: 3300, y: GROUND, r: 30 },
    { t: 'sign', x: 3560, y: GROUND, text: 'TOWER →' },
    { t: 'tree', x: 4100, y: GROUND, s: 1.2 },
  ],
  spawn: { x: 220, y: GROUND - 60 },
};

export default async function play(g, p) {
  const f = g.flags;
  g.fx.fade = 1;
  g.load(LEVEL, p);
  g.music('adventure');
  const tabby = g.add(new Npc({ kind: 'tabby', x: 280, y: GROUND - 40, weapon: 'tabby', facing: -1 }));
  g.lock();
  await g.card('Episode 2', 'The First Click', 3);
  await g.fade(0, 1);

  // the Player connects
  g.music(null, 0.4);
  sfx.glitch();
  g.fx.glitch = 0.5;
  await g.wait(0.6);
  await g.say('unknown', 'A new Player has connected.', { style: 'whisper' });
  p.faceLock = 0;
  p.facing = 1;
  tabby.faceTo = p;
  await g.talk([
    ['bobby', 'A what?'],
    ['tabby', 'A Player! Legend says they can control the world with a single click.'],
    ['bobby', 'That sounds incredibly unsafe.'],
    ['bobby', 'Okay. Nope. I’m going home. Home is left.'],
  ]);
  g.music('adventure');
  await g.walk(p, cx(p) - 60, 90);
  p.facing = -1;
  g.lock(false);
  g.objective('Move right. (Bobby would like it noted that he wanted to go left.)');

  // someone else is moving his legs
  await g.until(() => p.vx > 60);
  g.lock();
  p.vx = 0;
  await g.talk([
    ['bobby', 'HEY! THOSE ARE MY LEGS!'],
    ['tabby', 'He’s helping us, idiot!'],
    ['bobby', 'Who is "he"? Where is he? Why is he in my LEGS?'],
  ]);
  g.lock(false);
  g.objective('Jump (Space). Bobby has opinions about that too.');
  await g.until(() => p.vy < -100);
  await g.until(() => p.ground);
  p.mood = 'shout';
  g.burst(cx(p), p.y + p.h, '#5aa652', 12, 200, 6);
  sfx.land();
  g.lock();
  await g.talk([
    ['bobby', 'HE JUST MADE ME JUMP INTO A BUSH!'],
    ['tabby', 'It was a small bush.'],
    ['bobby', 'I didn’t CONSENT to the bush.'],
    ['bobby', '…Fine. Player. Whoever you are. Be gentle with me. I have a wife.'],
  ]);
  p.mood = 'calm';
  tabby.faceTo = null;
  g.lock(false);
  tabby.dead = true;
  const buddy = makeTabby(g, p, tabby.x, tabby.y);
  g.objective('Follow the road out of Clicktopia. Tabby fights with you now.');

  // checkbox crabs
  coins(g, 600, GROUND - 40, 4);
  coins(g, 820, 340, 4, 28, 10);
  coins(g, 1000, 270, 4, 28, 10);
  const crabs = [900, 1100, 1250].map((x) => g.add(new Crab({ x, y: GROUND - 26 })));
  await g.reach(720);
  await g.talk([
    ['tabby', 'Checkbox Crabs! Since when are THESE out here?'],
    ['bobby', 'Why are they looking at me like I’m a to-do list?'],
    ['tabby', 'They want to check you off. Don’t let them.'],
  ]);
  g.objective('Defeat the Checkbox Crabs. J to attack.');
  await g.cleared(crabs);
  bark(g, p, 'Unchecked. All of them.', 2);
  g.objective('Keep going. Mind the gaps.');
  checkpointPost(g, 1400);

  // popup bats over the gaps
  heartAt(g, 1550, GROUND - 60);
  const bats = [1600, 1880, 2150].map((x, i) => g.add(new Bat({ x, y: 240 + i * 20 })));
  coins(g, 1690, 340, 3);
  coins(g, 1960, 320, 3);
  await g.reach(1480);
  bark(g, buddy, 'Popup Bats! Don’t let them touch you, they’re full of ads!', 3);
  await g.until(() => bats.every((b) => b.dead) || cx(p) > 2400);
  if (g.fx.ads?.length || bats.some((b) => !b.dead)) bark(g, p, 'WHO PUT AN AD IN MY EYES', 2);
  checkpointPost(g, 2450);

  // loading slimes
  const slimes = [2780, 2960, 3320].map((x) => g.add(new Slime({ x, y: GROUND - 24 })));
  g.add(new Crab({ x: 3200, y: 300 }));
  coins(g, 3190, 300, 4);
  await g.reach(2650);
  await g.talk([
    ['bobby', 'That slime is just… sitting there. Spinning.'],
    ['tabby', 'Loading Slime. It thinks for a second and then it COMMITS. Step aside when it stops spinning.'],
  ]);
  g.objective('Get past the Loading Slimes.');
  await g.until(() => slimes.every((s) => s.dead) || cx(p) > 3450);
  g.objective('');
  checkpointPost(g, 3480);

  // the guardian robot
  const guardian = g.add(new Npc({ kind: 'guardian', x: 3700, y: GROUND - 70, broken: true, fixed: true, facing: -1 }));
  await g.reach(3560);
  g.lock();
  buddy.follow = null;
  await g.walk(p, 3640, 140);
  p.facing = 1;
  await g.talk([
    ['guardian', 'ERROR. ERROR. THE ADMIN IS PURGING UNNECESSARY ELEMENTS.'],
    ['bobby', 'What’s an unnecessary element?'],
    ['guardian', 'ALL ELEMENTS.'],
    ['tabby', 'That seems… unnecessary.'],
    ['guardian', 'TRAVELER. THE TOWER. THE TOWER KEEPS THE RECORDS. TAKE THIS.'],
  ]);
  sfx.item();
  await g.card('Map to the Server Tower', 'The guardian’s last useful act.', 2.6, 'item');
  guardian.mood = 'closed';
  await g.talk([
    ['guardian', 'MAP DELIVERED. SHUTTING DOWN. TELL MY WIFE I— I DO NOT HAVE A WIFE. GOODBYE.'],
    ['bobby', '…I’m going to be thinking about that for a while.'],
  ]);
  g.lock(false);
  buddy.follow = p;
  g.objective('Follow the map toward the tower.');

  // the transmission
  const mon = adminMonitor(g, 3980, 280, 160, 110);
  await g.reach(3880);
  g.lock();
  g.music(null, 0.3);
  buddy.follow = null;
  await g.walk(p, 3930, 120);
  p.facing = 1;
  g.fx.letterbox = 1;
  sfx.glitch();
  g.fx.glitch = 0.8;
  await g.wait(0.8);
  mon.on = true;
  sfx.beat();
  await g.wait(1);
  await g.say('admin', 'Player. I have been expecting you.');
  p.mood = 'shout';
  await g.say('bobby', 'YOU KNOW THIS GUY?');
  p.mood = 'worried';
  await g.talk([
    ['admin', 'Only you can save this world. Follow my instructions.'],
    ['bobby', 'I really don’t like his voice.'],
    ['tabby', 'Relax. He’s literally called Admin. He probably knows what he’s doing.'],
    ['admin', 'The kingdom is failing. Three Core Fragments lie scattered across it. Recover them, and bring them to my tower.'],
    ['admin', 'Do this, Player, and everyone you see will be safe.'],
    ['bobby', '"Everyone you see." What about the people we don’t see?'],
    ['admin', 'Transmission ends.'],
  ]);
  mon.on = false;
  sfx.glitch();
  await g.wait(0.6);
  await g.talk([
    ['tabby', 'A QUEST. Bobby. We have a QUEST.'],
    ['bobby', 'We have a stranger in my legs and a voice in a TV.'],
    ['tabby', 'So… a quest.'],
    ['bobby', '…So a quest.'],
  ]);
  g.music('adventure');
  await g.card('New mission', 'Recover the three Core Fragments.', 3, 'item');
  g.fx.letterbox = 0;
  await g.wait(1);
  await g.fade(1, 1);
  g.lock(false);
}
