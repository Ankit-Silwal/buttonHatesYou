import { GROUND, ground, plat, block, edges } from '../build';
import { Npc, Crab, Bat, Slime, Thing, makeTabby, bark } from '../actors';
import { UnskippableAd } from '../bosses';
import { sfx } from '../audio';
import { cx } from '../engine';
import { popupWindow, rr, text } from '../draw';
import { adminMonitor, checkpointPost, coins, coreFragment, heartAt } from './common';

// Episode 3 — Two Idiots and a Sword. The Popup Forest: a cursed free
// trial, a fake chest, a cookie toll, a boss that will not be skipped, and
// a campfire.

const W = 4300;
const A0 = 3320; // boss arena
const A1 = 4280;

const LEVEL = {
  w: W,
  theme: 'popup',
  solids: [
    ground(0, 2480),
    ground(2760, 1540),
    // the upper path (needs the double jump)
    plat(1060, 360, 110, 'popup'),
    plat(1230, 280, 110, 'popup'),
    plat(1420, 210, 130, 'popup'),
    plat(1630, 260, 120, 'popup'),
    plat(1820, 330, 110, 'popup'),
    block(1980, 400, 80, 60, 'stone'),
    plat(3000, 360, 100, 'popup'),
    ...edges(W),
  ],
  deco: [
    { t: 'tree', x: 150, y: GROUND, s: 1.1, color: '#8f6fd6' },
    { t: 'bush', x: 420, y: GROUND, color: '#9b7be0' },
    { t: 'stall', x: 720, y: GROUND, color: '#b57cff', sign: 'FREE TRIAL™' },
    { t: 'sign', x: 1000, y: GROUND, text: '↑ ? · ↓ ?' },
    { t: 'tree', x: 1350, y: GROUND, s: 1.3, color: '#8f6fd6' },
    { t: 'bush', x: 1700, y: GROUND, color: '#9b7be0' },
    { t: 'tree', x: 2300, y: GROUND, s: 1, color: '#7a58c4' },
    { t: 'tree', x: 2900, y: GROUND, s: 1.2, color: '#8f6fd6' },
    { t: 'bush', x: 3150, y: GROUND, color: '#9b7be0' },
  ],
  spawn: { x: 120, y: GROUND - 60 },
};

const CAMP = {
  w: 960,
  theme: 'night',
  coins: false,
  solids: [ground(0, 960), ...edges(960)],
  deco: [
    { t: 'tree', x: 120, y: GROUND, s: 1.3, color: '#2c4a3a' },
    { t: 'tree', x: 840, y: GROUND, s: 1.2, color: '#2c4a3a' },
    { t: 'log', x: 360, y: GROUND, w: 80 },
    { t: 'log', x: 540, y: GROUND, w: 80 },
    { t: 'campfire', x: 480, y: GROUND },
  ],
  spawn: { x: 380, y: GROUND - 60 },
};

export default async function play(g, p) {
  const f = g.flags;
  f.slam = true;
  f.cursed = false;
  g.fx.fade = 1;
  g.load(LEVEL, p);
  g.music('adventure');
  const tabby = makeTabby(g, p, 60, GROUND - 40);
  g.lock();
  await g.card('Episode 3', 'Two Idiots and a Sword', 3);
  await g.fade(0, 1);
  await g.talk([
    ['tabby', 'Welcome to the Popup Forest. Watch out, everything here wants your email.'],
    ['tabby', 'Also! I’ve been practising. Press Q and I’ll TAB SLAM whatever’s closest. Knocks it silly for a couple of seconds.'],
    ['bobby', 'Why does it have to be Q?'],
    ['tabby', 'Q is right next to me on the keyboard. It’s a neighbourhood thing.'],
  ]);
  g.lock(false);

  // slam tutorial
  const crabs = [520, 620].map((x) => g.add(new Crab({ x, y: GROUND - 26 })));
  g.objective('Press Q to have Tabby slam an enemy, then finish it off.');
  await g.cleared(crabs);
  g.objective('');

  // FREE TRIAL
  const trial = g.add(new Npc({ kind: 'trial', x: 770, y: GROUND - 40, facing: -1, actLabel: 'Talk' }));
  let dealt = false;
  trial.act = async (g) => {
    if (dealt) return bark(g, trial, 'Remember: it’s free! Until it isn’t!', 2);
    dealt = true;
    g.lock();
    await g.talk([
      ['trial', 'Hello, valued customer! Today only, everything is FREE*.'],
      ['bobby', 'What’s the star for?'],
      ['trial', 'Decoration. First: Double Jump! Jump again in mid-air! Free trial!'],
      ['bobby', 'I didn’t ask for—'],
    ]);
    f.doubleJump = true;
    sfx.item();
    await g.card('Double Jump', 'Press jump again in the air · “Free trial. Cancel anytime. You can’t cancel.”', 2.8, 'item');
    await g.say('trial', 'And this! The Sword of Absolutely Free. Double damage. Legendary. Free.');
    const pick = await g.choose('FREE TRIAL holds out a glowing purple sword.', ['Take the free sword', 'No thanks']);
    if (pick === 1) await g.talk([['trial', 'Haha! You can’t say no to free. That’s the law.'], ['bobby', 'That is NOT the law.']]);
    f.cursed = true;
    sfx.item();
    await g.card('Sword of Absolutely Free', 'Double damage. Something about it smells like a subscription.', 2.8, 'item');
    await g.say('tabby', 'Dude. Why is it humming?');
    g.lock(false);
    // the free trial ends
    const endsAt = g.time + 40;
    g.add(new Thing({ w: 0, h: 0, hidden: true, tick(g) {
      if (g.time < endsAt || !f.cursed) return;
      this.dead = true;
      f.cursed = false;
      f.coins = Math.max(0, (f.coins ?? 0) - 3);
      sfx.error();
      g.fx.ads = [...(g.fx.ads ?? []), { x: 300, y: 150, w: 360, h: 140, label: 'FREE TRIAL EXPIRED · -3 coins', until: g.time + 2.5 }];
      bark(g, p, 'IT CHARGED ME. THE SWORD CHARGED ME.', 2.6);
      setTimeout(() => bark(g, tabby, 'At least you kept the double jump?', 2.4), 2600);
    } }));
  };
  g.objective('Talk to the merchant (E).');
  await g.until(() => dealt && f.cursed);
  g.objective('Two ways through. The high road needs a double jump.');
  checkpointPost(g, 980);

  // branching paths
  coins(g, 1080, 320, 3);
  coins(g, 1250, 240, 3);
  coins(g, 1440, 170, 4);
  heartAt(g, 1660, 220);
  coins(g, 1840, 290, 3);
  g.add(new Bat({ x: 1300, y: 140 }));
  g.add(new Slime({ x: 1300, y: GROUND - 24 }));
  g.add(new Crab({ x: 1550, y: GROUND - 26 }));
  g.add(new Slime({ x: 1800, y: GROUND - 24 }));
  g.add(new Bat({ x: 1700, y: 300 }));
  await g.reach(2060);
  g.objective('');

  // the "treasure" chest
  let opened = false;
  const chest = g.add(new Thing({ x: 2150, y: GROUND - 34, w: 48, h: 34, actLabel: 'Open chest',
    look(c) {
      c.fillStyle = opened ? '#6b4528' : '#b07a3a';
      rr(c, this.x, this.y + 8, this.w, this.h - 8, 4);
      c.fill();
      c.fillStyle = '#8a5a2a';
      rr(c, this.x, this.y + (opened ? -6 : 0), this.w, 12, 4);
      c.fill();
      c.fillStyle = '#f2c14e';
      c.fillRect(this.x + 20, this.y + 10, 8, 8);
    },
    act() {
      opened = true;
      this.actOff = true;
    },
  }));
  await g.reach(2080);
  bark(g, tabby, 'TREASURE!', 1.5);
  g.objective('A treasure chest! (E)');
  await g.until(() => opened);
  g.objective('');
  sfx.win();
  g.fx.ads = [...(g.fx.ads ?? []), { x: 230, y: 120, w: 500, h: 200, label: '🎉 YOU WON AN iPHONE!! 🎉', until: g.time + 2.5 }];
  g.lock();
  await g.wait(1);
  await g.talk([
    ['bobby', 'I won a phone!'],
    ['tabby', 'You don’t have hands.'],
    ['bobby', 'I’ll hold it with my HEART, Tabby.'],
  ]);
  g.lock(false);
  const ambush = [2050, 2250, 2350].map((x) => g.add(new Bat({ x, y: 260 })));
  chest.dead = true;
  bark(g, p, 'IT WAS A POPUP. THE CHEST WAS A POPUP.', 2.4);
  await g.until(() => ambush.every((b) => b.dead) || cx(p) > 2420);

  // the cookie toll
  const wall = g.addSolid({ x: 2460, y: 0, w: 20, h: GROUND, kind: 'none' });
  const cookie = g.add(new Npc({ kind: 'cookie', x: 2490, y: GROUND - 160, fixed: true, alwaysUpdate: true }));
  await g.reach(2300);
  g.lock();
  tabby.follow = null;
  await g.walk(p, 2420, 140);
  p.facing = 1;
  await g.talk([
    ['cookie', 'HALT. THIS BRIDGE USES COOKIES TO IMPROVE YOUR EXPERIENCE.'],
    ['bobby', 'What bridge? There’s no bridge.'],
    ['cookie', 'THE BRIDGE APPEARS WHEN YOU ACCEPT COOKIES.'],
  ]);
  const c = await g.choose('🍪 We value your privacy.', ['Accept all cookies', 'Reject non-essential', 'Manage preferences']);
  if (c === 0) {
    await g.talk([['cookie', 'WONDERFUL. I WILL NOW REMEMBER EVERYTHING ABOUT YOU. FOREVER.'], ['bobby', 'Cool cool cool. Normal bridge.']]);
    f.cookies = 'all';
  } else if (c === 1) {
    await g.talk([['cookie', 'FINE. ESSENTIAL COOKIES ONLY. I WILL REMEMBER YOU… A LITTLE.'], ['tabby', 'That’s worse somehow.']]);
    f.cookies = 'essential';
  } else {
    await g.talk([
      ['cookie', 'PREFERENCES: [✓] COOKIES ABOUT COOKIES. [✓] COOKIES ABOUT YOU. [✓] COOKIES ABOUT TABBY. [✓] LEGITIMATE INTEREST IN YOUR SOUL.'],
      ['bobby', 'Can I untick—'],
      ['cookie', 'NO. YOU KNOW WHAT, JUST GO.'],
    ]);
    f.cookies = 'managed';
  }
  sfx.confirm();
  wall.off = true;
  const bridge = g.addSolid({ x: 2470, y: GROUND, w: 300, h: 18, kind: 'wood' });
  g.burst(2620, GROUND, '#d79a5a', 20, 260, 6);
  cookie.fixed = false;
  cookie.vy = -400;
  cookie.vx = 0;
  cookie.extra = function (g, dt) {
    this.x += 260 * dt;
    if (this.x > 3200) this.dead = true;
  };
  await g.wait(0.5);
  tabby.follow = p;
  g.lock(false);
  checkpointPost(g, 2800);

  // Tabby defeats a boss
  const sign = g.add(new Thing({ x: 2980, y: GROUND - 64, w: 52, h: 64, look(c) {
    c.save();
    c.translate(this.x + 26, this.y + 64);
    c.rotate(this.tilt ?? 0);
    c.fillStyle = '#8a5a3a';
    c.fillRect(-3, -40, 6, 40);
    c.fillStyle = '#d9a86c';
    rr(c, -31, -64, 62, 28, 4);
    c.fill();
    text(c, 'BOSS →', 0, -50, { size: 12, color: '#4a2a14' });
    c.restore();
  } }));
  await g.reach(2900);
  g.lock();
  tabby.follow = null;
  await g.walk(tabby, 2960, 260);
  tabby.facing = 1;
  for (let i = 0; i < 3; i++) {
    tabby.swing = 0.25;
    sfx.hit();
    sign.tilt = 0.2 + i * 0.25;
    g.shake(4);
    await g.wait(0.35);
  }
  sign.tilt = 1.4;
  sfx.crash();
  await g.talk([
    ['tabby', 'HA! BOSS DEFEATED!'],
    ['bobby', 'That was a sign.'],
    ['tabby', 'It was a sign that I’m a legend.'],
    ['bobby', 'It said "BOSS →". With an arrow. Pointing at the actual boss.'],
    ['tabby', '…Then it’s a sign that I’m warmed up.'],
  ]);
  tabby.follow = p;
  g.lock(false);

  // THE UNSKIPPABLE AD
  await g.reach(A0 + 120);
  g.lock();
  g.checkpoint(A0 + 80, GROUND - 60);
  g.addSolid({ x: A0 - 20, y: -400, w: 20, h: 900, kind: 'none' });
  g.cam.fixed = { x: (A0 + A1) / 2, y: 270 };
  g.music(null, 0.2);
  sfx.boom();
  g.shake(14);
  const boss = g.add(new UnskippableAd({ x0: A0, x1: A1 }));
  g.boss = boss;
  await g.wait(1);
  await g.talk([
    ['ad', 'HI THERE! BEFORE YOU CONTINUE, PLEASE ENJOY THIS SHORT MESSAGE!'],
    ['bobby', 'How short?'],
    ['ad', 'YES!'],
    ['tabby', 'There’s a skip button! Bottom right!'],
    ['ad', 'SKIP IN 5… 4… 5… 4…'],
    ['bobby', 'It’s stuck.'],
    ['tabby', 'Don’t trust any big red X. When it starts buffering, find the REAL close button. Tiny. Grey. Corner.'],
  ]);
  g.music('danger');
  g.lock(false);
  g.objective('Hit the tiny grey × while the ad buffers. Ignore the big red one.');
  g.onRespawn = () => {
    for (const e of g.ents) if (e.label) e.dead = true;
    g.fx.ads = [];
  };
  await g.until(() => boss.dead);
  g.objective('');
  g.music(null, 0.5);
  g.lock();
  await g.wait(1);
  await g.say('bobby', 'Ad… skipped.');
  const frag = coreFragment(g, (A0 + A1) / 2 + 60, 300, 1);
  g.lock(false);
  g.objective('Take the Core Fragment.');
  await frag.done;
  g.objective('');
  g.lock();
  sfx.item();
  await g.card('Core Fragment 1 of 3', 'It hums like something important.', 2.6, 'item');
  const mon = adminMonitor(g, (A0 + A1) / 2 - 75, 90, 150, 96, { stand: false });
  sfx.glitch();
  mon.on = true;
  await g.talk([
    ['admin', 'Excellent work. One step closer to saving them.'],
    ['bobby', 'See? Maybe this guy isn’t so bad.'],
    ['tabby', 'Told you.'],
    ['bobby', 'I didn’t agree with you.'],
    ['tabby', 'You agreed emotionally.'],
  ]);
  mon.on = false;
  mon.dead = true;
  await g.fade(1, 1.2);
  g.cam.fixed = null;

  /* ---------- the campfire ---------- */
  g.load(CAMP, p);
  g.boss = null;
  g.music('music_box');
  p.tabby = null;
  p.x = 395;
  p.sit = true;
  p.facing = 1;
  const t2 = g.add(new Npc({ kind: 'tabby', x: 548, y: GROUND - 40, facing: -1, sit: true }));
  p.mood = 'calm';
  g.fx.letterbox = 1;
  await g.fade(0, 1.5);
  await g.wait(2.5);
  await g.talk([
    ['tabby', 'When this is over, what are you going to do?'],
    ['bobby', 'Go home. Eat Bella’s terrible soup.'],
    ['tabby', 'You hate her soup.'],
    ['bobby', 'Yeah.'],
    3,
    ['bobby', 'But I like eating it with her.'],
    ['tabby', 'Man, that was almost a normal thing to say.'],
    ['bobby', 'Shut up.'],
  ]);
  await g.wait(1.5);
  await g.say('note', 'There is one marshmallow left.');
  const m = await g.choose('Who gets the last marshmallow?', ['Give it to Tabby', 'Give it to Bobby']);
  f.marshmallow = m === 0 ? 'tabby' : 'bobby';
  sfx.pop();
  if (m === 0) {
    t2.mood = 'happy';
    await g.talk([
      ['tabby', 'For ME? Bro.'],
      ['bobby', 'Don’t make it weird.'],
      ['tabby', 'I’m going to remember this forever. This is the best marshmallow of my life.'],
      ['bobby', 'It’s a marshmallow, Tabby.'],
    ]);
  } else {
    p.mood = 'happy';
    await g.talk([
      ['bobby', 'Mine. Finders keepers.'],
      ['tabby', 'You didn’t find it, you just— fine. FINE. You owe me one marshmallow.'],
      ['bobby', 'Put it on my tab.'],
      ['tabby', '…That’s my name.'],
      ['bobby', 'I know.'],
    ]);
  }
  await g.wait(1.5);
  await g.fade(1, 2);
  g.fx.letterbox = 0;
  p.sit = false;
  g.lock(false);
}
