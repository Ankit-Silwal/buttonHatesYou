import { GROUND, ground, plat, block, edges } from '../build';
import { Npc, Crab, Bat, Thing, makeTabby, bark, vanishingPlatform, fallingPlatform } from '../actors';
import { sfx } from '../audio';
import { cx } from '../engine';
import { rr, text, drawButton, cursorShape } from '../draw';
import { checkpointPost, coins, coreFragment, heartAt } from './common';

// Episode 4 — The Forgotten Kingdom. A city with rectangular holes where
// people used to be, an old Backspace who remembers, and three memories that
// end with the Player's name.

const W = 4300;
export const LEVEL = {
  w: W,
  theme: 'ruins',
  solids: [
    ground(0, 1020, 'ruin'),
    ground(1720, 640, 'ruin'),
    ground(2900, 340, 'ruin'),
    ground(3780, 520, 'ruin'),
    plat(2120, 360, 110, 'stone'),
    plat(2260, 270, 110, 'stone'),
    block(2440, 380, 70, 80, 'ruin'),
    ...edges(W),
  ],
  deco: [
    { t: 'house', x: 90, y: GROUND, w: 200, h: 140, color: '#cfc6bb', roof: '#8f857b' },
    { t: 'hole', x: 140, y: GROUND - 20, w: 90, h: 100 },
    { t: 'tag', x: 190, y: GROUND - 210, text: 'Button_001' },
    { t: 'house', x: 360, y: GROUND, w: 180, h: 130, color: '#c4bdb4', roof: '#7d756c', empty: true },
    { t: 'tag', x: 450, y: GROUND - 200, text: 'Button_002' },
    { t: 'hole', x: 600, y: GROUND, w: 160, h: 180 },
    { t: 'tag', x: 680, y: GROUND - 220, text: 'User_Not_Found', color: '#ff9c9c' },
    { t: 'rubble', x: 610, y: GROUND, w: 140 },
    { t: 'lamppost', x: 860, y: GROUND, off: true },
    { t: 'tag', x: 1900, y: GROUND - 160, text: 'Button_017' },
    { t: 'hole', x: 1830, y: GROUND, w: 120, h: 120 },
    { t: 'house', x: 3000, y: GROUND, w: 180, h: 130, color: '#c4bdb4', roof: '#7d756c', broken: true },
    { t: 'tag', x: 3090, y: GROUND - 200, text: 'Family_Of_Four' },
    { t: 'hole', x: 3880, y: GROUND, w: 100, h: 150 },
    { t: 'tag', x: 3930, y: GROUND - 190, text: 'Sector_9' },
  ],
  spawn: { x: 60, y: GROUND - 60 },
};

export default async function play(g, p) {
  const f = g.flags;
  f.slam = true;
  f.doubleJump = true;
  g.fx.fade = 1;
  g.load(LEVEL, p);
  g.music('ruins');
  const tabby = makeTabby(g, p, 20, GROUND - 40);
  g.lock();
  await g.card('Episode 4', 'The Forgotten Kingdom', 3);
  await g.fade(0, 1.2);
  await g.talk([
    ['tabby', 'This was a city. I saw it on a postcard once.'],
    ['bobby', 'Where is everyone?'],
    ['tabby', 'Maybe they’re… on holiday?'],
    ['bobby', 'Tabby. Somebody cut that house in half. With a ruler.'],
  ]);
  g.lock(false);
  g.objective('Explore the city.');
  bark(g, p, 'The names are still floating where they used to live.', 3);

  // Old Backspace
  const old = g.add(new Npc({ kind: 'backspace', x: 900, y: GROUND - 40, facing: -1, walkSpeed: 50 }));
  await g.reach(760);
  g.lock();
  tabby.follow = null;
  p.facing = 1;
  await g.talk([
    ['backspace', 'Visitors. Haven’t had visitors since… since there was anyone to visit.'],
    ['bobby', 'What happened here?'],
    ['backspace', 'The Admin happened. Once, he only kept things tidy. Lights on, paths clear. We liked him.'],
    ['backspace', 'Then the kingdom grew. And he wanted to decide everything. What we built. Where we walked. Who we were.'],
    ['backspace', 'When people said no, he started calling them corrupted data.'],
    ['tabby', 'And then…?'],
    ['backspace', 'Then the houses started disappearing. Clean little rectangles. Like someone pressed delete.'],
    ['backspace', 'He never destroyed anything himself.'],
    ['bobby', 'Then who did?'],
    ['backspace', 'He made someone else press the button.'],
    2,
    ['backspace', 'The old memories are still stuck in the crystals around here. If you want to know, look. If you don’t, keep walking. Both are fine. One is braver.'],
  ]);
  old.goal = 1000;
  tabby.follow = p;
  g.lock(false);
  g.objective('Cross the broken district. The platforms flicker in and out.');
  checkpointPost(g, 1000);

  // vanishing platforms over the void
  [[1060, 400], [1200, 350], [1340, 300], [1480, 350], [1610, 400]].forEach(([x, y], i) =>
    g.addSolid(vanishingPlatform(x, y, 100, 3.2, i * 0.18))
  );
  coins(g, 1220, 310, 3);
  coins(g, 1360, 260, 3);
  heartAt(g, 1500, 300);
  await g.reach(1740);
  checkpointPost(g, 1760);

  // memory 1
  await crystal(g, p, 1980, memoryChoice);
  bark(g, tabby, 'That cursor… it looked like yours.', 2.6);

  // the switch puzzle
  g.objective('The bridge is offline. Hit all three permission switches.');
  let on = 0;
  const switches = [[2160, 320], [2300, 230], [2470, 340]].map(([x, y]) =>
    g.add(new Thing({ x, y, w: 26, h: 26, team: 'enemy', z: 2, lit: false,
      hurt(g) {
        if (this.lit) return false;
        this.lit = true;
        on++;
        sfx.confirm();
        g.burst(cx(this), this.y + 13, '#7dffe0', 10, 160, 4);
        return true;
      },
      look(c, g) {
        c.fillStyle = '#3a3440';
        rr(c, this.x - 3, this.y - 3, this.w + 6, this.h + 6, 6);
        c.fill();
        c.fillStyle = this.lit ? '#7dffe0' : Math.sin(g.time * 4) > 0 ? '#ff6b5e' : '#a8433a';
        rr(c, this.x, this.y, this.w, this.h, 5);
        c.fill();
        text(c, this.lit ? '✓' : '⏻', this.x + 13, this.y + 14, { size: 14, color: '#1d1a22' });
      },
    }))
  );
  await g.until(() => on >= 3);
  sfx.win();
  g.objective('');
  const bridge = g.addSolid({ x: 2360, y: GROUND, w: 540, h: 16, kind: 'glitch' });
  g.shake(6);
  bark(g, p, 'A bridge made of permissions. Very reassuring.', 2.6);
  switches.forEach((s) => (s.team = null));
  g.add(new Crab({ x: 2700, y: GROUND - 40 }));
  g.add(new Bat({ x: 2800, y: 280 }));
  await g.reach(2920);
  checkpointPost(g, 2930);

  // memory 2
  await crystal(g, p, 3120, memoryVillage);
  await g.talk([
    ['bobby', 'They just… stopped being there.'],
    ['tabby', 'Like a file.'],
  ]);
  g.lock(false);

  // falling platforms
  g.objective('Keep going.');
  [3270, 3400, 3530, 3660].forEach((x, i) => g.addSolid(fallingPlatform(x, 400 - (i % 2) * 50, 90, { kind: 'ruin' })));
  g.add(new Bat({ x: 3450, y: 220 }));
  g.add(new Bat({ x: 3650, y: 240 }));
  coins(g, 3280, 360, 3);
  coins(g, 3540, 360, 3);
  await g.reach(3800);
  checkpointPost(g, 3810);
  g.objective('');

  // memory 3
  await crystal(g, p, 3960, memoryAuth);

  // the question
  g.lock();
  tabby.follow = null;
  p.facing = 1;
  p.mood = 'worried';
  await g.wait(1);
  await g.say('bobby', 'Hey, Player…');
  await g.say('bobby', '…are you sure we’re doing the right thing?');
  const a = await g.choose('', ['“I think so.”', '“I don’t know.”', '“Trust me.”']);
  f.trust = ['think', 'unsure', 'trust'][a];
  if (a === 0) await g.talk([['bobby', 'You think so. Okay. Thinking is… something.'], ['bobby', 'I’ll take "think so".']]);
  else if (a === 1) await g.talk([['bobby', 'Yeah. Me neither.'], ['bobby', 'At least you’re honest. That’s more than the guy in the TV.']]);
  else await g.talk([['bobby', '"Trust me." That’s what he says too.'], 1.5, ['bobby', '…But you’re not him. Right?'], ['bobby', 'Okay. I’ll trust you.']]);
  await g.say('tabby', 'Whatever this is, we stick together. Deal?');
  await g.say('bobby', 'Deal.');
  p.mood = 'calm';
  tabby.follow = p;
  g.lock(false);

  // fragment 2
  const altar = { t: 'rock', x: 4140, y: GROUND, r: 34, color: '#7d7470' };
  g.deco = [...g.deco, altar];
  const frag = coreFragment(g, 4128, GROUND - 90, 2);
  g.objective('Take the second Core Fragment.');
  await frag.done;
  g.objective('');
  g.lock();
  sfx.item();
  await g.card('Core Fragment 2 of 3', 'Warm. Too warm.', 2.4, 'item');
  g.music(null, 1);
  sfx.rumble();
  for (let i = 0; i <= 20; i++) {
    g.fx.redSky = i / 20 * 0.45;
    await g.wait(0.08);
  }
  await g.talk([
    ['tabby', 'Uh. Was the sky always that colour?'],
    ['bobby', 'The Admin did say things were getting worse.'],
    ['tabby', 'Yeah. Must be him getting stronger. The bad guy. Out there. Somewhere.'],
  ]);
  await g.wait(1);
  g.fx.letterbox = 1;
  await g.card('', 'Far away, the protective shield around Bobby’s village has started failing.', 4.5, 'soft');
  await g.fade(1, 1.5);
  g.fx.letterbox = 0;
  g.lock(false);
}

/* ---------- memory crystals ---------- */
async function crystal(g, p, x, scene) {
  let used = false;
  const c = g.add(new Thing({ x: x - 16, y: GROUND - 56, w: 32, h: 56, actLabel: 'Touch the memory',
    look(ctx, g) {
      const glow = ctx.createRadialGradient(this.x + 16, this.y + 24, 2, this.x + 16, this.y + 24, 60);
      glow.addColorStop(0, used ? 'rgba(160,160,180,0.2)' : 'rgba(150, 200, 255, 0.5)');
      glow.addColorStop(1, 'rgba(150, 200, 255, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(this.x - 50, this.y - 40, 132, 120);
      ctx.fillStyle = used ? '#8a8fa0' : '#a9d4ff';
      const b = Math.sin(g.time * 2) * 3;
      ctx.beginPath();
      ctx.moveTo(this.x + 16, this.y + b);
      ctx.lineTo(this.x + 32, this.y + 26 + b);
      ctx.lineTo(this.x + 16, this.y + 52 + b);
      ctx.lineTo(this.x, this.y + 26 + b);
      ctx.fill();
    },
    act() {
      used = true;
      this.actOff = true;
    },
  }));
  g.objective('A memory crystal. (E)');
  await g.until(() => used);
  g.objective('');
  g.lock();
  if (p.tabby) p.tabby.follow = null;
  sfx.glitch();
  g.fx.flash = 1;
  g.fx.bw = 1;
  g.fx.vignette = 0.7;
  const music = 'ruins';
  g.music('music_box', 0.5);
  await g.wait(0.6);
  await scene(g, cx(c));
  g.fx.bw = 0;
  g.fx.vignette = 0;
  g.fx.flash = 0.8;
  g.music(music);
  if (p.tabby) p.tabby.follow = p;
  g.lock(false);
}

// Memory 1: an unknown cursor making a choice.
async function memoryChoice(g, x) {
  const props = [];
  const add = (t) => (props.push(t), g.add(t));
  const btn = (bx, label, color) =>
    add(new Thing({ x: bx, y: 200, w: 120, h: 60, z: 8, pressed: 0,
      look(c) {
        c.fillStyle = 'rgba(0,0,0,0.35)';
        rr(c, this.x, this.y + 6, this.w, this.h, 12);
        c.fill();
        c.fillStyle = color;
        rr(c, this.x, this.y + this.pressed * 5, this.w, this.h - 4, 12);
        c.fill();
        text(c, label, this.x + this.w / 2, this.y + this.h / 2 + this.pressed * 5, { size: 18, color: '#fff' });
      },
    }));
  const keep = btn(x - 170, 'KEEP', '#5b9bd5');
  const del = btn(x + 50, 'DELETE', '#e2674f');
  const cur = add(new Npc({ kind: 'cursor', x: x - 20, y: 60, fixed: true, z: 9, w: 34, h: 44 }));
  await g.say('recorder', 'Memory 0417. A new cursor has appeared. It is being asked to choose.');
  for (const [tx, ty, d] of [[x - 120, 230, 1.2], [x + 100, 230, 1.2], [x - 110, 225, 0.9], [x + 105, 228, 0.7]]) {
    const sx = cur.x;
    const sy = cur.y;
    for (let t = 0; t < d; t += 1 / 60) {
      const k = t / d;
      cur.x = sx + (tx - sx) * k;
      cur.y = sy + (ty - sy) * k;
      await g.wait(1 / 60);
    }
    await g.wait(0.4);
  }
  await g.say('recorder', 'It hesitates.');
  del.pressed = 1;
  sfx.select();
  g.fx.flash = 0.6;
  await g.wait(0.6);
  await g.say('recorder', 'Then it chooses. Selection accepted.');
  props.forEach((t) => (t.dead = true));
}

// Memory 2: an entire village disappearing.
async function memoryVillage(g, x) {
  const props = [];
  for (let i = 0; i < 4; i++) {
    const hx = x - 330 + i * 170;
    props.push(g.add(new Thing({ x: hx, y: GROUND - 110, w: 130, h: 110, z: 8, gone: false,
      look(c) {
        if (this.gone) {
          c.fillStyle = 'rgba(10,10,20,0.9)';
          c.fillRect(this.x, this.y - 40, this.w, this.h + 40);
          c.strokeStyle = '#59f';
          c.setLineDash([6, 6]);
          c.strokeRect(this.x, this.y - 40, this.w, this.h + 40);
          c.setLineDash([]);
          return;
        }
        c.fillStyle = '#f4e1c8';
        c.fillRect(this.x, this.y, this.w, this.h);
        c.fillStyle = '#c9523e';
        c.beginPath();
        c.moveTo(this.x - 10, this.y);
        c.lineTo(this.x + this.w / 2, this.y - 40);
        c.lineTo(this.x + this.w + 10, this.y);
        c.fill();
        drawButton(c, { x: this.x + 50, y: this.y + 70, w: 26, h: 34, color: ['#f2c14e', '#7cc6a4', '#a58bd6', '#5b9bd5'][i], dark: '#555', t: g.time, mood: 'calm', facing: 1 });
      },
    })));
  }
  await g.say('recorder', 'Memory 0418. Sector 7. Population: 212.');
  await g.wait(0.8);
  for (const h of props) {
    h.gone = true;
    sfx.glitch();
    g.fx.flash = 0.3;
    g.shake(5);
    await g.wait(0.9);
  }
  await g.say('recorder', 'Sector 7 cleaned. Inhabitants marked: unnecessary.');
  props.forEach((t) => (t.dead = true));
}

// Memory 3: the log that ends with the Player.
async function memoryAuth(g, x) {
  const lines = [];
  const scr = g.add(new Thing({ x: x - 220, y: 90, w: 440, h: 250, z: 8,
    look(c) {
      c.fillStyle = '#05080a';
      rr(c, this.x, this.y, this.w, this.h, 10);
      c.fill();
      lines.forEach((l, i) => text(c, l, this.x + 20, this.y + 28 + i * 24, { size: 15, color: l.startsWith('AUTH') ? '#ff5a5a' : '#8dffc8', align: 'left' }));
    },
  }));
  await g.say('recorder', 'Memory 0419. The last one.');
  for (const l of ['> PURGE REQUEST: SECTOR 9', '> SUBMITTED BY: ADMIN', '> STATUS: REJECTED (needs outside permission)', '> REQUESTING AUTHORIZATION…', '> …', '> …']) {
    lines.push(l);
    sfx.blip(0.6);
    await g.wait(0.7);
  }
  lines.push('AUTHORIZATION: PLAYER');
  sfx.error();
  g.fx.glitch = 1.2;
  g.shake(10);
  await g.wait(1.2);
  scr.dead = true;
  g.fx.flash = 1;
  g.music(null, 0.05);
  await g.card('', 'MEMORY TERMINATED', 1.6, 'error');
  await g.wait(0.5);
}
