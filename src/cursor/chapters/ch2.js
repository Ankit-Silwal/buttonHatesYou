import { GROUND, ground, plat, block, edges } from '@/reason/build';
import { Thing, Pickup, bark } from '@/reason/actors';
import { sfx } from '@/reason/audio';
import { cx, rand } from '@/reason/engine';
import { rr, text } from '@/reason/draw';
import { Wallet, TaxGoblin, RunCoin, TaxCollector } from '../foes';
import { begin, confidence, bellaAt, hearts } from '../common';
import { makeTabby } from '@/reason/actors';

// Chapter 2 — Operation: Get a Girlfriend. Get handsome, get rich, get
// rejected (sort of).

const W = 4500;
const ARENA = [2560, 3480];
const LEVEL = {
  w: W,
  theme: 'village',
  solids: [
    ground(0, 1300),
    ground(1400, 520),
    ground(2010, W - 2010),
    plat(1310, 380, 100),
    plat(1920, 380, 90),
    plat(700, 340, 120),
    plat(1600, 320, 140),
    plat(2200, 330, 120),
    ...edges(W),
  ],
  deco: [
    { t: 'sign', x: 120, y: GROUND, text: 'TRAINING' },
    { t: 'dummy', x: 300, y: GROUND },
    { t: 'fence', x: 760, y: GROUND, w: 140 },
    { t: 'sign', x: 1000, y: GROUND, text: 'FIELD →' },
    { t: 'bush', x: 1700, y: GROUND },
    { t: 'tree', x: 2300, y: GROUND, s: 1 },
    { t: 'stall', x: 3900, y: GROUND, color: '#ff8fb1', sign: 'FLOWERS · 5🪙' },
    { t: 'flower', x: 3920, y: GROUND - 44, c: '#ff4f7b' },
    { t: 'flower', x: 3950, y: GROUND - 44, c: '#ffd0e0' },
    { t: 'flower', x: 3980, y: GROUND - 44, c: '#ff8fb1' },
    { t: 'tree', x: 4300, y: GROUND, s: 1.1 },
  ],
  spawn: { x: 80, y: GROUND - 60 },
};

const GLOWUP = [
  ['shades', '😎 Massive sunglasses (covers his whole face)'],
  ['stache', '👨 A golden mustache (it moves on its own)'],
  ['abs', '💪 A six-pack, drawn on with a marker'],
  ['grass', '🌿 A hairstyle made of grass'],
  ['cape', '🦸 A tiny cape that says ALPHA BUTTON'],
];

export default async function play(g, p) {
  const f = g.flags;
  f.sword = true;
  const cur = await begin(g, p, LEVEL, 2, 'Operation: Get a Girlfriend', 'village');
  const tabby = makeTabby(g, p, 40, GROUND - 40);
  confidence(g, 12);
  await g.talk([
    ['bobby', 'Okay. New plan. Before I talk to Bella, I need to become attractive.'],
    ['tabby', 'Leave it to me. Three-part training program. Part one: become HANDSOME.'],
    ['cursor', 'This is going to go so badly.'],
  ]);
  g.lock(false);

  /* ---------- Mission 1: become handsome ---------- */
  g.objective('Mission 1: become handsome. Use the mirror (E).');
  let styled = false;
  g.add(new Thing({ x: 460, y: GROUND - 90, w: 50, h: 90, actLabel: 'Mirror', z: 1,
    act() {
      styled = true;
      this.actOff = true;
    },
    look(c, g) {
      c.fillStyle = '#8a5a3a';
      rr(c, this.x, this.y, 50, 90, 25);
      c.fill();
      c.fillStyle = '#cfe8ff';
      rr(c, this.x + 5, this.y + 5, 40, 80, 20);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.6)';
      c.fillRect(this.x + 12, this.y + 15, 4, 30);
    },
  }));
  await g.until(() => styled);
  g.lock();
  p.facing = 1;
  const left = [...GLOWUP];
  p.acc = [];
  for (let i = 0; i < 3; i++) {
    const k = await g.choose(`Pick an accessory (${3 - i} left)`, left.map((x) => x[1]));
    const [id] = left.splice(k, 1)[0];
    p.acc = [...p.acc, id];
    sfx.item();
    g.burst(cx(p), p.y + 10, '#ffe08a', 12, 200, 4);
    confidence(g, 12 + (i + 1) * 30, '+30% confidence');
    await g.wait(0.4);
  }
  f.glowup = p.acc;
  await g.talk([
    ['tabby', 'You look incredible.'],
    ['cursor', 'He looks like a traffic light with depression.'],
    ['bobby', 'HATERS HATE SUCCESS.'],
  ]);
  confidence(g, 104, 'confidence: 104%');
  await g.say('bobby', 'Mission 2?');
  await g.say('tabby', 'Become rich. Bella sells flowers for five coins. How many coins do you have?');
  f.coins = 0;
  await g.say('bobby', 'I spent my one coin on a house.');
  await g.say('cursor', 'You bought a cardboard box.');
  await g.say('bobby', 'A HOUSE, Cursor.');
  g.lock(false);

  /* ---------- Mission 2: become rich ---------- */
  g.objective('Mission 2: become rich. The coins in the field have legs. Catch them.');
  const runners = [880, 1140, 1500, 1680, 1820, 2120, 2300].map((x) => g.add(new RunCoin({ x, y: GROUND - 22 })));
  [1050, 1550, 2250].forEach((x) => g.add(new Wallet({ x, y: GROUND - 20 })));
  [1250, 1750].forEach((x) => g.add(new TaxGoblin({ x, y: GROUND - 28 })));
  await g.reach(820);
  bark(g, p, 'THE COINS ARE RUNNING AWAY.', 2.2);
  setTimeout(() => bark(g, tabby, 'Money’s like that, bro.', 2), 2400);
  await g.until(() => (f.coins ?? 0) >= 5 || cx(p) > 2420);
  if ((f.coins ?? 0) >= 5) bark(g, p, 'Five coins! I’M LOADED.', 2.2);
  await g.reach(2420);

  /* ---------- THE TAX COLLECTOR ---------- */
  g.lock();
  g.checkpoint(ARENA[0] + 60, GROUND - 60);
  const exitWall = g.addSolid({ x: ARENA[1], y: -400, w: 20, h: 860, kind: 'none' });
  g.cam.fixed = { x: (ARENA[0] + ARENA[1]) / 2, y: 270 };
  await g.walk(p, ARENA[0] + 160, 160);
  g.addSolid({ x: ARENA[0] - 20, y: -400, w: 20, h: 860, kind: 'none' });
  const pig = g.add(new TaxCollector({ x: ARENA[1] - 260, x0: ARENA[0], x1: ARENA[1] }));
  g.boss = pig;
  p.facing = 1;
  g.music(null, 0.3);
  await g.talk([
    ['tax', 'HALT. YOU OWE ME TAXES.'],
    ['bobby', 'I DON’T HAVE A JOB.'],
    ['tax', 'UNEMPLOYMENT TAX.'],
    ['bobby', 'THAT’S NOT A THING.'],
    ['tax', 'IT IS NOW. NINETY PERCENT. HAND IT OVER.'],
    ['cursor', 'He’s got armour. Smash the plates, then I’ll hit the reset switch on his back. Click it when it shows up.'],
  ]);
  g.music('adventure');
  g.lock(false);
  g.objective('Break the armour (J), then click the reset switch (or R). Then hit him!');
  g.onRespawn = () => {
    for (const e of g.ents) if (e.label === 'BILL') e.dead = true;
  };
  await g.until(() => pig.dead);
  g.boss = null;
  g.onRespawn = null;
  g.objective('');
  await g.wait(1.5);
  f.coins = Math.max(f.coins ?? 0, 50);
  g.lock();
  sfx.win();
  await g.card('+50 coins', 'Tax refund. Finally, the system works for the little button.', 2.6, 'item');
  confidence(g, 160, 'confidence: 160%');
  await g.talk([
    ['bobby', 'I’M RICH!'],
    ['tabby', 'That’s 50 coins.'],
    ['bobby', 'I’M BUYING BELLA THE MOON.'],
  ]);
  exitWall.off = true;
  g.cam.fixed = null;
  g.lock(false);

  /* ---------- Mission 3: learn to flirt ---------- */
  g.objective('Mission 3: learn to flirt. Head to the flower stall.');
  const bella = bellaAt(g, 3960, { facing: -1 });
  await g.reach(3500);
  g.lock();
  g.objective('');
  tabby.follow = null;
  p.facing = 1;
  await g.say('tabby', 'Okay. I’ve prepared three pickup lines. Pick the least embarrassing one.');
  await g.choose('Tabby’s pickup lines', [
    '“Are you CSS? Because you make my life beautiful.”',
    '“Are you Wi-Fi? Because I’m feeling a connection.”',
    '“PLEASE MARRY ME. I’VE BEEN SINGLE FOR 404 DAYS.”',
  ]);
  await g.say('bobby', 'Great choice. I’m going with C.');
  await g.say('cursor', 'That’s not what we—');
  g.music('love');
  p.mood = 'shout';
  await g.walk(p, 3900, 300);
  await g.talk([
    ['bobby', 'PLEASE MARRY ME!'],
    ['bella', 'What’s your name?'],
    ['bobby', '…Bobby.'],
    ['bella', 'Maybe start with hello?'],
    ['bobby', 'HELLO. PLEASE MARRY ME.'],
  ]);
  bella.mood = 'happy';
  sfx.blip(2);
  await g.say('bella', '*laughs* You’re ridiculous.');
  if (f.glowup?.includes('stache')) await g.say('bella', 'Is your mustache… moving?');
  await g.say('bobby', 'Is that a yes?');
  await g.say('bella', 'It’s a maybe. To coffee.');
  confidence(g, 999, 'CONFIDENCE: 999%');
  hearts(g, p, 8);
  p.mood = 'closed';
  p.sit = true;
  sfx.crash();
  await g.wait(1.2);
  await g.talk([
    ['cursor', 'Mission successful?'],
    ['tabby', 'He’s unconscious. That’s the happiest I’ve ever seen him.'],
    ['bella', 'Tell him coffee’s tomorrow. Seven. Don’t be late.'],
  ]);
  await g.card('', 'Bella agreed to a date.', 3, 'soft');
  g.meter = null;
  await g.fade(1, 1.2);
  p.sit = false;
  g.lock(false);
}
