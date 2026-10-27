import { GROUND, ground, plat, block, edges } from '@/reason/build';
import { Npc, Thing, Shot, makeTabby, bark, movingPlatform, vanishingPlatform } from '@/reason/actors';
import { sfx } from '@/reason/audio';
import { cx, rand } from '@/reason/engine';
import { rr, text } from '@/reason/draw';
import { CapsBat, AutoSlime, LagSpider, SpamBee, Lord404 } from '../foes';
import { clickSwitch } from '../companion';
import { begin, bellaAt, hearts, petals } from '../common';
import { checkpointPost, heartAt, coins } from '@/reason/episodes/common';

// Chapter 4 — The Great Love Rescue. A flower that never dies, a forest that
// glitches, and a villain whose girlfriend left him for better Wi-Fi.

const W = 4600;
const ARENA = [3600, 4560];
export const LEVEL = {
  w: W,
  theme: 'forest',
  solids: [
    ground(0, 1100),
    ground(1500, 700),
    ground(2560, 1040),
    ground(ARENA[0], W - ARENA[0]),
    // the arena's platforms (Lord 404 blinks between them)
    plat(ARENA[0] + 80, 330, 150, 'glitch'),
    plat(ARENA[0] + 400, 260, 160, 'glitch'),
    plat(ARENA[0] + 730, 330, 150, 'glitch'),
    block(2900, 380, 80, 80, 'stone'),
    ...edges(W),
  ],
  deco: [
    { t: 'tree', x: 150, y: GROUND, s: 1.2 },
    { t: 'bush', x: 420, y: GROUND },
    { t: 'tree', x: 900, y: GROUND, s: 1, color: '#5a9e6a' },
    { t: 'sign', x: 1560, y: GROUND, text: 'GLITCHY ↯' },
    { t: 'tree', x: 1900, y: GROUND, s: 1.3, color: '#6a5ab8' },
    { t: 'bush', x: 2700, y: GROUND, color: '#7a5ac4' },
    { t: 'tree', x: 3200, y: GROUND, s: 1.2, color: '#6a5ab8' },
    { t: 'bush', x: 4300, y: GROUND, color: '#5aa652' },
  ],
  spawn: { x: 80, y: GROUND - 60 },
};

export default async function play(g, p) {
  const f = g.flags;
  f.sword = true;
  f.slam = true;
  f.doubleJump = true;
  // a little montage first
  g.fx.fade = 1;
  g.fx.noHud = true;
  g.music('love');
  await g.card('', 'Date #2: a sunset. Bobby falls asleep halfway through. Bella draws a moustache on him.', 3.4, 'soft');
  await g.card('', 'Date #5: Bella teaches Bobby her family soup recipe. It is… a soup. He eats every drop.', 3.4, 'soft');
  await g.card('', 'Date #9: Tabby shows up uninvited. Again. He brings snacks, so it’s fine.', 3.4, 'soft');
  g.fx.noHud = false;

  const cur = await begin(g, p, LEVEL, 4, 'The Great Love Rescue', 'adventure');
  const tabby = makeTabby(g, p, 40, GROUND - 40);
  await g.talk([
    ['bobby', 'I want to give Bella something special. Something that never disappears.'],
    ['tabby', 'Like a tattoo?'],
    ['bobby', 'Like the Forever Bloom. It grows in the Glitchy Forest. It never wilts.'],
    ['cursor', 'Glitchy Forest. Great. Love that for us.'],
    ['tabby', 'I’ve been training too. Press Q and I’ll stun anything near you. TAB SLAM.'],
  ]);
  g.lock(false);
  g.objective('Find the Forever Bloom. Q: Tabby’s stun · R or click: Cursor presses things.');

  // first stretch: bats that scream in uppercase, slimes that autocorrect
  [500, 800].forEach((x) => g.add(new CapsBat({ x, y: 250 })));
  g.add(new AutoSlime({ x: 700, y: GROUND - 24 }));
  coins(g, 300, GROUND - 40, 5);

  // a gap: Cursor switches on the moving platform
  let bridgeOn = false;
  const mover = movingPlatform(1110, 400, 100, 280, 1.2, { kind: 'glitch' });
  mover.off = true;
  g.addSolid(mover);
  clickSwitch(g, 1040, 320, () => {
    bridgeOn = true;
    mover.off = false;
    bark(g, cur, 'Platform: online. You’re welcome.', 2);
  }, { label: 'power' });
  await g.reach(980);
  if (!bridgeOn) bark(g, cur, 'There’s a switch up there. Click it, or press R.', 2.6);
  await g.reach(1520);
  checkpointPost(g, 1540);

  // lag spiders and a swarm
  [1700, 2000].forEach((x) => g.add(new LagSpider({ x, y: GROUND - 18 })));
  await g.reach(1800);
  bark(g, p, 'Bees? Why are there bees?', 1.8);
  for (let i = 0; i < 6; i++) g.add(new SpamBee({ x: 2100 + rand(-60, 60), y: 200 + rand(-40, 40) }));
  setTimeout(() => bark(g, tabby, 'SPAM BEES. Slam them, bro! Q!', 2), 1800);
  heartAt(g, 2150, GROUND - 60);

  // the vanishing bridge, which Cursor has to keep steady
  [2240, 2350, 2460].forEach((x, i) => g.addSolid(vanishingPlatform(x, 410 - i * 20, 90, 2.6, i * 0.25)));
  await g.reach(2580);
  checkpointPost(g, 2600);

  // a gate with two locks
  let locks = 0;
  const gate = g.addSolid({ x: 3100, y: 160, w: 30, h: 300, kind: 'glitch' });
  clickSwitch(g, 2940, 340, () => locks++, { label: 'lock 1' });
  clickSwitch(g, 3260, 250, () => locks++, { label: 'lock 2' });
  g.add(new AutoSlime({ x: 2800, y: GROUND - 24 }));
  g.add(new CapsBat({ x: 3000, y: 220 }));
  await g.reach(2860);
  g.objective('A glitched gate. Have Cursor click both locks.');
  await g.until(() => locks >= 2);
  gate.off = true;
  sfx.door();
  g.objective('');
  await g.reach(3350);

  // the Forever Bloom, and someone who followed them
  const bloom = g.add(new Thing({ x: 3470, y: GROUND - 40, w: 24, h: 40, z: 3, look(c, g) {
    c.strokeStyle = '#4c8a3e';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(this.x + 12, this.y + 40);
    c.lineTo(this.x + 12, this.y + 12);
    c.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + g.time;
      c.fillStyle = `hsl(${(g.time * 60 + i * 50) % 360}, 90%, 70%)`;
      c.beginPath();
      c.arc(this.x + 12 + Math.cos(a) * 7, this.y + 10 + Math.sin(a) * 7, 5, 0, Math.PI * 2);
      c.fill();
    }
  } }));
  g.lock();
  g.music('love');
  await g.walk(p, 3420, 140);
  p.facing = 1;
  await g.say('bobby', 'There it is. The Forever Bloom.');
  const bella = bellaAt(g, 3300, { facing: 1 });
  await g.say('bella', 'Bobby?');
  p.facing = -1;
  await g.talk([
    ['bobby', 'BELLA? What are you doing here?'],
    ['bella', 'You three were acting SO weird. I followed you.'],
    ['tabby', 'Told you she’d notice the fake moustache.'],
  ]);
  // Lord 404
  g.music(null, 0.2);
  sfx.glitch();
  g.fx.glitch = 1;
  g.shake(10);
  await g.wait(0.6);
  bloom.dead = true;
  bella.dead = true;
  sfx.boom();
  await g.card('', 'Something purple grabs the Bloom. And Bella.', 2.2, 'soft');
  g.cam.fixed = { x: (ARENA[0] + ARENA[1]) / 2, y: 270 };
  await g.walk(p, ARENA[0] + 120, 260);
  p.facing = 1;
  g.addSolid({ x: ARENA[0] - 20, y: -400, w: 20, h: 900, kind: 'none' });
  g.checkpoint(ARENA[0] + 60, GROUND - 60);
  const caged = g.add(new Npc({ kind: 'bella', x: ARENA[1] - 90, y: 120, fixed: true, mood: 'angry', facing: -1 }));
  const cage = g.add(new Thing({ x: caged.x - 12, y: caged.y - 14, w: 54, h: 60, z: 6, look(c) {
    c.strokeStyle = '#b57cff';
    c.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      c.beginPath();
      c.moveTo(this.x + i * 13.5, this.y);
      c.lineTo(this.x + i * 13.5, this.y + this.h);
      c.stroke();
    }
    c.strokeRect(this.x, this.y, this.w, this.h);
  } }));
  const spots = [
    { x: ARENA[0] + 155, y: 330 },
    { x: ARENA[0] + 480, y: 260 },
    { x: ARENA[0] + 805, y: 330 },
    { x: ARENA[0] + 300, y: GROUND },
    { x: ARENA[0] + 650, y: GROUND },
  ];
  const lord = g.add(new Lord404({ spots }));
  lord.held = true;
  g.boss = lord;
  await g.talk([
    ['lord404', 'LOVE DOES NOT EXIST.'],
    ['bobby', 'BRO, WHO HURT YOU?'],
    ['lord404', 'MY GIRLFRIEND LEFT ME.'],
    ['tabby', 'For who?'],
    ['lord404', 'A BETTER INTERNET CONNECTION.'],
    ['cursor', 'Honestly, fair.'],
    ['cursor', 'Three of him. Only one is real. Click one and I’ll scan them, then hit the real one.'],
  ]);
  g.music('danger');
  lord.held = false;
  g.lock(false);
  g.objective('Click a Lord 404 (or R) to reveal the real one, then hit him!');
  g.onRespawn = () => {
    for (const e of g.ents) if (e instanceof Shot) e.dead = true;
  };
  await g.until(() => lord.hp <= 3);
  lord.held = true;
  lord.sob = true;
  lord.reveal = 99;
  for (const e of g.ents) if (e instanceof Shot) e.dead = true;
  g.lock();
  g.music(null, 0.4);
  await g.talk([
    ['lord404', '*sob* SHE SAID I WASN’T AVAILABLE.'],
    ['bobby', 'YOU’RE LITERALLY ERROR 404.'],
    ['lord404', 'THAT’S WHAT SHE SAID.'],
  ]);
  // Bella gets out by herself
  cage.dead = true;
  caged.fixed = false;
  sfx.crash();
  await g.say('bella', 'Okay. I’m done being rescued.');
  const real = lord.bodies[lord.real];
  await g.walk(caged, cx(real) + 30, 320);
  sfx.hit();
  g.shake(10);
  lord.kill();
  g.burst(cx(real), real.y + 30, '#b57cff', 20, 260, 5);
  g.deco = [...g.deco, { t: 'bush', x: ARENA[1] - 120, y: GROUND, color: '#5aa652' }];
  await g.say('bella', '*throws him into a bush*');
  await g.say('lord404', '(from the bush) …this is the second worst day of my life.');
  g.boss = null;
  g.onRespawn = null;
  g.objective('');
  await g.wait(1);

  // a quieter moment
  g.music('love');
  caged.faceTo = p;
  await g.walk(p, cx(caged) - 50, 120);
  p.facing = 1;
  petals(g, 8);
  await g.talk([
    ['bobby', 'I wanted to get you something that would never disappear.'],
    ['bella', 'Bobby, flowers disappear eventually.'],
    ['bobby', 'Not this one.'],
    ['bella', 'Why?'],
    ['bobby', 'Because Cursor spent three hours fixing its code.'],
    ['cursor', 'You’re welcome.'],
  ]);
  caged.mood = 'happy';
  await g.say('bella', '*laughs* I love it.');
  await g.wait(1.4);
  await g.say('bella', 'And I love you.');
  p.mood = 'closed';
  await g.wait(2);
  p.mood = 'shout';
  await g.talk([
    ['bobby', '…REALLY?'],
    ['bella', 'Really.'],
    ['bobby', 'CURSOR. TABBY.'],
    ['bobby', 'SHE SAID THE THING.'],
    ['tabby', 'WE HEARD.'],
    ['bobby', 'SHE SAID THE THINGGGG!'],
  ]);
  hearts(g, p, 10);
  f.bloom = true;
  sfx.item();
  await g.card('The Forever Bloom', 'It lives in a vase in Bobby’s house now. It never wilts.', 3, 'item');
  await g.fade(1, 1.4);
  g.cam.fixed = null;
  g.lock(false);
}
