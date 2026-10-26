import { GROUND, ground, plat, edges } from '../build';
import { Npc, Bug, Pickup, Thing, bark } from '../actors';
import { sfx } from '../audio';
import { cx } from '../engine';
import { text, sword } from '../draw';

// Episode 1 — A Button With a Life. Peaceful Clicktopia: wake up, chores,
// a wooden sword, garden bugs, Tabby, and Bella's pendant.

export const BEDROOM = {
  w: 960,
  theme: 'bedroom',
  coins: true,
  solids: [ground(0, 960, 'floor'), ...edges(960)],
  deco: [
    { t: 'wall', x: 0, y: 0, w: 960, h: GROUND },
    { t: 'window', x: 560, y: 130, w: 120, h: 100, rain: true, night: true },
    { t: 'weddingPhoto', x: 320, y: 165 },
    { t: 'rug', x: 360, y: GROUND, w: 200 },
    { t: 'lamp', x: 720, y: GROUND },
    { t: 'table', x: 760, y: GROUND, soup: true },
    { t: 'bloomVase', x: 832, y: GROUND - 40 },
    { t: 'door', x: 890, y: GROUND },
  ],
  spawn: { x: 120, y: GROUND - 80 },
};

export const VILLAGE = {
  w: 3700,
  theme: 'village',
  solids: [
    ground(0, 1650),
    ground(1760, 330),
    ground(2200, 1500),
    plat(1660, 400, 90),
    plat(1820, 360, 110),
    plat(1990, 300, 110),
    plat(2120, 380, 80),
    ...edges(3700),
  ],
  deco: [
    { t: 'house', x: 60, y: GROUND, w: 250, h: 160, color: '#f4e1c8', roof: '#c9523e', label: 'Bobby & Bella' },
    { t: 'flower', x: 330, y: GROUND, c: '#ff8fb1' },
    { t: 'flower', x: 350, y: GROUND, c: '#f2c14e' },
    { t: 'flower', x: 372, y: GROUND, c: '#a58bd6' },
    { t: 'flower', x: 30, y: GROUND, c: '#ff8fb1' },
    { t: 'lamppost', x: 470, y: GROUND },
    { t: 'tree', x: 560, y: GROUND, s: 1.1 },
    { t: 'stall', x: 760, y: GROUND, color: '#e2674f', sign: 'SWORDS' },
    { t: 'stall', x: 960, y: GROUND, color: '#5b9bd5', sign: 'BREAD' },
    { t: 'stall', x: 1150, y: GROUND, color: '#7cc6a4', sign: 'SOUP (not Bella’s)' },
    { t: 'lamppost', x: 1320, y: GROUND },
    { t: 'sign', x: 1520, y: GROUND, text: 'GARDEN →' },
    { t: 'bush', x: 1590, y: GROUND },
    { t: 'fence', x: 2240, y: GROUND, w: 120 },
    { t: 'flower', x: 2400, y: GROUND, c: '#ff8fb1' },
    { t: 'flower', x: 2460, y: GROUND, c: '#f2c14e' },
    { t: 'flower', x: 2530, y: GROUND, c: '#ff8fb1' },
    { t: 'flower', x: 2620, y: GROUND, c: '#a58bd6' },
    { t: 'flower', x: 2700, y: GROUND, c: '#f2c14e' },
    { t: 'tree', x: 2580, y: GROUND, s: 0.9 },
    { t: 'fence', x: 2780, y: GROUND, w: 120 },
    { t: 'house', x: 3200, y: GROUND, w: 220, h: 150, color: '#cfe3f7', roof: '#3b77ad', label: 'Tabby (future knight)' },
    { t: 'tree', x: 3520, y: GROUND, s: 1.2 },
  ],
  spawn: { x: 175, y: GROUND - 60 },
};

export default async function play(g, p) {
  const f = g.flags;
  f.sword = false;
  f.pendant = false;

  /* ---------- the bedroom ---------- */
  g.fx.fade = 1;
  g.load(BEDROOM, p);
  g.music('music_box');
  p.x = 150;
  p.y = GROUND - 40 - 30;
  p.sit = true;
  p.mood = 'closed';
  const bed = { x: 120, y: GROUND - 30, w: 160, h: 10, kind: 'none', oneWay: true };
  g.addSolid(bed);
  g.deco = [...g.deco, { t: 'bed', x: 110, y: GROUND }, { t: 'shelf', x: 420, y: 300, broken: true }];
  const bella = g.add(new Npc({ kind: 'bella', x: 330, y: GROUND - 40, facing: -1 }));
  g.lock();
  g.fx.letterbox = 1;
  await g.card('Episode 1', 'A Button With a Life', 3);
  await g.fade(0, 1.6);
  await g.wait(0.6);

  await g.talk([
    ['bella', 'Bobby. Wake up.'],
    ['bobby', 'Five more minutes.'],
    ['bella', 'You said that two hours ago.'],
    ['bobby', 'Time is a social construct.'],
    ['bella', 'Your job starts in ten minutes.'],
    ['bobby', 'SO IS EMPLOYMENT.'],
  ]);
  // the pillow
  bella.mood = 'smug';
  const pillow = g.add(new Thing({ x: 320, y: GROUND - 60, w: 28, h: 16, vx: -520, vy: -260,
    tick(g, dt) {
      this.vy += 1300 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.x < p.x + 20) {
        this.dead = true;
        sfx.hit();
        g.burst(p.x + 15, p.y + 10, '#ffffff', 16, 220, 6);
      }
    },
    look(c) {
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.ellipse(this.x + 14, this.y + 8, 14, 8, 0.2, 0, Math.PI * 2);
      c.fill();
    },
  }));
  await g.until(() => pillow.dead);
  p.sit = false;
  p.mood = 'shout';
  p.vy = -420;
  p.vx = 120;
  bed.off = true;
  await g.wait(0.7);
  p.mood = 'calm';
  bella.mood = 'happy';
  await g.say('bella', 'Good morning, sunshine.');
  await g.say('bobby', 'I was having a dream where I was a knight.');
  await g.say('bella', 'You were snoring "I am a knight" for an hour. I know.');
  g.fx.letterbox = 0;
  g.lock(false);

  // coins under the bed
  g.objective('Move with ← → (or A D). Find the 3 coins Bobby dropped under the bed.');
  const coins = [150, 200, 250].map((x) => g.add(new Pickup({ kind: 'coin', x, y: GROUND - 18 })));
  bark(g, bella, 'Your coins are under the bed again. Every single day.', 3.5);
  await g.cleared(coins);
  await g.say('bobby', 'Three whole coins. I am basically rich.');

  // the shelf
  bella.goal = 470;
  await g.say('bella', 'Rich man, could you fix the shelf before it falls on someone? Hammer is in the toolbox.');
  g.objective('Get the hammer from the toolbox (walk up and press E).');
  let hammer = false;
  const box = g.add(new Thing({ x: 640, y: GROUND - 24, w: 40, h: 24, actLabel: 'Take hammer',
    look(c) {
      c.fillStyle = '#d94c3d';
      c.fillRect(this.x, this.y + 2, 40, 22);
      c.strokeStyle = '#7a2a20';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(this.x + 20, this.y + 2, 8, Math.PI, 0);
      c.stroke();
    },
    act(g) {
      hammer = true;
      this.actOff = true;
      sfx.item();
      g.floatText(cx(this), this.y - 10, 'Got the little hammer', '#fff', 14);
    },
  }));
  await g.until(() => hammer);
  box.actOff = true;
  g.objective('Fix the shelf (stand under it and press E).');
  let hits = 0;
  const shelf = g.add(new Thing({ x: 410, y: 290, w: 130, h: 170, actLabel: 'Hammer',
    act(g) {
      hits++;
      sfx.hammer();
      g.shake(3);
      g.burst(470, 310, '#c79a62', 5, 160, 3);
      if (hits === 1) bark(g, p, 'Tap.', 0.8);
      if (hits === 3) bark(g, p, 'TAP TAP.', 0.8);
      if (hits >= 5) {
        this.actOff = true;
        g.deco = g.deco.map((d) => (d.t === 'shelf' ? { ...d, broken: false } : d));
        sfx.win();
      }
    },
  }));
  bark(g, bella, 'Five good hits. Not on your face this time.', 3);
  await g.until(() => hits >= 5);
  shelf.dead = true;
  await g.talk([
    ['bella', 'Look at that. A handyman.'],
    ['bobby', 'I could fix anything. Shelves. The economy. My sleep schedule.'],
    ['bella', 'Start with the third one. Now go. Get some fresh air before work.'],
    ['bobby', 'Before "work". With quote marks.'],
  ]);
  g.objective('Head outside (the door, press E).');
  let out = false;
  g.add(new Thing({ x: 890, y: GROUND - 90, w: 54, h: 90, actLabel: 'Go outside', act() {
    out = true;
    sfx.door();
  } }));
  await g.until(() => out);
  await g.fade(1, 0.5);

  /* ---------- outside ---------- */
  g.load(VILLAGE, p);
  g.music('village');
  await g.fade(0, 0.8);
  g.objective('Mrs. Enter sells swords at the market. You have exactly enough coins.');
  const bellaOut = g.add(new Npc({ kind: 'bella', x: 250, y: GROUND - 40, facing: 1 }));
  bark(g, bellaOut, 'Bring back bread!', 2.5);
  const villagers = [
    new Npc({ kind: 'villager', x: 520, y: GROUND - 36, color: '#a58bd6', dark: '#7c63ad', facing: 1 }),
    new Npc({ kind: 'villager', x: 1060, y: GROUND - 36, color: '#f2c14e', dark: '#c99a2e', facing: -1 }),
    new Npc({ kind: 'villager', x: 1240, y: GROUND - 36, color: '#7cc6a4', dark: '#549c7c', facing: -1 }),
  ];
  const chatter = [
    ['Morning, Bobby!', 'Is it true you fixed a shelf?', 'Lovely day for not being clicked.'],
    ['Bread is fresh! Coins are not optional.', 'Tell Bella I said hi!', 'Are you working today? Haha. Ha.'],
    ['Free soup samples! (not Bella’s)', 'This soup has never hurt anyone.', 'Soup!'],
  ];
  villagers.forEach((v, i) => {
    v.act = (g) => bark(g, v, chatter[i][Math.floor(Math.random() * 3)], 2.4);
    v.actLabel = 'Chat';
    g.add(v);
  });

  const merchant = g.add(new Npc({ kind: 'merchant', x: 810, y: GROUND - 40, facing: -1 }));
  let bought = false;
  merchant.act = async (g) => {
    if (bought) return bark(g, merchant, 'No refunds. Swing responsibly.', 2);
    g.lock();
    await g.talk([
      ['merchant', 'Bobby! Are you finally buying the wooden sword you look at every day?'],
      ['bobby', 'I have three coins and a dream.'],
      ['merchant', 'It costs three coins. The dream is free.'],
    ]);
    f.coins = Math.max(0, (f.coins ?? 0) - 3);
    f.sword = true;
    bought = true;
    sfx.item();
    g.lock(false);
    await g.card('Wooden Sword', 'J or X to swing · press it three times for a combo', 2.6, 'item');
  };
  merchant.actLabel = 'Buy sword (3 coins)';
  await g.until(() => bought);

  // the training dummy
  g.objective('Practice on the training dummy: J J J for a three-hit combo.');
  let finisher = false;
  let dummyHits = 0;
  const dummy = g.add(new Thing({ x: 1400, y: GROUND - 78, w: 36, h: 78, team: 'enemy',
    hurt(g, dmg) {
      dummyHits++;
      sfx.hit();
      this.wobble = 0.3;
      if (dmg >= 2) {
        finisher = true;
        g.floatText(cx(this), this.y - 10, 'COMBO!', '#ffe066', 18);
      }
      return true;
    },
    tick(g, dt) {
      this.wobble = Math.max(0, (this.wobble ?? 0) - dt);
    },
    look(c) {
      c.save();
      c.translate(this.x + 18, this.y + 78);
      c.rotate(Math.sin((this.wobble ?? 0) * 40) * (this.wobble ?? 0));
      c.fillStyle = '#6b4528';
      c.fillRect(-3, -60, 6, 60);
      c.fillRect(-22, -46, 44, 5);
      c.fillStyle = '#c9a36b';
      c.beginPath();
      c.roundRect(-16, -76, 32, 34, 10);
      c.fill();
      c.strokeStyle = '#8a5a3a';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, -60, 8, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    },
  }));
  await g.reach(1250);
  bark(g, p, 'Prepare yourself, Gerald.', 2);
  await g.until(() => finisher);
  await g.wait(0.4);
  bark(g, p, 'Gerald has been defeated. Gerald was a sack.', 2.6);
  dummy.hurt = null;
  dummy.team = null;

  // jumping
  g.objective('Jump with Space (or W / ↑). Hold it to jump higher. Cross to the garden.');
  await g.reach(2250);

  // garden bugs
  g.objective('Clear the garden bugs. They are eating Bella’s flowers.');
  const bugs = [2380, 2480, 2560, 2650, 2740, 2860].map((x, i) => g.add(new Bug({ x, y: GROUND - 16, facing: i % 2 ? 1 : -1, drop: i % 3 === 0 })));
  bark(g, p, 'Bugs. On Bella’s flowers. Unforgivable.', 2.5);
  const count = () => bugs.filter((b) => b.dead).length;
  let shown = -1;
  await g.until(() => {
    const n = count();
    if (n !== shown) {
      shown = n;
      g.objective(`Clear the garden bugs (${n}/6). Tip: in the air, hold ↓ and attack to bounce.`);
    }
    return n >= bugs.length;
  });
  g.objective('');

  // Tabby
  await g.wait(0.6);
  const tabby = g.add(new Npc({ kind: 'tabby', x: 3300, y: GROUND - 40, facing: -1, weapon: 'tabby' }));
  g.lock();
  await g.walk(tabby, cx(p) + 70, 220);
  tabby.faceTo = p;
  p.facing = 1;
  await g.talk([
    ['tabby', 'Did you just clear an entire bug army by yourself?'],
    ['bobby', 'Six bugs, Tabby.'],
    ['tabby', 'An ARMY. Of six.'],
    ['tabby', 'Bro, imagine if we actually became heroes.'],
    ['bobby', 'I can’t even afford new shoes.'],
    ['tabby', 'You don’t have feet.'],
    ['bobby', 'EXACTLY. THAT’S HOW BROKE I AM.'],
    ['tabby', 'Come with me to the market. They got a REAL sword in. Steel. We can look at it. Sadly.'],
    ['bobby', 'Let me tell Bella first. She worries.'],
    ['tabby', 'She worries because you’re you.'],
  ]);
  g.lock(false);
  tabby.faceTo = null;
  tabby.follow = p;
  g.objective('Head back home to Bella.');
  await g.reach(0, 500);

  // the pendant
  g.lock();
  g.fx.letterbox = 1;
  bellaOut.faceTo = p;
  await g.walk(p, 360, 130);
  p.facing = -1;
  tabby.follow = null;
  await g.walk(tabby, 460, 150);
  tabby.facing = -1;
  await g.talk([
    ['bella', 'There you are. You smell like bugs.'],
    ['bobby', 'Heroic bugs. I won.'],
    ['bella', 'Come here. I have something for you.'],
  ]);
  await g.walk(bellaOut, cx(p) - 50, 80);
  await g.card('', 'Bobby left his wedding pendant on the nightstand again. Bella fastens it back around his neck.', 3, 'soft');
  await g.talk([
    ['bella', 'If you ever get lost, this will remind you where home is.'],
    ['bobby', 'I’m going to the market, not to war.'],
    ['bella', 'Just promise you’ll come back.'],
    ['bobby', 'I promise.'],
  ]);
  f.pendant = true;
  sfx.item();
  p.pendantGlow = true;
  await g.card('Silver Heart Pendant', 'Equipped. “This will remind you where home is.”', 3, 'item');
  p.pendantGlow = false;
  await g.talk([
    ['tabby', 'Aww. Do I get a pendant?'],
    ['bella', 'You get to make sure he comes back.'],
    ['tabby', 'Deal. Knight’s honor.'],
  ]);

  // the sky flickers
  await g.wait(0.8);
  g.music(null, 0.3);
  sfx.glitch();
  g.fx.glitch = 0.6;
  g.fx.flash = 0.5;
  g.shake(10);
  await g.wait(0.7);
  sfx.glitch();
  g.fx.glitch = 1;
  g.fx.redSky = 0.25;
  await g.wait(1);
  g.fx.redSky = 0;
  bellaOut.mood = 'worried';
  tabby.mood = 'worried';
  p.mood = 'worried';
  g.deco = [...g.deco, { t: 'giantCursor', x: cx(p) + 40, y: 30, s: 5, front: false }];
  sfx.boom();
  g.shake(14);
  await g.wait(1.2);
  await g.talk([
    ['bella', 'Bobby… what is that?'],
    ['tabby', 'That’s… a cursor. A really, really big one.'],
    ['bobby', 'Why is it pointing at us?'],
  ]);
  await g.wait(0.8);
  await g.card('', 'For the first time, somebody outside their world has begun interacting with it.', 4, 'soft');
  await g.fade(1, 1.2);
  g.fx.letterbox = 0;
  g.lock(false);
}
