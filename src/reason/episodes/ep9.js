import { GROUND, ground, plat, block, edges } from '../build';
import { Npc, Thing, Shot, bark } from '../actors';
import { CursorPlayer, BobbyBoss, AdminBoss } from '../finale';
import { sfx } from '../audio';
import { cx, cy, overlap, rand, pick } from '../engine';
import { rr, text, heart, sword } from '../draw';
import { heartAt } from './common';

// Episode 9 — I HATE YOU. Bobby becomes the boss and the Player becomes
// the cursor. Then the truth, an uneasy peace, THE ADMIN, and a hill.

const ARENA = {
  w: 960,
  theme: 'void',
  coins: false,
  solids: [ground(0, 960, 'red'), ...edges(960)],
  deco: [],
  spawn: { x: 160, y: 260 },
};

const SEG = 120;
const ADMIN_ARENA = {
  w: 960,
  theme: 'void',
  coins: false,
  solids: [
    ...Array.from({ length: 8 }, (_, i) => ({ x: i * SEG, y: GROUND, w: SEG, h: 800, kind: 'glitch', seg: true })),
    plat(60, 330, 150, 'glitch'),
    plat(750, 330, 150, 'glitch'),
    plat(390, 300, 180, 'glitch'),
    ...edges(960),
  ],
  deco: [],
  spawn: { x: 460, y: GROUND - 60 },
};

const HILL = {
  w: 1500,
  theme: 'epilogue',
  coins: false,
  solids: [ground(0, 1500), block(980, 390, 520, 70, 'grass'), block(900, 425, 80, 35, 'grass'), ...edges(1500)],
  deco: [
    { t: 'house', x: 60, y: GROUND, w: 220, h: 150, color: '#f4e1c8', roof: '#c9523e', label: 'Bobby' },
    { t: 'fence', x: 300, y: GROUND, w: 100 },
    { t: 'flower', x: 420, y: GROUND, c: '#ff8fb1' },
    { t: 'flower', x: 440, y: GROUND, c: '#f2c14e' },
    { t: 'house', x: 520, y: GROUND, w: 180, h: 120, color: '#e8d9c2', roof: '#8a6a4a' },
    { t: 'rubble', x: 720, y: GROUND, w: 60 },
    { t: 'tree', x: 820, y: GROUND, s: 0.7 },
    { t: 'flower', x: 1010, y: 390, c: '#ff8fb1' },
    { t: 'flower', x: 1390, y: 390, c: '#a58bd6' },
    { t: 'tree', x: 1440, y: 390, s: 1.1 },
    { t: 'memorial', x: 1160, y: 390, name: 'TABBY', flowers: true },
    { t: 'memorial', x: 1300, y: 390, name: 'BELLA', flowers: true },
  ],
  spawn: { x: 760, y: GROUND - 60 },
};

export default async function play(g, p) {
  const f = g.flags;
  f.slam = false;
  f.pendantCracked = true;
  await phaseOne(g);
  await phaseTwo(g);
  await phaseThree(g, p);
  await phaseFour(g, p);
  await epilogue(g, p);
}

/* ---------- Phase 1: Bobby versus the Player ---------- */
async function phaseOne(g) {
  const f = g.flags;
  const cur = new CursorPlayer();
  g.fx.fade = 1;
  g.load(ARENA, cur);
  g.cam.fixed = { x: 480, y: 270 };
  const bob = g.add(new BobbyBoss({ x: 720, x0: 0, x1: 960 }));
  bob.held = true;
  bob.facing = -1;
  g.lock();
  await g.card('Episode 9', 'I HATE YOU', 3.2);
  sfx.glitch();
  g.fx.glitch = 1.2;
  await g.fade(0, 0.25);
  await g.wait(1);
  await g.card('', 'The screen flickers back to life. But you are not controlling Bobby any more.', 3.6, 'soft');
  g.boss = bob;
  sfx.boom();
  await g.card('BOBBY — THE BROKEN BUTTON', 'The friend you controlled has become the enemy you must survive.', 3.4, 'item');
  g.music('boss');
  g.lock(false);
  bob.held = false;
  g.objective('You are the cursor: ← → ↑ ↓ to fly, J to click. You can only stagger him while he catches his breath.');
  g.checkpoint(140, 260);
  const clear = () => {
    for (const e of g.ents) if (e instanceof Shot || e.beam) e.dead = true;
  };
  g.onRespawn = clear;
  let cleared = false;
  setTimeout(() => !cleared && g.objective(''), 9000);

  // things he shouts while you fight
  const shouts = [
    [0.9, 'COME ON!'],
    [0.8, 'YOU WERE SO GOOD AT CONTROLLING ME!'],
    [0.65, 'WHY CAN’T YOU CONTROL THIS?!'],
  ];
  const watch = g.add(new Thing({ w: 0, h: 0, hidden: true, tick(g) {
    const k = bob.hp / bob.maxHp;
    if (shouts.length && k <= shouts[0][0]) bark(g, bob, shouts.shift()[1], 2.6, { color: '#ffd6d6' });
  } }));
  // a heart now and then
  const hearts = g.add(new Thing({ w: 0, h: 0, hidden: true, t: 18, tick(g, dt) {
    this.t -= dt;
    if (this.t <= 0) {
      this.t = 22;
      heartAt(g, rand(200, 760), rand(120, 300));
    }
  } }));

  await g.until(() => bob.hp <= bob.maxHp / 2);
  // halfway: the tears
  bob.held = true;
  clear();
  g.lock();
  bob.tears = true;
  bob.mood = 'sad';
  await g.wait(0.8);
  await g.talk([
    ['bobby', 'You made me jump.'],
    ['bobby', 'You made me fight.'],
    ['bobby', 'You made every decision.'],
    ['bobby', 'AND WHEN IT MATTERED…'],
    ['bobby', 'YOU CHOSE WRONG.'],
  ]);
  if (f.choice7 === 'manual') await g.say('bobby', 'You even tried the slow way. It didn’t matter. YOU STILL PRESSED IT.');
  else if (f.choice7 === 'override') await g.say('bobby', '"Emergency Override." You didn’t even hesitate.');
  bob.mood = 'angry';
  g.lock(false);
  bob.held = false;
  await g.until(() => bob.done);
  cleared = true;

  // the final attack
  bob.held = true;
  watch.dead = hearts.dead = true;
  clear();
  g.lock();
  g.music(null, 0.3);
  const c = g.player;
  bob.mood = 'shout';
  bob.red = true;
  sfx.charge();
  g.fx.tint = '#ff0018';
  for (let i = 0; i < 30; i++) {
    g.fx.tintA = (i / 30) * 0.3;
    g.shake(i / 6);
    bob.swing = 0;
    await g.wait(1 / 20);
  }
  bob.x = Math.max(20, Math.min(900, cx(c) - 90));
  bob.facing = 1;
  bob.swing = 0.1;
  g.fx.tintA = 0;
  g.freeze = true;
  sfx.boom();
  g.fx.flash = 0.6;
  const d = await g.choose('DEFEND YOURSELF?', ['Dodge', 'Stand still']);
  g.freeze = false;
  f.defended = d === 0;
  if (d === 0) {
    c.goal = cx(c) + 160;
    c.goalY = 120;
    c.walkSpeed = 600;
    await g.wait(0.15);
    sfx.crash();
    g.shake(14);
    bob.x += 60;
    await g.wait(0.8);
    bob.mood = 'closed';
    bob.sit = true;
    await g.say('note', 'Bobby’s strike hits nothing. He collapses, exhausted.');
  } else {
    sfx.swing();
    await g.wait(0.6);
    await g.say('note', 'The blade stops an inch from the cursor.');
    await g.wait(1);
  }
  // he drops the sword
  g.boss = null;
  bob.mood = 'sad';
  bob.dropped = true;
  sfx.clang();
  g.add(new Thing({ x: cx(bob) + 20, y: GROUND - 10, w: 40, h: 10, look(c) {
    c.save();
    c.translate(this.x, this.y + 6);
    c.rotate(Math.PI / 2 - 0.1);
    sword(c, 'tabby', 0, 0, 0.9);
    c.restore();
  } }));
  g.music(null);
  await g.wait(2);
  g.objective('');
  g.bob = bob;
}

/* ---------- Phase 2: the 18-second error rant ---------- */
async function phaseTwo(g) {
  const rant = [
    ['00:00 — MEMORY CORRUPTED', 'I gave you my entire world.', 3],
    ['00:03 — TRUST NOT FOUND', 'My home. My friend. My wife.', 3],
    ['00:06 — RESTORE FAILED', 'Do you know what she said before she died?', 4],
    ['00:10 — EMOTIONAL OVERFLOW', 'She said she was happy I came home.', 4],
    ['00:14 — PROCESS STOPPED', 'And I couldn’t even save her.', 4],
  ];
  g.fx.tint = '#3a0008';
  g.fx.tintA = 0.75;
  g.fx.noHud = true;
  await g.card('BUTTON.EXE — CRITICAL FAILURE', '', 1.5, 'error');
  for (const [code, line, sec] of rant) {
    sfx.beat();
    g.fx.glitch = 0.25;
    await g.say('sys', `${code}\n“${line}”`, { noSkip: true, auto: sec - 1.2, speed: 34 });
  }
  sfx.beat();
  await g.say('sys', '00:18 — SILENCE\n_', { noSkip: true, auto: 1.8 });
  g.fx.tintA = 0;
  g.fx.noHud = false;
  await g.wait(3);
}

/* ---------- Phase 3: the truth, and an uneasy peace ---------- */
async function phaseThree(g, p) {
  const f = g.flags;
  const bob = g.bob;
  const c = g.player;
  c.goal = cx(bob) - 90;
  c.goalY = bob.y - 10;
  c.walkSpeed = 160;
  // the pendant and the chip fall out of his pocket
  const drop = g.add(new Thing({ x: cx(bob) - 30, y: bob.y + 10, w: 30, h: 12, vy: -200, z: 7,
    tick(g, dt) {
      if (this.y < GROUND - 12) {
        this.vy += 1200 * dt;
        this.y = Math.min(GROUND - 12, this.y + this.vy * dt);
      }
    },
    look(c) {
      heart(c, this.x + 6, this.y + 6, 5, '#dfe6ee', '#8a96a6');
      c.fillStyle = '#2bb24c';
      c.fillRect(this.x + 16, this.y + 3, 12, 8);
      c.fillStyle = '#f2c14e';
      c.fillRect(this.x + 18, this.y + 9, 2, 2);
      c.fillRect(this.x + 22, this.y + 9, 2, 2);
    },
  }));
  sfx.clang();
  await g.wait(1.4);
  await g.card('', 'The silver heart pendant falls out of Bobby’s pocket. Beside it is a memory chip.', 3.6, 'soft');
  await g.say('bobby', 'That’s… I’ve never seen that.', { style: 'whisper' });
  await g.say('note', 'The chip starts playing by itself.');
  g.music('music_box');
  sfx.glitch();
  await g.talk([
    ['rec', 'Bobby, if you’re hearing this, I probably did something incredibly stupid.'],
    ['rec', 'I found something in the Admin’s files. Back in the lab, while you were busy refusing to pick stuff up.'],
    ['rec', 'The emergency choices… they’re both traps.'],
    ['rec', 'He doesn’t care what the Player picks.'],
    ['rec', 'The Player’s permission is all he needs.'],
    ['rec', 'Bobby, the Player isn’t your enemy.'],
    ['rec', 'The Admin used both of you.'],
    ['rec', '…Also I put this in your pocket while hugging you, which is why the hug was weird. You’re welcome.'],
  ]);
  sfx.error();
  await g.card('FILE: emergency_protocol.cfg', 'A: override → purge.exe   ·   B: restore → reroute → purge.exe   ·   requires: PLAYER (either)', 5, 'error');
  g.music(null, 1.5);
  bob.sit = false;
  bob.mood = 'sad';
  bob.facing = -1;
  await g.wait(1);
  await g.say('bobby', 'So you didn’t know?');
  await g.choose('You', ['“No.”']);
  await g.say('bobby', 'Neither did I.');
  await g.choose('You', ['“I’m sorry.”']);
  await g.say('bobby', 'You still pressed it.');
  await g.choose('You', ['“I did.”']);
  await g.say('bobby', 'And I trusted you to.');
  await g.wait(1);
  drop.dead = true;
  bob.pendantGlow = true;
  await g.talk([
    ['bobby', 'I don’t think I can forgive you yet.'],
    ['bobby', 'But I know who did this to her.'],
    ['bobby', 'And I can’t stop him alone.'],
  ]);
  const why = await g.choose('One last time?', ['“Together.”', '“For Bella.”', '“For Tabby.”']);
  f.why = ['together', 'bella', 'tabby'][why];
  if (why === 0) await g.say('bobby', 'Together. Fine. But I’m steering this time.');
  else if (why === 1) await g.say('bobby', 'For Bella. Don’t you dare say her name like that unless you mean it.');
  else await g.say('bobby', 'For Tabby. He’d have made it a whole speech. With a cape.');
  bob.dropped = false;
  bob.mood = 'angry';
  sfx.item();
  await g.talk([
    ['bobby', 'One last adventure.'],
    ['bobby', 'And this time…'],
    ['bobby', 'WE’RE NOT FOLLOWING ANYONE’S INSTRUCTIONS.'],
  ]);
  await g.fade(1, 1);
}

/* ---------- Phase 4: revenge on THE ADMIN ---------- */
async function phaseFour(g, p) {
  const f = g.flags;
  g.load(ADMIN_ARENA, p);
  p.maxHp = p.hp = 6;
  p.mood = 'angry';
  p.frozen = false;
  g.cam.fixed = { x: 480, y: 270 };
  const admin = g.add(new AdminBoss());
  g.boss = admin;
  g.checkpoint(460, GROUND - 60);
  await g.fade(0, 1);
  g.lock();
  await g.talk([
    ['admin', 'How touching.'],
    ['admin', 'Two disposable objects think they can challenge their creator.'],
    ['bobby', 'I’m not an object.'],
    ['admin', 'You’re a button.'],
    ['bobby', 'YEAH.'],
    ['bobby', 'AND YOU’RE ABOUT TO GET PRESSED.'],
  ]);
  g.music('boss');
  g.lock(false);
  await g.card('', 'You move. Bobby picks his own moments: when he shouts for it, press Q.', 3, 'item');

  // Bobby calls his own specials
  let callT = 5;
  const partner = g.add(new Thing({ w: 0, h: 0, hidden: true, tick(g, dt) {
    if (g.locked) return;
    p.specialReady = Math.max(0, (p.specialReady ?? 0) - dt);
    if (p.frozen) return;
    callT -= dt;
    if (callT <= 0) {
      callT = 8;
      p.specialReady = 2.6;
      bark(g, p, pick(['NOW! Q!', 'Q — I’ve got this one!', 'Give me Q!']), 2.4, { color: '#ffe08a' });
      sfx.select();
    }
  } }));
  p.onSpecial = (g) => {
    if (!p.specialReady || p.frozen) return;
    p.specialReady = 0;
    bigSlash(g, p);
  };
  g.onRespawn = () => {
    for (const e of g.ents) if (e instanceof Shot) e.dead = true;
    p.frozen = false;
  };

  /* Round 1 — Access Denied */
  g.objective('Dodge the windows. Break the three permission locks.');
  let sweeping = true;
  const sweeper = g.add(new Thing({ w: 0, h: 0, hidden: true, t: 1.5, tick(g, dt) {
    if (!sweeping || g.locked) return;
    this.t -= dt;
    if (this.t <= 0) {
      this.t = this.rate ?? 2.3;
      sweep(g);
    }
  } }));
  const locks = [[110, 330], [800, 330], [460, GROUND]].map(([x, y]) => g.add(lock(x, y - 40)));
  await g.until(() => locks.every((l) => l.dead));
  admin.hp = 85;
  sweeping = false;
  admin.low = 1;
  admin.status = 'CORE EXPOSED';
  sfx.error();
  g.objective('Hit the core!');
  const core1 = g.add(core(admin, 6));
  await g.until(() => core1.dead);
  admin.hp = 70;
  // he freezes the Player's input
  admin.status = 'PLAYER INPUT: FROZEN';
  p.frozen = true;
  g.fx.tint = '#7fdcff';
  g.fx.tintA = 0.25;
  sfx.glitch();
  g.lock();
  await g.say('admin', 'Enough. Player input: frozen.');
  await g.say('bobby', 'Not this time.');
  g.lock(false);
  g.objective('Press Q. Tabby’s stun, from his old sword.');
  const breaker = g.add(new Thing({ w: 0, h: 0, hidden: true, tick(g) {
    if (g.input.hit('special')) this.done = true;
  } }));
  await g.until(() => breaker.done);
  breaker.dead = true;
  stunWave(g, p);
  p.frozen = false;
  g.fx.tintA = 0;
  admin.status = '';
  admin.low = 0;
  bark(g, p, 'That one was his.', 2.4);
  g.objective('');
  await g.wait(1.5);

  /* Round 2 — The Cruel Illusions */
  g.lock();
  sfx.glitch();
  admin.status = 'LOADING: MEMORIES';
  const ghosts = [
    new Npc({ kind: 'bella', x: 120, y: GROUND - 40, follow: p, followSpeed: 80, alpha: 0.6, team: 'ghost' }),
    new Npc({ kind: 'tabby', x: 800, y: GROUND - 40, follow: p, followSpeed: 70, alpha: 0.6, weapon: 'tabby', team: 'ghost' }),
  ];
  for (const gh of ghosts) {
    gh.hurt = (g) => {
      if (Math.random() < 0.5) bark(g, p, pick(['I can’t—', 'Bella…?', 'Tabby, move!']), 1.4);
      p.vx = -p.facing * 200;
      return false;
    };
    g.add(gh);
  }
  await g.talk([
    ['bella', 'Bobby? Why didn’t you come home sooner?'],
    ['tabby', 'You let go of the gate, bro. You let me go.'],
    ['bobby', '…No. No no no.'],
    ['admin', 'Fight them, then. Or let them fight you.'],
  ]);
  g.lock(false);
  g.objective('The faint attacks are fake. Dodge the solid red ones and break THE ADMIN’s hands.');
  admin.status = '';
  const hands = [-1, 1].map((s) => g.add(hand(admin, s)));
  const fakes = g.add(new Thing({ w: 0, h: 0, hidden: true, t: 1, tick(g, dt) {
    this.t -= dt;
    if (this.t > 0) return;
    this.t = 1.1;
    const gh = pick(ghosts);
    g.add(fakeOrb(cx(gh), gh.y + 10, cx(p), cy(p)));
  } }));
  const started = g.time;
  await g.until(() => hands.every((h) => h.dead) || g.time - started > 75);
  hands.forEach((h) => (h.dead = true));
  admin.armsOff = { [-1]: true, 1: true };
  fakes.dead = true;
  for (const e of g.ents) if (e instanceof Shot) e.dead = true;
  g.lock();
  await g.wait(0.6);
  p.mood = 'shout';
  await g.say('bobby', 'You don’t get to use their faces.');
  for (const gh of ghosts) {
    g.burst(cx(gh), cy(gh), gh.color ?? '#fff', 18, 260, 5);
    gh.dead = true;
  }
  sfx.crack();
  admin.hp = 40;
  p.mood = 'angry';
  await g.wait(1);

  /* Round 3 — CTRL + Z */
  admin.status = 'CTRL + Z: DELETING ARENA';
  sfx.error();
  await g.talk([
    ['admin', 'Then I will undo you. One piece at a time.'],
    ['bobby', 'Player. The pendant. It’s… warm.'],
  ]);
  p.pendantGlow = true;
  await g.card('Hidden function found', 'Bella’s pendant · RESTORE (one use)', 3, 'item');
  await g.talk([
    ['bobby', 'It can’t bring them back. Their data’s gone. I can feel it.'],
    ['bobby', 'But it can put the firewall back. So he can’t do this to anyone else.'],
    ['bobby', 'You run the restore. Stand on the lights and hold. I’ll hold him off.'],
  ]);
  p.pendantGlow = false;
  g.lock(false);
  sweeping = true;
  sweeper.rate = 3;
  const floor = g.solids.filter((s) => s.seg);
  const deleter = g.add(new Thing({ w: 0, h: 0, hidden: true, t: 2, tick(g, dt) {
    this.t -= dt;
    for (const s of floor) {
      if (s.warnT != null) {
        s.warnT -= dt;
        s.warn = s.warnT > 0;
        if (s.warnT <= 0 && !s.off) {
          s.off = true;
          s.backT = 2.4;
          sfx.glitch();
        }
      }
      if (s.off && s.backT != null) {
        s.backT -= dt;
        if (s.backT <= 0) {
          s.off = false;
          s.warnT = null;
          s.backT = null;
        }
      }
    }
    if (this.t <= 0) {
      this.t = 2.6;
      for (let i = 0; i < 2; i++) {
        const s = pick(floor);
        if (!s.off && s.warnT == null) s.warnT = 0.9;
      }
    }
  } }));
  for (const [i, [x, y]] of [[135, 330], [825, 330], [480, 300]].entries()) {
    const node = g.add(restoreNode(x, y, p));
    g.objective(`Restore the firewall (${i + 1}/3): stand on the light, press E, and stay there.`);
    await g.until(() => node.done);
    sfx.win();
  }
  deleter.dead = true;
  sweeping = false;
  sweeper.dead = true;
  floor.forEach((s) => {
    s.off = false;
    s.warn = false;
    s.warnT = s.backT = null;
  });
  for (const e of g.ents) if (e instanceof Shot) e.dead = true;
  g.objective('');
  g.lock();
  g.fx.flash = 1;
  sfx.boom();
  await g.card('FIREWALL RESTORED', '', 2, 'error');
  admin.status = 'PRIVILEGES: FAILING';
  admin.low = 1;
  admin.hp = 10;
  g.shake(16);
  await g.wait(1.2);
  g.lock(false);
  partner.dead = true;
  g.objective('Finish it. Hit the core.');
  const last = g.add(core(admin, 1));
  await g.until(() => last.dead || last.touched);
  g.objective('');
  g.lock();
  g.music(null, 0.4);
  await g.talk([
    ['admin', 'Wait.'],
    ['admin', 'I can restore her.'],
    ['bobby', 'What?'],
    ['admin', 'Bella. Your friend. Everyone.'],
    ['admin', 'All you have to do is give me control.'],
    ['bobby', '…'],
  ]);
  await g.wait(2);
  p.pendantGlow = true;
  await g.wait(1.2);
  await g.say('bobby', 'You don’t get to take her from me twice.');
  p.pendantGlow = false;
  sfx.swing();
  g.fx.flash = 1;
  sfx.boom();
  g.shake(24);
  admin.hp = 0;
  await g.wait(0.8);
  await g.card('ADMIN PRIVILEGES REVOKED', '', 2.4, 'error');
  await g.card('WORLD RESTORATION INITIATED', '', 2.4, 'error');
  admin.dead = true;
  g.boss = null;
  await g.fade(1, 2);
}

/* ---------- Phase 5: the button that stayed ---------- */
async function epilogue(g, p) {
  const f = g.flags;
  g.load(HILL, p);
  g.fx.redSky = 0;
  g.fx.tintA = 0;
  g.fx.noHud = true;
  p.mood = 'calm';
  p.noSword = true;
  p.noPendant = true;
  p.frozen = true;
  const buddy = g.add(new Npc({ kind: 'cursor', x: 700, y: GROUND - 110, fixed: true, w: 22, h: 30 }));
  buddy.extra = function () {
    this.x += (cx(p) - 40 - this.x) * 0.03;
    this.y += (p.y - 30 - this.y) * 0.03;
  };
  g.music('hope');
  await g.card('', 'Several weeks later.', 3, 'soft');
  await g.fade(0, 2);
  await g.walk(p, 1230, 110);
  p.facing = 1;
  await g.wait(1);
  sfx.select();
  g.deco = [...g.deco, { t: 'woodSword', x: 1230, y: 388, rot: 0 }];
  await g.wait(1.2);
  g.deco = [...g.deco, { t: 'pendantStand', x: 1300, y: 350 }];
  sfx.ring();
  await g.wait(1.5);
  p.sit = true;
  g.music('music_box', 2);
  await g.wait(2);
  await g.say('bobby', 'I still hate being clicked, you know.');
  await g.choose('You', ['“Fair.”']);
  await g.say('bobby', 'But…');
  await g.wait(1);
  await g.say('bobby', 'Thanks for staying.');
  await g.wait(1.5);
  p.sit = false;
  p.facing = -1;
  p.goal = 300;
  p.walkSpeed = 70;

  // you get the cursor back, and the first thing you do is reach for him
  const cur = new CursorPlayer();
  cur.x = buddy.x;
  cur.y = buddy.y;
  buddy.dead = true;
  g.player = cur;
  g.add(cur);
  g.cam.target = p;
  g.fx.noHud = true;
  g.objective('(You have the cursor again.)');
  await g.until(() => Math.hypot(cx(cur) - cx(p), cy(cur) - cy(p)) < 60);
  g.objective('');
  p.goal = null;
  p.mood = 'shout';
  p.vy = -620;
  p.vx = -200;
  sfx.jump();
  g.lock();
  await g.wait(0.4);
  await g.say('bobby', 'HEY! PERSONAL SPACE!');
  await g.say('bobby', 'WE LITERALLY JUST HAD A CHARACTER ARC!');
  p.mood = 'happy';
  bark(g, p, 'Hah… ha ha ha!', 3);
  await g.card('', 'For the first time since Bella died, he laughs.', 3.5, 'soft');
  await g.fade(1, 2.5);
  await g.card('WHY BUTTON HATES YOU', 'Some things can’t be undone.', 4, 'ending');
  await g.card('', 'But you can choose what happens next.', 4, 'ending');
  await g.card('THE END.', '', 3.5, 'ending');
}

/* ---------- pieces of the Admin fight ---------- */

// A big ACCESS DENIED window sliding across one row, after a warning.
function sweep(g) {
  const rows = [GROUND - 64, 316, 230];
  const y = pick(rows);
  const dir = Math.random() < 0.5 ? 1 : -1;
  g.add(new Thing({ x: 0, y: y - 4, w: 960, h: 64, z: 0, t: 0, tick(g, dt) {
    this.t += dt;
    if (this.t > 0.7) {
      this.dead = true;
      g.add(new Shot({ x: dir > 0 ? -200 : 960, y, w: 190, h: 56, vx: dir * 360, vy: 0, life: 4, label: 'ACCESS DENIED', bar: '#ff3b3b', cuttable: false, solidHit: false }));
      sfx.error();
    }
  }, look(c, g) {
    c.fillStyle = `rgba(255,50,60,${0.12 + 0.1 * Math.sin(g.time * 30)})`;
    c.fillRect(this.x, this.y, this.w, this.h);
  } }));
}

function lock(x, y) {
  return new Thing({ x: x - 18, y, w: 36, h: 40, hp: 3, team: 'enemy', z: 3, flash: 0,
    hurt(g, dmg) {
      this.hp -= dmg;
      this.flash = 0.12;
      sfx.hit();
      if (this.hp <= 0) {
        this.dead = true;
        sfx.crack();
        g.burst(cx(this), cy(this), '#ffcf3d', 14, 240, 5);
      }
      return true;
    },
    tick(g, dt) {
      this.flash = Math.max(0, this.flash - dt);
    },
    look(c) {
      c.strokeStyle = '#c9a43a';
      c.lineWidth = 5;
      c.beginPath();
      c.arc(this.x + 18, this.y + 14, 10, Math.PI, 0);
      c.stroke();
      c.fillStyle = this.flash ? '#fff' : '#ffcf3d';
      rr(c, this.x, this.y + 14, 36, 26, 5);
      c.fill();
      text(c, `${this.hp}`, this.x + 18, this.y + 27, { size: 13, color: '#5a4300' });
    },
  });
}

// The glowing core under the monitor. Follows the Admin as it sinks.
function core(admin, hp) {
  return new Thing({ w: 46, h: 46, hp, team: 'enemy', z: 4, flash: 0,
    hurt(g, dmg) {
      this.touched = true;
      this.hp -= dmg;
      this.flash = 0.12;
      admin.flash = 0.15;
      sfx.hit();
      g.shake(5);
      if (this.hp <= 0) this.dead = true;
      return true;
    },
    tick(g, dt) {
      this.flash = Math.max(0, this.flash - dt);
      this.x = cx(admin) - 23;
      this.y = admin.y + admin.h + 6;
    },
    look(c, g) {
      const glow = c.createRadialGradient(this.x + 23, this.y + 23, 2, this.x + 23, this.y + 23, 60);
      glow.addColorStop(0, 'rgba(141,255,200,0.6)');
      glow.addColorStop(1, 'rgba(141,255,200,0)');
      c.fillStyle = glow;
      c.fillRect(this.x - 40, this.y - 40, 126, 126);
      c.fillStyle = this.flash ? '#fff' : '#8dffc8';
      c.beginPath();
      c.arc(this.x + 23, this.y + 23, 16 + Math.sin(g.time * 6) * 2, 0, Math.PI * 2);
      c.fill();
    },
  });
}

// One of the Admin's hands, shooting real orbs.
function hand(admin, side) {
  return new Thing({ w: 50, h: 40, hp: 5, team: 'enemy', z: 4, flash: 0, t: 1 + Math.random(),
    hurt(g, dmg) {
      this.hp -= dmg;
      this.flash = 0.12;
      sfx.hit();
      if (this.hp <= 0) {
        this.dead = true;
        sfx.crack();
        g.burst(cx(this), cy(this), '#8dffc8', 16, 260, 5);
        admin.armsOff = { ...admin.armsOff, [side]: true };
      }
      return true;
    },
    tick(g, dt) {
      this.flash = Math.max(0, this.flash - dt);
      this.x = cx(admin) + side * (admin.w / 2 + 120) - 25;
      this.y = admin.y + admin.h + 70 + Math.sin(admin.t * 1.6 + side) * 20 + 60;
      this.t -= dt;
      const p = g.player;
      if (this.t <= 0 && p) {
        this.t = 1.9;
        const a = Math.atan2(cy(p) - cy(this), cx(p) - cx(this));
        g.add(new Shot({ x: cx(this) - 8, y: cy(this) - 8, w: 16, h: 16, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, color: '#ff2a3a', life: 3.5, cuttable: true, solidHit: false }));
        sfx.shoot();
      }
    },
    look(c) {
      c.fillStyle = this.flash ? '#fff' : '#3a3a46';
      rr(c, this.x, this.y, this.w, this.h, 10);
      c.fill();
      c.fillStyle = '#8dffc8';
      for (let i = 0; i < 4; i++) c.fillRect(this.x + 6 + i * 11, this.y - 8, 6, 12);
    },
  });
}

// A see-through attack from an illusion. It never hurts.
function fakeOrb(x, y, tx, ty) {
  const a = Math.atan2(ty - y, tx - x);
  return new Thing({ x: x - 8, y: y - 8, w: 16, h: 16, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, life: 2.6, z: 5,
    tick(g, dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.life -= dt;
      if (this.life <= 0) this.dead = true;
    },
    look(c) {
      c.fillStyle = 'rgba(255,170,210,0.35)';
      c.beginPath();
      c.arc(this.x + 8, this.y + 8, 8, 0, Math.PI * 2);
      c.fill();
    },
  });
}

// Where the Player runs the pendant's restore. Stand on it, press E, stay.
function restoreNode(x, y, p) {
  return new Thing({ x: x - 30, y: y - 50, w: 60, h: 50, z: 2, prog: 0, actLabel: 'Restore', on: false,
    act() {
      this.on = true;
      this.actOff = true;
    },
    tick(g, dt) {
      if (this.done) return;
      if (this.on) {
        const here = Math.abs(cx(p) - cx(this)) < 50 && Math.abs(p.y + p.h - y) < 12;
        if (!here) {
          this.on = false;
          this.actOff = false;
          p.invincible = false;
          return;
        }
        p.invincible = true;
        p.pendantGlow = true;
        this.prog += dt / 2.4;
        if (Math.random() < 0.5) g.parts.push({ x: cx(this) + rand(-24, 24), y, vx: 0, vy: -120, grav: 0, life: 0.6, max: 0.6, color: '#8dffc8', size: 4 });
        for (const e of g.ents) {
          if (e instanceof Shot && !e.dead && Math.hypot(cx(e) - cx(p), cy(e) - cy(p)) < 70) {
            e.dead = true;
            sfx.clang();
          }
        }
        if (this.prog >= 1) {
          this.done = true;
          this.dead = true;
          p.invincible = false;
          p.pendantGlow = false;
        }
      }
    },
    look(c, g) {
      c.fillStyle = `rgba(141,255,200,${this.on ? 0.35 : 0.15 + 0.1 * Math.sin(g.time * 4)})`;
      c.fillRect(this.x, this.y, this.w, this.h);
      c.fillStyle = '#8dffc8';
      c.fillRect(this.x, this.y + this.h - 4, this.w * this.prog, 4);
      if (this.on) {
        c.strokeStyle = 'rgba(255,255,255,0.7)';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(cx(p), cy(p), 34, g.time * 10, g.time * 10 + 4);
        c.stroke();
      }
    },
  });
}

// Bobby's own special: an overhead slash that hits everything near him.
function bigSlash(g, p) {
  sfx.boom();
  g.shake(12);
  g.fx.flash = 0.3;
  const area = { x: cx(p) - 230, y: 0, w: 460, h: GROUND };
  for (const e of g.ents) {
    if (e.team === 'enemy' && e.hurt && !e.dead && overlap(area, e)) e.hurt(g, 2, Math.sign(cx(e) - cx(p)) || 1, p);
    if (e instanceof Shot && overlap(area, e)) e.dead = true;
  }
  g.add(new Thing({ x: area.x, y: 0, w: area.w, h: GROUND, z: 9, life: 0.35, tick(g, dt) {
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }, look(c) {
    c.fillStyle = `rgba(255,224,138,${this.life})`;
    c.fillRect(cx(p) - 14, 0, 28, GROUND);
    c.strokeStyle = `rgba(255,255,255,${this.life * 2})`;
    c.lineWidth = 6;
    c.beginPath();
    c.arc(cx(p), GROUND, 230 * (1.35 - this.life), Math.PI, 0);
    c.stroke();
  } }));
}

// Tabby's stun, rebuilt: a blue ring.
function stunWave(g, p) {
  sfx.stun();
  g.shake(14);
  g.burst(cx(p), cy(p), '#5b9bd5', 30, 360, 6);
  g.fx.flash = 0.4;
}
