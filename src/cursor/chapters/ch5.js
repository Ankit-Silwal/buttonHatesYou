import { GROUND, ground, plat, block, edges } from '@/reason/build';
import { Npc, Thing, Shot, makeTabby, bark, movingPlatform } from '@/reason/actors';
import { sfx } from '@/reason/audio';
import { cx, overlap, rand } from '@/reason/engine';
import { rr, text, heart } from '@/reason/draw';
import { GoldCoinCrab, PaperclipWorm, CaptchaGuard, CaptchaGolem } from '../foes';
import { clickSwitch } from '../companion';
import { begin, bellaAt, hearts, petals } from '../common';
import { checkpointPost, heartAt, coins } from '@/reason/episodes/common';

// Chapter 5 — Operation: Marry Bella. A ring in a mine, a golem that wants
// proof you're human, and a proposal that goes wrong in a new way each line.

const W = 4700;
const ARENA = [3700, 4660];
export const MINE = {
  w: W,
  theme: 'mine',
  coins: true,
  solids: [
    ground(0, 1000, 'dirt'),
    ground(1400, 1000, 'dirt'),
    ground(2700, W - 2700, 'dirt'),
    block(0, 0, W, 40, 'dark'),
    plat(500, 340, 120, 'wood'),
    plat(1600, 330, 120, 'wood'),
    plat(2900, 330, 140, 'wood'),
    plat(3250, 330, 140, 'wood'),
    ...edges(W),
  ],
  deco: [
    { t: 'sign', x: 80, y: GROUND, text: 'OLD MINE' },
    { t: 'lamppost', x: 380, y: GROUND },
    { t: 'rock', x: 760, y: GROUND, r: 30, color: '#6e5a4e' },
    { t: 'lamppost', x: 1500, y: GROUND },
    { t: 'rock', x: 2100, y: GROUND, r: 26, color: '#6e5a4e' },
    { t: 'lamppost', x: 2780, y: GROUND },
    { t: 'rock', x: 3500, y: GROUND, r: 34, color: '#6e5a4e' },
  ],
  spawn: { x: 120, y: GROUND - 60 },
};

// The hill at sunset, stepping down toward the river.
const HILL_W = 3000;
const RIVER = 2760;
const steps = [[0, 600, 300], [600, 380, 330], [980, 360, 360], [1340, 380, 390], [1720, 360, 420], [2080, 680, 460]];
export const HILL = {
  w: HILL_W,
  theme: 'sunset',
  coins: false,
  solids: [
    ...steps.map(([x, w, y]) => ({ x, y, w, h: 800, kind: 'grass' })),
    { x: 2860, y: GROUND, w: 140, h: 800, kind: 'grass' },
    block(1150, 300, 50, 60, 'stone'),
    block(1900, 380, 40, 40, 'wood'),
    ...edges(HILL_W),
  ],
  deco: [
    { t: 'tree', x: 120, y: 300, s: 1.2 },
    { t: 'flower', x: 300, y: 300, c: '#ff8fb1' },
    { t: 'flower', x: 330, y: 300, c: '#f2c14e' },
    { t: 'bush', x: 760, y: 330 },
    { t: 'tree', x: 1500, y: 390, s: 0.9 },
    { t: 'fence', x: 2300, y: GROUND, w: 100 },
    { t: 'water', x: 2760, y: GROUND + 12, w: 100 },
    { t: 'sign', x: 2660, y: GROUND, text: 'RIVER ↓' },
  ],
  spawn: { x: 380, y: 240 },
};

export default async function play(g, p) {
  const f = g.flags;
  f.sword = true;
  f.slam = true;
  f.doubleJump = true;
  g.fx.fade = 1;
  g.fx.noHud = true;
  g.music('love');
  await g.card('', 'Several months pass.', 2.6, 'soft');
  await g.card('', 'Bobby and Bella move into a little house. The Forever Bloom gets the best spot by the window.', 3.6, 'soft');
  await g.card('', 'Tabby keeps visiting without knocking.', 2.8, 'soft');
  g.fx.noHud = false;

  const cur = await begin(g, p, MINE, 5, 'Operation: Marry Bella', 'ruins');
  const tabby = makeTabby(g, p, 40, GROUND - 40);
  await g.talk([
    ['bobby', 'I’m going to propose.'],
    ['tabby', 'LET’S GOOO!'],
    ['bobby', 'I NEED A RING.'],
    ['tabby', 'Buy one.'],
    ['bobby', 'WITH WHAT? EMOTIONAL DAMAGE?'],
    ['cursor', 'We could find one.'],
    ['bobby', 'THAT SOUNDS ILLEGAL.'],
    ['tabby', 'Only if someone owns it.'],
    ['jeweler', '(earlier, at the shop) There’s a legend, young button. A silver ring, lost in the old mine. Guarded by something that asks… questions.'],
  ]);
  g.lock(false);

  /* ---------- Room 1: the coin door ---------- */
  g.objective('Room 1: get through the mine door.');
  [600, 820].forEach((x) => g.add(new GoldCoinCrab({ x, y: GROUND - 24 })));
  coins(g, 510, 300, 4);
  const door = g.addSolid({ x: 960, y: 40, w: 40, h: GROUND - 40, kind: 'metal' });
  clickSwitch(g, 560, 290, () => {
    door.off = true;
    sfx.door();
    bark(g, cur, 'Door’s open. I’m basically a key.', 2);
  }, { label: 'door' });
  await g.reach(1000);
  checkpointPost(g, 1010);

  /* ---------- Room 2: the pit ---------- */
  g.objective('Room 2: Cursor can wake the old mine carts. Click the switches.');
  const carts = [movingPlatform(1030, 400, 110, 270, 1, { kind: 'wood' }), movingPlatform(2420, 400, 110, 180, 1.2, { kind: 'wood', phase: 1 })];
  carts.forEach((c) => {
    c.off = true;
    g.addSolid(c);
  });
  clickSwitch(g, 980, 300, () => (carts[0].off = false), { label: 'cart' });
  clickSwitch(g, 2380, 300, () => (carts[1].off = false), { label: 'cart' });
  g.add(new PaperclipWorm({ x: 1800, y: GROUND - 14 }));
  g.add(new CaptchaGuard({ x: 2000, y: 230 }));
  heartAt(g, 1640, 290);
  await g.reach(2760);

  /* ---------- Room 3: the arena ---------- */
  g.objective('Room 3: clear the room.');
  g.checkpoint(2800, GROUND - 60); // inside the room, so a respawn isn't behind its walls
  const walls = [g.addSolid({ x: 2700, y: -400, w: 20, h: 860, kind: 'dirt' }), g.addSolid({ x: 3600, y: -400, w: 20, h: 860, kind: 'dirt' })];
  g.cam.fixed = { x: 3160, y: 270 };
  const wave = [
    g.add(new GoldCoinCrab({ x: 3000, y: GROUND - 24 })),
    g.add(new PaperclipWorm({ x: 3300, y: GROUND - 14 })),
    g.add(new CaptchaGuard({ x: 3150, y: 200 })),
    g.add(new GoldCoinCrab({ x: 3400, y: GROUND - 24 })),
  ];
  await g.cleared(wave);
  walls.forEach((w) => (w.off = true));
  g.cam.fixed = null;
  g.objective('');

  /* ---------- THE CAPTCHA GOLEM ---------- */
  await g.reach(ARENA[0] + 100);
  g.lock();
  g.checkpoint(ARENA[0] + 60, GROUND - 60);
  g.addSolid({ x: ARENA[0] - 20, y: -400, w: 20, h: 900, kind: 'none' });
  g.cam.fixed = { x: (ARENA[0] + ARENA[1]) / 2, y: 270 };
  const golem = g.add(new CaptchaGolem({ x: ARENA[1] - 220, x0: ARENA[0], x1: ARENA[1] }));
  g.boss = golem;
  await g.talk([
    ['golem', 'PROVE YOU ARE NOT A ROBOT.'],
    ['bobby', 'I’M A BUTTON.'],
    ['golem', 'SELECT ALL IMAGES WITH TRAFFIC LIGHTS.'],
    ['bobby', 'WE’RE IN A CAVE.'],
    ['golem', 'WRONG ANSWER.'],
    ['cursor', 'When it shows the squares, click the starred ones. All of them. Then it glitches and you whack it.'],
  ]);
  g.music('danger');
  g.lock(false);
  g.objective('When the grid appears, select every ★ square (click, R, or slash them). Then hit the golem!');
  g.onRespawn = () => {
    for (const e of g.ents) if (e instanceof Shot) e.dead = true;
  };
  await g.until(() => golem.dead);
  g.boss = null;
  g.onRespawn = null;
  g.objective('');
  g.lock();
  g.music(null, 0.5);
  await g.wait(1);
  sfx.item();
  f.ring = true;
  await g.card('The Silver Ring', 'Plain, a little scratched, and perfect.', 3, 'item');
  await g.talk([
    ['tabby', 'Now you just have to ask her.'],
    ['bobby', '…'],
    ['bobby', 'What if she says no.'],
    ['cursor', 'Then we’ll be right behind the tree, and we’ll get you ice cream.'],
    ['tabby', 'And if she says yes, we’ll ALSO get ice cream.'],
    ['bobby', 'You guys are the best.'],
  ]);
  await g.fade(1, 1.2);
  g.cam.fixed = null;

  /* ---------- the proposal ---------- */
  g.load(HILL, p);
  g.add(cur);
  cur.home = { x: 140, y: 230 };
  const t2 = g.add(new Npc({ kind: 'tabby', x: 80, y: 260, facing: 1 }));
  g.deco = [...g.deco, { t: 'tree', x: 130, y: 300, s: 1.3, front: true }];
  p.x = 420;
  p.y = 260;
  p.facing = 1;
  const bella = g.add(new Npc({ kind: 'bella', x: 470, y: 260, facing: -1 }));
  g.music('love');
  await g.fade(0, 1.6);
  await g.say('note', 'Sunset, on the hill above Clicktopia.');
  await g.talk([
    ['bobby', 'Bella, there’s something I want to ask.'],
    ['bella', 'Okay.'],
    ['bobby', 'We’ve been together for a while.'],
    ['bella', 'Yes.'],
    ['bobby', 'And I know I’m not the smartest button.'],
    ['bella', 'Definitely not.'],
    ['bobby', 'Or the strongest.'],
    ['bella', 'Nope.'],
    ['bobby', 'Or the richest.'],
    ['bella', 'Very much not.'],
    ['bobby', 'CAN YOU LET ME FINISH?'],
  ]);
  bella.mood = 'happy';
  await g.say('bella', '*laughs*');
  p.sit = true;
  await g.card('', 'Bobby gets down on one knee. He opens the ring box.', 2.4, 'soft');
  await g.wait(0.6);
  await g.card('', 'It’s empty.', 1.8, 'soft');
  await g.talk([
    ['bobby', '…'],
    ['bobby', 'TABBY.'],
    ['tabby', '(from behind a tree) WHAT?'],
    ['bobby', 'WHERE’S THE RING?'],
    ['tabby', 'I THOUGHT CURSOR HAD IT.'],
    ['cursor', 'YOU SAID YOU HAD IT.'],
  ]);
  p.sit = false;

  // the ring rolls downhill
  let caught = false;
  let tries = 0;
  while (!caught) {
    const ring = g.add(rollingRing(cx(bella) + 30, 270));
    sfx.clang();
    if (tries === 0) await g.say('bella', 'Bobby… is that a ring rolling down the hill?');
    g.lock(false);
    g.objective('CATCH THE RING before it reaches the river!');
    g.cam.target = null;
    await g.until(() => ring.splash || (overlap(p, ring) && !ring.splash));
    if (overlap(p, ring) && !ring.splash) {
      caught = true;
      ring.dead = true;
      sfx.item();
    } else {
      tries++;
      g.lock();
      sfx.crash();
      await g.say('cursor', '…I’ll fish it out. Again. Try again!');
      ring.dead = true;
      p.x = 420;
      p.y = 260;
      p.vx = p.vy = 0;
      g.snapCamera();
    }
  }
  g.objective('');
  g.lock();
  await g.wait(0.4);
  await g.card('Got it!', '', 1.2, 'item');
  await g.walk(p, cx(bella) - 50, 220);
  p.facing = 1;
  p.mood = 'tired';
  await g.say('bobby', '*panting* BELLA.');
  p.sit = true;
  await g.say('bobby', 'WILL YOU PLEASE MARRY ME BEFORE SOMETHING ELSE GOES WRONG?');
  await g.wait(1);
  await g.say('bella', 'Yes.');
  p.mood = 'worried';
  await g.say('bobby', '…YES?');
  bella.mood = 'happy';
  await g.say('bella', 'YES, IDIOT!');
  p.mood = 'happy';
  p.sit = false;
  hearts(g, p, 10);
  petals(g, 8);
  // confetti, and a firework launcher Tabby definitely should not have touched
  t2.x = cx(p) - 120;
  cur.home = { x: cx(p) + 70, y: p.y - 40 };
  for (let i = 0; i < 40; i++) g.burst(cx(p) + rand(-200, 200), p.y - 100, ['#ff8fb1', '#f2c14e', '#7fdcff', '#a58bd6'][i % 4], 2, 140, 5);
  sfx.win();
  await g.wait(1.4);
  sfx.boom();
  g.shake(16);
  g.fx.flash = 0.8;
  g.fx.tint = '#bbbbbb';
  g.fx.tintA = 0.6;
  for (let i = 0; i < 12; i++) g.burst(cx(p) + rand(-300, 300), p.y - rand(0, 200), ['#ff5a3d', '#ffc94d', '#ffffff'][i % 3], 10, 300, 6);
  await g.wait(0.8);
  await g.talk([
    ['bobby', 'TABBY!'],
    ['tabby', 'LOVE IS EXPLOSIVE, BRO!'],
  ]);
  g.fx.tintA = 0;
  await g.wait(0.6);
  await g.fade(1, 1.4);
  g.lock(false);
}

// The ring. It rolls along the ground toward the river, bouncing.
function rollingRing(x, y) {
  return new Thing({ x, y, w: 16, h: 16, z: 8, vy: 0, t: 0, splash: false,
    tick(g, dt) {
      if (this.splash) return;
      this.t += dt;
      this.x += (175 + Math.sin(this.t * 1.7) * 40) * dt;
      const ground = g.solids.filter((s) => !s.off && !s.oneWay && s.kind !== 'none' && this.x + 8 >= s.x && this.x + 8 <= s.x + s.w).map((s) => s.y);
      const top = ground.length ? Math.min(...ground.filter((y) => y >= this.y - 4).concat([9999])) : 9999;
      this.vy += 1400 * dt;
      this.y += this.vy * dt;
      if (this.y + this.h > top && this.vy > 0) {
        this.y = top - this.h;
        this.vy = this.vy > 300 ? -this.vy * 0.45 : Math.random() < 0.02 ? -380 : 0;
      }
      if (this.x > RIVER) {
        this.splash = true;
        g.burst(this.x, GROUND, '#7fc8ff', 20, 200, 5);
      }
    },
    look(c, g) {
      if (this.splash) return;
      c.strokeStyle = '#dfe6ee';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(this.x + 8, this.y + 8, 6, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = '#9fe8ff';
      c.beginPath();
      c.arc(this.x + 8 + Math.cos(this.t * 12) * 6, this.y + 8 + Math.sin(this.t * 12) * 6, 2.5, 0, Math.PI * 2);
      c.fill();
    },
  });
}
